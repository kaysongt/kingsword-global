"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { finalExamEligibility, getFinalExam } from '@/lib/final-exam-data';
import { answersBeforeDeadline, examAnswersSchema, gradeFinalExam, parseFinalQuestions } from '@/lib/final-exam';

export async function requestFinalExam(form: FormData) {
  const user = await requireUser();
  if (user.role !== 'STUDENT') redirect('/admin/final-assessment');
  const church = z.string().trim().min(2).max(200).parse(form.get('church'));
  const exam = await getFinalExam();
  if (!exam?.published) throw new Error('The final assessment is not available yet.');
  // Repeat requests must not change an approved registration or increase attempts.
  const registration = await db.finalExamRegistration.upsert({ where: { examId_userId: { examId: exam.id, userId: user.id } }, create: { examId: exam.id, userId: user.id, church }, update: {} });
  await db.finalExamRegistration.updateMany({ where: { id: registration.id, church: '', localApproved: false }, data: { church } });
  revalidatePath('/final-assessment');
}

export async function startFinalExam(form: FormData) {
  const user = await requireUser();
  if (user.role !== 'STUDENT') redirect('/admin/final-assessment');
  const exam = await getFinalExam();
  if (!exam?.published) throw new Error('The final assessment is not available yet.');
  parseFinalQuestions(exam.questions);
  const existing = await db.finalExamRegistration.findUnique({
    where: { examId_userId: { examId: exam.id, userId: user.id } },
  });
  if (!await finalExamEligibility(user.id, existing?.localApproved ?? false)) throw new Error('Complete the online course or ask your administrator to approve local-church access.');
  const church = existing?.church || z.string().trim().min(2).max(200).parse(form.get('church'));
  const registration = await db.finalExamRegistration.upsert({
    where: { examId_userId: { examId: exam.id, userId: user.id } },
    create: { examId: exam.id, userId: user.id, church },
    update: {},
  });
  await db.$transaction(async tx => {
    // Updating the registration obtains a row lock, serializing simultaneous starts and approvals.
    const locked = await tx.finalExamRegistration.update({ where: { id: registration.id }, data: { version: { increment: 1 } } });
    if (!locked.church) await tx.finalExamRegistration.update({ where: { id: locked.id }, data: { church } });
    const last = await tx.finalExamAttempt.findFirst({ where: { registrationId: registration.id }, orderBy: { number: 'desc' } });
    if (last && !last.submittedAt) return;
    if (last?.scorePct != null && last.scorePct >= last.passMark) throw new Error('You have already passed this assessment.');
    const number = (last?.number ?? 0) + 1;
    if (number > locked.attemptsAllowed) throw new Error('An administrator must approve another attempt.');
    await tx.finalExamAttempt.create({ data: { registrationId: registration.id, number, questions: exam.questions!, passMark: exam.passMark, answers: {}, expiresAt: new Date(Date.now() + exam.durationSeconds * 1000) } });
  });
  revalidatePath('/final-assessment');
  redirect('/final-assessment');
}

export async function saveFinalExam(attemptId: string, version: number, input: unknown, finish: boolean) {
  const user = await requireUser();
  const parsed = examAnswersSchema.safeParse(input);
  if (!parsed.success || !Number.isInteger(version) || typeof finish !== 'boolean') return { error: 'Invalid answers. Reload this page and try again.' };
  return db.$transaction(async tx => {
    const found = await tx.finalExamAttempt.findFirst({ where: { id: attemptId, registration: { userId: user.id } }, select: { id: true } });
    if (!found) return { error: 'Assessment attempt not found.' };
    // Row lock protects autosave, timeout and submission from races and repeat grading.
    await tx.$queryRaw`SELECT id FROM "FinalExamAttempt" WHERE id = ${found.id} FOR UPDATE`;
    const attempt = await tx.finalExamAttempt.findUniqueOrThrow({ where: { id: found.id } });
    if (attempt.submittedAt) return { closed: true, version: attempt.version };
    const now = new Date();
    const expired = now >= attempt.expiresAt;
    if (!expired && version !== attempt.version) return { error: 'This attempt was updated in another tab. Reload to continue with your saved answers.' };
    const answers = answersBeforeDeadline(now, attempt.expiresAt, examAnswersSchema.parse(attempt.answers), parsed.data);
    const close = finish || expired;
    const grade = close ? gradeFinalExam(parseFinalQuestions(attempt.questions), answers) : {};
    const updated = await tx.finalExamAttempt.update({ where: { id: attempt.id }, data: { answers, version: { increment: 1 }, ...(close ? { submittedAt: now, ...grade } : {}) } });
    return { closed: close, version: updated.version };
  });
}

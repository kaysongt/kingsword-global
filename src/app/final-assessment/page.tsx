import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getFinalExam, finalExamEligibility, finalizeExpiredExams } from '@/lib/final-exam-data';
import { examAnswersSchema, parseFinalQuestions, publicQuestions } from '@/lib/final-exam';
import { FinalExamRunner } from '@/components/final-exam-runner';
import { requestFinalExam, startFinalExam } from './actions';
import { Brand } from '@/components/brand';

export const metadata = { title: 'BBT Final Assessment' };
export default async function FinalAssessmentPage() {
  const user = await getCurrentUser();
  if (user && user.role !== 'STUDENT') redirect('/admin/final-assessment');
  const exam = await getFinalExam();
  if (user && exam) await finalizeExpiredExams(exam.id, user.id);
  const registration = user && exam ? await db.finalExamRegistration.findUnique({ where: { examId_userId: { examId: exam.id, userId: user.id } }, include: { attempts: { orderBy: { number: 'desc' }, take: 1 } } }) : null;
  const attempt = registration?.attempts[0];
  const eligible = user ? await finalExamEligibility(user.id, registration?.localApproved ?? false) : false;
  const passed = attempt?.scorePct != null && attempt.scorePct >= attempt.passMark;
  const mayStart = !passed && (!attempt || attempt.number < (registration?.attemptsAllowed ?? 1));
  return <main className="min-h-screen bg-[var(--paper)] px-5 py-8 md:py-12"><div className="mx-auto max-w-6xl">
    <div className="flex items-center justify-between gap-4"><Brand /><Link href={eligible && !registration?.localApproved ? '/dashboard' : '/believers-training'} className="button-secondary">{eligible && !registration?.localApproved ? 'My learning' : 'Believers Training'}</Link></div>
    <header className="mt-12 max-w-3xl"><span className="eyebrow">KingsWord Training Institute</span><h1 className="display mt-4 text-5xl font-semibold md:text-6xl">BBT Final Assessment</h1><p className="mt-5 text-lg leading-8">One final assessment for students who studied online or completed Basic Believers Training at their local church.</p></header>
    <div className="mt-7 flex flex-wrap gap-3 text-sm font-bold">{['50 questions', '60 minutes', 'Pass: 35/50 (70%)'].map(text => <span key={text} className="rounded-full border border-[var(--line)] bg-[var(--paper-light)] px-5 py-3">{text}</span>)}</div>
    {!exam?.published ? <p className="mt-8 rounded-xl bg-[var(--paper-light)] p-6">The final assessment is being prepared. Please check back soon.</p> : !user ? <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper-light)] p-7"><h2 className="text-2xl font-bold">Sign in to take your assessment</h2><p className="mt-3 leading-7">Use your existing student account. If you studied at a local church, create an account and request exam access with your church name. An administrator will approve access without requiring you to repeat the online lessons.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/login?next=/final-assessment" className="button-primary">Sign in</Link><Link href="/signup?next=/final-assessment" className="button-secondary">Create an account</Link></div></section> : attempt && !attempt.submittedAt ? <FinalExamRunner key={attempt.id} attemptId={attempt.id} questions={publicQuestions(parseFinalQuestions(attempt.questions))} initialAnswers={examAnswersSchema.parse(attempt.answers)} version={attempt.version} remainingSeconds={Math.max(0, Math.floor((attempt.expiresAt.getTime() - new Date().getTime()) / 1000))} /> : <>
      {attempt?.submittedAt && <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper-light)] p-7"><span className="eyebrow">Attempt {attempt.number} · {passed ? 'Passed' : 'Not yet passed'}</span><h2 className="display mt-4 text-5xl font-bold">{attempt.scorePct}%</h2><p className="mt-3">{attempt.correct} correct answers out of 50. Pass mark: {attempt.passMark}%.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{(attempt.moduleResults as { module: number; correct: number; total: number }[] | null)?.map(result => <p key={result.module} className="rounded-xl bg-[var(--paper)] p-4">Module {result.module}: <strong>{result.correct}/{result.total}</strong></p>)}</div><p className="mt-5 text-sm">{passed ? 'Your result is saved and available to your administrator.' : mayStart ? 'Your administrator has approved another attempt.' : 'Contact your administrator to request a retake.'}</p></section>}
      {eligible && mayStart && <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper-light)] p-7"><h2 className="text-2xl font-bold">Ready when you are</h2><p className="mt-4 max-w-3xl leading-7">Choose the best answer to each question. The 60-minute timer starts when you press the button below and cannot be paused. Answers save while you work. Use a reliable connection. Unanswered questions receive zero marks.</p><form action={startFinalExam} className="mt-6 grid max-w-xl gap-4">
        <p>Taking the assessment as <strong>{user.fullName}</strong></p>
        {registration?.church ? <p>Church or location: {registration.church}</p> : (
          <div className="field">
            <label htmlFor="assessment-church">Church or location</label>
            <input id="assessment-church" name="church" required minLength={2} maxLength={200} placeholder="Church name and city, or No home church" />
          </div>
        )}
        <button className="button-primary">Start {attempt ? 'next attempt' : 'final assessment'} · 60 minutes</button></form></section>}
      {!eligible && !passed && <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper-light)] p-7"><h2 className="text-2xl font-bold">Your route to the final exam</h2><p className="mt-3 leading-7">Online students: complete all seven modules and their checkpoints to unlock the exam.</p><p className="mt-3 leading-7">Local-church students: request access below. Approval unlocks only this final assessment and does not mark online lessons as completed.</p>{registration?.church ? <p role="status" className="mt-5 rounded-xl bg-[var(--sage-light)] p-5">Request recorded for {registration.church}. {registration.localApproved ? 'Access is approved. Ask your administrator to check your enrollment status.' : 'Waiting for administrator approval.'}</p> : <form action={requestFinalExam} className="mt-5 grid max-w-xl gap-4"><div className="field"><label htmlFor="church">Church and location where you completed BBT</label><input id="church" name="church" required minLength={2} maxLength={200} placeholder="Church name, city" /></div><button className="button-primary">Request local-church exam access</button></form>}</section>}
    </>}
  </div></main>;
}

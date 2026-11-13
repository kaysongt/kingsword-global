import { requireStaff } from '@/lib/auth';
import { db } from '@/lib/db';
import { getFinalExam, finalizeExpiredExams } from '@/lib/final-exam-data';
import { parseFinalQuestions } from '@/lib/final-exam';
import { approveFinalExam } from './actions';
import Link from 'next/link';
import { z } from 'zod';

export default async function AdminFinalAssessmentPage() {
  const user = await requireStaff();
  const exam = await getFinalExam();
  if (!exam) return <div className="p-10">The final assessment has not been imported yet.</div>;
  await finalizeExpiredExams(exam.id);
  const registrations = await db.finalExamRegistration.findMany({ where: { examId: exam.id }, include: { user: { select: { fullName: true, email: true } }, attempts: { orderBy: { number: 'desc' } } }, orderBy: { createdAt: 'desc' } });
  const questions = parseFinalQuestions(exam.questions);
  const downloads = await db.auditLog.findMany({
    where: { entityType: 'FinalExam', entityId: exam.id, action: 'final_exam.printable_download' },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, metadata: true, createdAt: true },
  });
  const detailsSchema = z.object({ church: z.string(), location: z.string() });
  return <main className="mx-auto max-w-6xl px-5 py-10 md:px-10"><span className="eyebrow">Assessment administration</span><h1 className="display mt-4 text-5xl font-semibold">BBT final assessment</h1><p className="mt-5 leading-7">50 questions · {exam.durationSeconds / 60} minutes · {exam.passMark}% to pass. Review results, approve local-church students, and authorize retakes.</p><p className="mt-3">Student link: <Link className="font-bold underline" href="/final-assessment">Final assessment</Link></p><Link href="/final-assessment/print" className="button-secondary mt-5">Printable assessment</Link>
    <section className="mt-9"><h2 className="text-2xl font-bold">Students and results</h2>{registrations.length === 0 && <p className="mt-4">No requests or attempts yet.</p>}<div className="mt-5 grid gap-5">{registrations.map(reg => { const last = reg.attempts[0]; return <article key={reg.id} className="rounded-2xl border border-[var(--line)] bg-[var(--paper-light)] p-6"><h3 className="text-xl font-bold">{reg.user.fullName}</h3><p className="mt-1 break-all text-sm">{reg.user.email}</p><p className="mt-3 text-sm">{reg.church ? 'Church or location: ' + reg.church + (reg.localApproved ? ' · Local-church access approved' : last ? ' · Online student' : ' · Awaiting approval') : 'Church not recorded'}</p><div className="mt-4 flex flex-wrap gap-3">{user.role === 'ADMIN' && reg.church && !reg.localApproved && !last && <form action={approveFinalExam}><input type="hidden" name="registrationId" value={reg.id} /><input type="hidden" name="mode" value="local" /><button className="button-primary">Approve exam access</button></form>}{user.role === 'ADMIN' && last?.submittedAt && (last.scorePct ?? 0) < last.passMark && reg.attemptsAllowed <= last.number && <form action={approveFinalExam}><input type="hidden" name="registrationId" value={reg.id} /><input type="hidden" name="mode" value="retake" /><button className="button-secondary">Approve one retake</button></form>}</div>{reg.attempts.map(attempt => <div key={attempt.id} className="mt-5 rounded-xl bg-[var(--paper)] p-4"><p className="font-bold">Attempt {attempt.number}: {attempt.submittedAt ? `${attempt.correct}/50 · ${attempt.scorePct}% · ${(attempt.scorePct ?? 0) >= attempt.passMark ? 'Passed' : 'Not passed'}` : attempt.expiresAt < new Date() ? 'Time elapsed — result finalizes when student returns' : 'In progress'}</p><p className="mt-2 text-xs">Started {attempt.startedAt.toISOString().replace('T', ' ').slice(0, 16)} UTC</p>{attempt.moduleResults && <div className="mt-3 flex flex-wrap gap-3 text-sm">{(attempt.moduleResults as { module: number; correct: number; total: number }[]).map(result => <span key={result.module}>M{result.module}: {result.correct}/{result.total}</span>)}</div>}</div>)}</article>; })}</div></section>
    <section className="mt-10">
      <h2 className="text-2xl font-bold">Recent printable exam downloads</h2>
      {downloads.length === 0 ? <p className="mt-4">No downloads yet.</p> : (
        <ul className="mt-4 grid gap-3">
          {downloads.map(download => {
            const details = detailsSchema.safeParse(download.metadata);
            if (!details.success) return null;
            return (
              <li key={download.id} className="rounded-xl border border-[var(--line)] p-4">
                <strong>{details.data.church}</strong> · {details.data.location}
                <time className="block text-sm" dateTime={download.createdAt.toISOString()}>
                  {download.createdAt.toISOString().replace('T', ' ').slice(0, 16)} UTC
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </section>
    <details className="mt-10 rounded-2xl border border-[var(--line)] p-6"><summary className="cursor-pointer text-xl font-bold">Review all 50 questions and marking scheme</summary><p className="mt-4 text-sm">This answer key is available only to staff.</p><div className="mt-6 grid gap-6">{questions.map(q => <article key={q.number}><p className="text-xs font-bold">Module {q.module}</p><h3 className="mt-2 font-bold">{q.number}. {q.prompt}</h3><ol className="mt-3 grid gap-2">{q.options.map((option, i) => <li key={i} className={i === q.correctIndex ? 'font-bold text-[var(--forest)]' : ''}>{String.fromCharCode(65 + i)}. {option}{i === q.correctIndex ? ' — Correct answer' : ''}</li>)}</ol></article>)}</div></details>
  </main>;
}

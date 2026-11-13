import Link from "next/link";
import { redirect } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { getCurrentUser } from "@/lib/auth";
import { getFinalExam } from "@/lib/final-exam-data";
import { parseFinalQuestions, publicQuestions } from "@/lib/final-exam";

export const metadata = { title: "Printable BBT Final Assessment" };

export default async function PrintableAssessmentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/final-assessment/print");
  if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
    return (
      <main className="page-shell py-16">
        <h1 className="display text-4xl">Printable BBT Final Assessment</h1>
        <p className="my-5">Ask your church’s BBT coordinator for a paper copy.</p>
        <Link href="/final-assessment" className="button-primary">Go to the online assessment</Link>
      </main>
    );
  }

  const exam = await getFinalExam();
  if (!exam) return <main className="page-shell py-16">The final assessment has not been imported yet.</main>;
  const questions = publicQuestions(parseFinalQuestions(exam.questions));

  return (
    <main className="mx-auto max-w-3xl bg-white px-5 py-8 text-black print:max-w-none print:p-0">
      <nav className="mb-8 flex flex-wrap items-center gap-3 print:hidden" aria-label="Print controls">
        <Link href="/admin/final-assessment" className="button-secondary">Assessment administration</Link>
        <PrintButton label="Print assessment" />
      </nav>
      <h1 className="text-3xl font-bold">BBT Final Assessment</h1>
      <p className="mt-3">{questions.length} questions · {exam.durationSeconds / 60} minutes · {exam.passMark}% to pass</p>
      <div className="my-6 grid gap-5 text-sm">
        <p>Name ______________________________________________</p>
        <p>Church and location __________________________________</p>
        <p>Date __________________</p>
      </div>
      <p className="mb-6 text-sm">Circle one answer per question.</p>
      <ol className="grid gap-5">
        {questions.map((question) => (
          <li key={question.number} className="break-inside-avoid border-b border-gray-300 pb-4">
            <h2 className="font-semibold">{question.number}. {question.prompt}</h2>
            <ol className="mt-2 grid gap-1 text-sm">
              {question.options.map((option, index) => (
                <li key={index}>{String.fromCharCode(65 + index)}. {option}</li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </main>
  );
}

import { z } from "zod";
import { db } from "@/lib/db";
import { getFinalExam } from "@/lib/final-exam-data";
import { parseFinalQuestions, publicQuestions } from "@/lib/final-exam";

const churchDetails = z.object({
  church: z.string().trim().min(2).max(200),
  location: z.string().trim().min(2).max(200),
});

const htmlEntities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };

function escapeHtml(value: string) {
  return value.replace(/[&<>]/g, (character) => htmlEntities[character]);
}

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const form = await request.formData().catch(() => null);
  const details = churchDetails.safeParse({
    church: form?.get("church"),
    location: form?.get("location"),
  });
  if (!details.success) {
    return new Response("Enter your church name and location before downloading.", { status: 400, headers });
  }

  const exam = await getFinalExam();
  if (!exam?.published) {
    return new Response("The printable assessment is not available yet.", { status: 404, headers });
  }

  const questions = publicQuestions(parseFinalQuestions(exam.questions));
  const questionList = questions.map(({ prompt, options }) => `
    <li class="question"><strong>${escapeHtml(prompt)}</strong>
      <ol type="A">${options.map((option) => `<li>${escapeHtml(option)}</li>`).join("")}</ol>
    </li>`).join("");

  const document = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BBT Final Assessment</title>
  <style>
    body { font: 16px/1.5 system-ui, sans-serif; max-width: 740px; margin: 2rem auto; padding: 0 1rem; }
    h1 { line-height: 1.2; }
    .question { break-inside: avoid; margin: 1rem 0; }
    @media print { body { margin: 0; padding: 0; font-size: 11pt; } }
  </style>
</head>
<body>
  <h1>BBT Final Assessment</h1>
  <p>${questions.length} questions · ${exam.durationSeconds / 60} minutes · ${exam.passMark}% to pass</p>
  <p>Name ______________________________________________</p>
  <p>Church: ${escapeHtml(details.data.church)} · ${escapeHtml(details.data.location)}</p>
  <p>Date __________________</p>
  <p>Circle one answer per question.</p>
  <ol>${questionList}</ol>
</body>
</html>`;

  await db.auditLog.create({
    data: {
      action: "final_exam.printable_download",
      entityType: "FinalExam",
      entityId: exam.id,
      metadata: details.data,
    },
  });

  return new Response(document, {
    headers: {
      ...headers,
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": 'attachment; filename="BBT-Final-Assessment.html"',
      "X-Content-Type-Options": "nosniff",
    },
  });
}

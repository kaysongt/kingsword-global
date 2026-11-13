import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "./route";

const { create, getFinalExam } = vi.hoisted(() => ({ create: vi.fn(), getFinalExam: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { auditLog: { create } } }));
vi.mock("@/lib/final-exam-data", () => ({ getFinalExam }));

function request(church: string, location: string) {
  return new Request("http://localhost/final-assessment/print/download", {
    method: "POST",
    body: new URLSearchParams({ church, location }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  getFinalExam.mockResolvedValue({
    id: "exam", published: true, durationSeconds: 3600, passMark: 70,
    questions: Array.from({ length: 50 }, (_, index) => ({
      number: index + 1, module: 1, prompt: "Example question",
      options: ["A", "B", "C", "D"], correctIndex: 2,
    })),
  });
});

it("requires both fields before recording a download", async () => {
  expect((await POST(request("Church", "   "))).status).toBe(400);
  expect(create).not.toHaveBeenCalled();
});

it("records the church and location before delivering a question-only attachment", async () => {
  const response = await POST(request(" Church <A> ", " Chicago "));
  expect(create).toHaveBeenCalledWith({ data: {
    action: "final_exam.printable_download", entityType: "FinalExam", entityId: "exam",
    metadata: { church: "Church <A>", location: "Chicago" },
  } });
  expect(response.headers.get("Content-Disposition")).toContain("attachment");
  const body = await response.text();
  expect(body.match(/class="question"/g)).toHaveLength(50);
  expect(body).toContain("Church &lt;A&gt;");
  expect(body).not.toContain("correctIndex");
});

it("withholds the attachment when the download record cannot be saved", async () => {
  create.mockRejectedValue(new Error("Database unavailable"));
  await expect(POST(request("Church", "Chicago"))).rejects.toThrow("Database unavailable");
});

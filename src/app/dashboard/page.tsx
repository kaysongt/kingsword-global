import Link from "next/link";
import { redirectStaffToCourse } from "@/lib/staff-course";
import { ArrowRight, CalendarDays, MessageCircle, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getContinueHref, getStudentProgram } from "@/lib/student-data";
import { ModuleProgressCard } from "@/components/module-progress-card";

export default async function DashboardPage() {
  const user = await requireUser();
  await redirectStaffToCourse(user.role);
  const data = await getStudentProgram(user.id);

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <span className="eyebrow">No active enrollment</span>
        <h1 className="display mt-6 text-6xl leading-[0.92] font-medium">Your account is ready. Your program access is not active yet.</h1>
        <p className="mt-6 text-base leading-8 text-[var(--ink-soft)]">Ask the program administrator to activate or restore your enrollment.</p>
        <Link href="/final-assessment" className="button-secondary mt-8">BBT final assessment</Link>
        {user.role !== "STUDENT" && <Link href="/admin" className="button-primary mt-8"><ShieldCheck size={17} /> Open administration</Link>}
      </div>
    );
  }

  const [announcements, certificate] = await Promise.all([
    db.announcement.findMany({
      where: { programId: data.program.id, publishedAt: { lte: new Date() }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    db.certificate.findUnique({
      where: { programId_studentId: { programId: data.program.id, studentId: user.id } },
      select: { serial: true },
    }),
  ]);
  const continueHref = getContinueHref(data);
  const nextModule = data.modules.find((module) => module.progressState.isUnlocked && !module.progressState.isComplete);

  return (
    <div className="px-4 py-8 md:px-8 md:py-10 xl:px-12">
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow">Student overview</span>
            <h1 className="display mt-4 text-5xl leading-none font-medium tracking-[-0.045em] md:text-6xl">Good to see you, {user.fullName.split(" ")[0]}.</h1>
          </div>
          <Link href={continueHref} className="button-primary">Continue learning <ArrowRight size={17} /></Link>
        </div>

        <section className="mt-10 overflow-hidden rounded-[2rem] bg-[var(--forest-deep)] text-white">
          <div className="grid gap-8 p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div>
              <span className="text-xs font-extrabold tracking-[0.16em] text-[var(--sun-soft)] uppercase">Overall progress</span>
              <h2 className="display mt-4 text-4xl font-medium md:text-5xl">{nextModule ? `Continue: ${nextModule.title}` : "The path is complete."}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">{nextModule?.summary ?? "Every module and checkpoint is complete. Your final record is ready for administrator review."}</p>
            </div>
            {/* The unfilled track was 12% white on a near-black card, so on the
                day a student signs up — the one day the ring reads 0% — the
                whole thing was invisible. It has to look like a ring waiting to
                be filled, not like nothing at all. */}
            <div
              className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full"
              role="img"
              aria-label={`${data.overallPercent}% of the programme complete`}
              style={{
                background: `conic-gradient(var(--sun) ${data.overallPercent * 3.6}deg, rgba(255,255,255,.22) 0deg)`,
              }}
            >
              <div className="grid h-[116px] w-[116px] place-items-center rounded-full bg-[var(--forest-deep)] text-center">
                <span>
                  <strong className="display block text-4xl">{data.overallPercent}%</strong>
                  <small className="text-[0.6rem] font-extrabold tracking-[0.14em] text-white/70 uppercase">
                    complete
                  </small>
                </span>
              </div>
            </div>
          </div>
        </section>

        {certificate && <section className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[var(--sun)]/45 bg-[var(--sun)]/15 p-5"><div><span className="text-[0.62rem] font-extrabold tracking-[0.14em] text-[var(--clay)] uppercase">Completion record issued</span><p className="mt-1 text-sm font-extrabold">Certificate {certificate.serial}</p></div><Link href="/dashboard/certificate" className="button-secondary">View certificate <ArrowRight size={15} /></Link></section>}

        {announcements.length > 0 && (
          <section className="mt-8 grid gap-4 lg:grid-cols-3" aria-labelledby="announcements-title">
            <h2 id="announcements-title" className="sr-only">Announcements</h2>
            {announcements.map((item) => <article key={item.id} className="rounded-2xl border border-[var(--line)] bg-[var(--sun)]/12 p-5"><span className="inline-flex items-center gap-2 text-[0.66rem] font-extrabold tracking-[0.14em] text-[var(--clay)] uppercase"><CalendarDays size={13} /> Announcement</span><h3 className="mt-3 font-extrabold">{item.title}</h3><p className="mt-2 text-xs leading-6 text-[var(--ink-soft)]">{item.body}</p></article>)}
          </section>
        )}

        <section id="modules" className="mt-14 scroll-mt-24">
          <div className="flex items-end justify-between gap-5">
            <div><span className="eyebrow">Your learning path</span><h2 className="display mt-4 text-4xl font-semibold md:text-5xl">Seven modules</h2></div>
            <Link href="/dashboard/community" className="button-secondary hidden sm:inline-flex"><MessageCircle size={16} /> Community</Link>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.modules.map((module) => <ModuleProgressCard key={module.id} order={module.order} slug={module.slug} eyebrow={module.eyebrow} title={module.title} summary={module.summary} estimatedMinutes={module.estimatedMinutes} completedLessons={module.progressState.completedLessons} totalLessons={module.progressState.totalLessons} percent={module.progressState.percent} isUnlocked={module.progressState.isUnlocked} isComplete={module.progressState.isComplete} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

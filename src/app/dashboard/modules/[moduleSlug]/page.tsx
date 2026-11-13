/* eslint-disable @next/next/no-assign-module-variable */
import Link from "next/link";
import { getTrainingVideo } from "@/lib/video-progress";
import { redirectStaffToCourse } from "@/lib/staff-course";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, LockKeyhole, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { findStudentModule, getStudentProgram, isLessonSequentiallyUnlocked } from "@/lib/student-data";

export default async function ModulePage({ params }: { params: Promise<{ moduleSlug: string }> }) {
  const user = await requireUser();
  const { moduleSlug } = await params;
  await redirectStaffToCourse(user.role, moduleSlug);
  const data = await getStudentProgram(user.id);
  const module = findStudentModule(data, moduleSlug);
  if (!data || !module) notFound();

  if (!module.progressState.isUnlocked) {
    return <div className="mx-auto max-w-3xl px-5 py-20"><Link href="/dashboard" className="button-quiet !px-0"><ArrowLeft size={16} /> Dashboard</Link><LockKeyhole className="mt-16 text-[var(--clay)]" size={32} /><h1 className="display mt-6 text-5xl font-medium">This module is still locked.</h1><p className="mt-5 text-base leading-8 text-[var(--ink-soft)]">Complete the lessons and checkpoint in the previous module first.</p></div>;
  }

  const teaching = module.lessons.find((lesson) => getTrainingVideo(lesson.videoUrl));
  const allLessonsComplete = module.lessons.length > 0 && module.lessons.every((lesson) => lesson.isComplete);
  return (
    <div>
      <section className="bg-[var(--forest-deep)] px-4 py-12 text-white md:px-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-extrabold text-white/60 hover:text-white"><ArrowLeft size={15} /> Back to overview</Link>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_280px] lg:items-end">
            <div><span className="text-xs font-extrabold tracking-[0.17em] text-[var(--sun-soft)] uppercase">Module {String(module.order).padStart(2, "0")} · {module.eyebrow}</span><h1 className="display mt-5 text-6xl leading-[0.9] font-medium tracking-[-0.05em] md:text-8xl">{module.title}</h1><p className="mt-7 max-w-3xl text-base leading-8 text-white/65">{module.description}</p></div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.055] p-5"><div className="flex items-end justify-between"><span className="text-xs font-extrabold tracking-[0.12em] text-white/55 uppercase">Lesson progress</span><strong className="display text-3xl">{module.progressState.percent}%</strong></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><span className="block h-full bg-[var(--sun)]" style={{ width: `${module.progressState.percent}%` }} /></div></div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[0.72fr_1.28fr]">
        <aside>
          {teaching && isLessonSequentiallyUnlocked(module.lessons, teaching.id) && (
            <section className="mb-8 rounded-2xl border border-[var(--line)] bg-[var(--paper-light)] p-5">
              <h2 className="text-lg font-bold">Module video</h2>
              <p className="mt-2 text-sm leading-6">Watch the teaching before moving on to the study material and graded checkpoint.</p>
              <Link
                href={`/dashboard/modules/${module.slug}/lessons/${teaching.slug}`}
                className="button-primary mt-4"
              >
                {teaching.isComplete ? "Rewatch teaching" : teaching.watchedSeconds > 0 ? "Resume teaching" : "Watch teaching"}
                <ArrowRight size={16} />
              </Link>
            </section>
          )}
          <span className="eyebrow">By the end</span>
          <ul className="mt-7 grid gap-4">
            {(Array.isArray(module.objectives) ? module.objectives : []).map((objective, index) => <li key={index} className="flex gap-3 text-sm leading-6 text-[var(--ink-soft)]"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--sage-light)] text-[var(--forest)]"><Check size={12} strokeWidth={3} /></span>{String(objective)}</li>)}
          </ul>
          <Link href={`/dashboard/community?module=${module.slug}`} className="button-secondary mt-8"><MessageCircle size={16} /> Join the discussion</Link>
        </aside>

        <section>
          <div className="flex items-end justify-between gap-4"><div><span className="eyebrow">Learning sequence</span><h2 className="display mt-4 text-4xl font-semibold">Lessons and checkpoint</h2></div><span className="hidden items-center gap-1.5 text-xs font-bold text-[var(--ink-soft)]/65 sm:inline-flex"><Clock3 size={14} /> {module.estimatedMinutes} minutes</span></div>
          <ol className="mt-7 grid gap-3">
            {module.lessons.map((lesson) => {
              const unlocked = isLessonSequentiallyUnlocked(module.lessons, lesson.id);
              return <li key={lesson.id}>{unlocked ? <Link href={`/dashboard/modules/${module.slug}/lessons/${lesson.slug}`} className="group flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white/65 p-4 transition hover:border-[var(--forest)]/40 hover:bg-white"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${lesson.isComplete ? "bg-[var(--forest)] text-white" : "bg-[var(--sage-light)] text-[var(--forest)]"}`}>{lesson.isComplete ? <Check size={16} strokeWidth={3} /> : String(lesson.order).padStart(2, "0")}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{lesson.title}</strong><small className="mt-1 block truncate text-[0.7rem] text-[var(--ink-soft)]/65">{lesson.summary}</small></span><ArrowRight size={16} className="text-[var(--forest)] transition group-hover:translate-x-1" /></Link> : <div className="flex items-center gap-4 rounded-2xl border border-black/5 bg-black/[0.025] p-4 opacity-55"><span className="grid h-10 w-10 place-items-center rounded-full bg-black/5"><LockKeyhole size={14} /></span><span className="flex-1 text-sm font-bold">{lesson.title}</span></div>}</li>;
            })}
            <li>{allLessonsComplete && module.assessment ? <Link href={`/dashboard/modules/${module.slug}/assessment`} className="group flex items-center gap-4 rounded-2xl border border-[var(--sun)]/55 bg-[var(--sun)]/12 p-4 transition hover:bg-[var(--sun)]/20"><span className={`grid h-10 w-10 place-items-center rounded-full ${module.progressState.isComplete ? "bg-[var(--forest)] text-white" : "bg-[var(--sun)] text-[var(--forest-deep)]"}`}>{module.progressState.isComplete ? <CheckCircle2 size={17} /> : "Q"}</span><span className="flex-1"><strong className="block text-sm">{module.assessment.title}</strong><small className="mt-1 block text-[0.7rem] text-[var(--ink-soft)]/65">Pass mark: {module.assessment.passMark}%{module.bestScore ? ` · Best score: ${module.bestScore}%` : ""}</small></span><ArrowRight size={16} /></Link> : <div className="flex items-center gap-4 rounded-2xl border border-black/5 bg-black/[0.025] p-4 opacity-55"><span className="grid h-10 w-10 place-items-center rounded-full bg-black/5"><LockKeyhole size={14} /></span><span><strong className="block text-sm">Module checkpoint</strong><small className="mt-1 block text-[0.7rem]">Complete every lesson to unlock</small></span></div>}</li>
          </ol>
        </section>
      </div>
    </div>
  );
}

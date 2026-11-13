import Link from "next/link";
import { ArrowRight, BookOpen, Check, MessageCircle, Play, Route, Sparkles } from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { SiteFooter } from "@/components/site-footer";
import { PUBLIC_OUTCOMES } from "@/lib/site-config";
import { getPublicProgram } from "@/lib/public-program";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Believers Training",
  description:
    "A seven-module discipleship programme from the KingsWord Training Institute: covenant, identity, Scripture, the Holy Spirit, prayer, purpose and stewardship.",
};

export default async function BelieversTrainingPage() {
  const program = await getPublicProgram();
  return (
    <main className="overflow-hidden">
      <PublicNav />
      <section id="main-content" className="relative border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-44 right-[-8rem] h-[34rem] w-[34rem] rounded-full border border-[var(--forest)]/10" />
          <div className="absolute top-12 right-16 h-48 w-48 rounded-full bg-[var(--sun)]/12 blur-3xl" />
        </div>
        <div className="page-shell relative grid min-h-[760px] items-center gap-12 py-20 lg:grid-cols-[1.08fr_0.92fr] lg:py-28">
          <div className="reveal max-w-3xl">
            <span className="eyebrow">{program.eyebrow}</span>
            <h1 className="display mt-8 text-[clamp(4.25rem,10.5vw,9rem)] leading-[0.76] font-medium tracking-[-0.07em]">
              Learn.<br />
              <span className="italic text-[var(--forest)]">Practice.</span><br />
              Become.
            </h1>
            <p className="mt-10 max-w-xl text-lg leading-8 text-[var(--ink-soft)]">{program.description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup" className="button-primary">Start the program free <ArrowRight size={17} /></Link>
              <Link href="/login" className="button-secondary">Student login</Link>
              <Link href="/curriculum" className="button-secondary">Explore all seven modules</Link>
            </div>
          </div>

          <div className="reveal reveal-delay-2 relative mx-auto w-full max-w-[490px] lg:mx-0 lg:justify-self-end">
            <div className="absolute -inset-5 rotate-3 rounded-[2.4rem] border border-[var(--forest)]/20" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2.2rem] bg-[var(--forest-deep)] p-7 text-white shadow-[var(--shadow)] md:p-9">
              <div className="absolute top-0 right-0 h-52 w-52 translate-x-1/3 -translate-y-1/3 rounded-full border-[42px] border-[var(--sun)]/20" aria-hidden="true" />
              <div className="relative flex items-center justify-between">
                <span className="text-xs font-extrabold tracking-[0.18em] text-[var(--sun-soft)] uppercase">Your path</span>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">7 modules</span>
              </div>
              <div className="relative mt-14 space-y-3">
                {program.modules.map((module, index) => (
                  <div key={module.slug} className={`flex items-center gap-4 rounded-2xl border px-4 py-3 ${index === 0 ? "border-[var(--sun)]/55 bg-white/10" : "border-white/10 bg-white/[0.035]"}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold ${index === 0 ? "bg-[var(--sun)] text-[var(--forest-deep)]" : "bg-white/8 text-white/55"}`}>{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{module.title}</span>
                    {index === 0 ? <Play size={15} fill="currentColor" /> : <span className="h-px w-5 bg-white/20" />}
                  </div>
                ))}
              </div>
              <p className="relative mt-7 text-xs leading-6 text-white/55">Progress is saved. Each module opens after the previous checkpoint is complete.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-10" id="assessment">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-light)] p-7">
          <h2 className="text-2xl font-bold">Completed BBT online or at your local church?</h2>
          <p className="mt-3 leading-7">
            Sign in to take the 50-question final assessment. Local-church students can request access without repeating the online course.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/final-assessment" className="button-primary">Access the final assessment</Link>
            <Link href="/final-assessment/print" className="button-secondary">Printable assessment</Link>
          </div>
        </div>
      </section>
      <section id="experience" className="bg-[var(--paper-light)] py-24 md:py-32">
        <div className="page-shell">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <span className="eyebrow">The experience</span>
              <h2 className="display mt-6 max-w-md text-5xl leading-[0.95] font-medium tracking-[-0.04em] md:text-7xl">Less noise. More formation.</h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
              {[
                { icon: BookOpen, title: "Focused lessons", body: "Short, structured teaching that leaves room to think, reflect, and apply." },
                { icon: Route, title: "A visible path", body: "Know exactly where you are, what comes next, and what completion requires." },
                { icon: MessageCircle, title: "Learning in community", body: "Ask questions and exchange considered responses inside each module." },
                { icon: Sparkles, title: "Practice over performance", body: "Checkpoints reinforce understanding without turning learning into a race." },
              ].map(({ icon: Icon, title, body }) => (
                <article key={title} className="min-h-64 bg-[var(--paper-light)] p-8 md:p-10">
                  <Icon className="text-[var(--clay)]" size={24} strokeWidth={1.7} />
                  <h3 className="display mt-12 text-3xl font-semibold">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] py-24 md:py-32">
        <div className="page-shell grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="relative">
            <span className="display text-[clamp(8rem,24vw,17rem)] leading-none font-medium tracking-[-0.08em] text-[var(--forest)]">7</span>
            <span className="display absolute top-1/2 left-[6.5rem] -translate-y-1/2 text-4xl leading-none italic md:left-[10rem] md:text-6xl">modules,<br />one coherent path.</span>
          </div>
          <div>
            <span className="eyebrow">What you carry forward</span>
            <ul className="mt-8 grid gap-5">
              {PUBLIC_OUTCOMES.map((outcome) => (
                <li key={outcome} className="flex items-start gap-4 border-b border-[var(--line)] pb-5 text-base font-semibold leading-7">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--sage-light)] text-[var(--forest)]"><Check size={14} strokeWidth={3} /></span>
                  {outcome}
                </li>
              ))}
            </ul>
            <Link href="/curriculum" className="button-quiet mt-5 !px-0">See the complete learning path <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="bg-[var(--sun)] py-24 text-[var(--forest-deep)] md:py-28">
        <div className="page-shell grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="text-xs font-extrabold tracking-[0.17em] uppercase">Ready when the time is right</span>
            <h2 className="display mt-6 max-w-4xl text-5xl leading-[0.95] font-medium tracking-[-0.045em] md:text-8xl">Begin with a clear purpose.</h2>
          </div>
          <Link href="/signup" className="button-primary whitespace-nowrap">Create your account <ArrowRight size={17} /></Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

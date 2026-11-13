import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Brand } from "@/components/brand";
import { SignupForm } from "@/app/signup/signup-form";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata = {
  title: "Start Believers Training",
  description:
    "Create an account and begin the seven-module Believers Training programme straight away. Free, self-paced, and open to anyone.",
};

const PROMISES = [
  "All seven modules, free, with nothing to pay at any point",
  "Start now and go at your own pace — progress is saved as you go",
  "A certificate when you finish the seventh module",
];

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const examOnly = next === "/final-assessment";
  return (
    <main className={examOnly ? "grid min-h-screen" : "grid min-h-screen lg:grid-cols-[1fr_1fr]"}>
      <section className="flex flex-col justify-center px-6 py-14 md:px-14">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <Link
              href="/believers-training"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--ink-soft)] hover:text-[var(--forest)]"
            >
              <ArrowLeft size={16} /> Back
            </Link>
          </div>

          <div className="mt-16">
            <span className="eyebrow">Believers Training</span>
            <h1 className="display mt-5 text-5xl leading-[0.95] font-medium tracking-[-0.03em]">
              {examOnly ? "Create your assessment account." : "Start today."}
            </h1>
            <p className="mt-5 text-sm leading-7 text-[var(--ink-soft)]">
              {examOnly
                ? "After creating your account, request access using the name of the church where you completed BBT."
                : "Create your account and start module one immediately."}
            </p>
          </div>

          <div className="mt-9">
            <SignupForm next={next} />
          </div>
        </div>
      </section>

      <section className={examOnly ? "hidden" : "relative hidden overflow-hidden bg-[var(--forest-deep)] p-14 text-white lg:block"}>
        <div
          className="absolute top-[-12rem] right-[-10rem] h-[38rem] w-[38rem] rounded-full border-[5rem] border-[var(--sun)]/15"
          aria-hidden="true"
        />
        <div className="relative flex h-full max-w-xl flex-col justify-between">
          <span className="text-xs font-extrabold tracking-[0.2em] text-[var(--sun-soft)] uppercase">
            What you are joining
          </span>

          <div>
            <p className="display text-[3.4rem] leading-[0.95] font-medium tracking-[-0.03em]">
              Seven modules.
              <br />
              <span className="italic text-[var(--sun-soft)]">Seventy-seven lessons.</span>
            </p>
            <ul className="mt-10 grid gap-4">
              {PROMISES.map((promise) => (
                <li key={promise} className="flex items-start gap-3 text-sm leading-7 text-white/78">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--sun)] text-[var(--forest-deep)]">
                    <Check size={12} strokeWidth={3.5} />
                  </span>
                  {promise}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs leading-6 text-white/45">
            Taught by {SITE_CONFIG.organization}. Questions? {SITE_CONFIG.supportEmail}
          </p>
        </div>
      </section>
    </main>
  );
}

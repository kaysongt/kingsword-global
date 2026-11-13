"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormButton } from "@/components/form-button";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { signUp } from "@/app/signup/actions";

export function SignupForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signUp, INITIAL_ACTION_STATE);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={next === "/final-assessment" ? next : ""} />
      <div className="field">
        <label htmlFor="fullName">Full name</label>
        <input id="fullName" name="fullName" type="text" autoComplete="name" required autoFocus />
        {errors.fullName && (
          <p className="text-xs font-semibold text-[var(--clay)]">{errors.fullName[0]}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
        {errors.email && <p className="text-xs font-semibold text-[var(--clay)]">{errors.email[0]}</p>}
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="text-xs leading-5 text-[var(--ink-soft)]/70">
          At least 12 characters. A short phrase you will remember beats a scramble you will not.
        </p>
        {errors.password && (
          <p className="text-xs font-semibold text-[var(--clay)]">{errors.password[0]}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        {errors.confirmPassword && (
          <p className="text-xs font-semibold text-[var(--clay)]">{errors.confirmPassword[0]}</p>
        )}
      </div>

      {/* Honeypot: positioned off-screen rather than display:none, which some
          bots detect and skip. Hidden from assistive tech and tab order. */}
      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" && (
        <p className="form-error" role="alert">
          {state.message}
        </p>
      )}

      <FormButton pendingLabel="Creating your account…">{next === "/final-assessment" ? "Create assessment account" : "Create account and start"}</FormButton>

      <p className="text-center text-xs leading-5 text-[var(--ink-soft)]/70">
        Already enrolled?{" "}
        <Link href={next === "/final-assessment" ? "/login?next=/final-assessment" : "/login"} className="font-extrabold text-[var(--forest)] underline underline-offset-4">
          Sign in
        </Link>
        .
      </p>
    </form>
  );
}

import Link from "next/link";
import { NETWORK } from "@/lib/locations";
import { networkHomeHref } from "@/lib/public-context";

/**
 * The church wordmark.
 *
 * The mark is three ascending bars — the same "raised up and sent out" idea the
 * church states as its mission — rendered in type colours rather than as an
 * image, so it stays crisp at any size and needs no asset pipeline.
 */
export async function Brand({
  compact = false,
  inverted = false,
  name = NETWORK.name,
  tagline = NETWORK.tagline,
}: {
  compact?: boolean;
  inverted?: boolean;
  name?: string;
  tagline?: string;
}) {
  return (
    <Link
      href={await networkHomeHref()}
      className="inline-flex items-center gap-3 no-underline"
      aria-label={`${name} home`}
    >
      <span
        className={`relative grid h-10 w-10 grid-cols-3 items-end gap-1 rounded-full p-2 ${
          inverted ? "border border-white/15 bg-white/10" : "bg-[var(--forest-deep)]"
        }`}
        aria-hidden="true"
      >
        <span className="h-2 rounded-full bg-[var(--sun)]" />
        <span className="h-4 rounded-full bg-[var(--sun-soft)]" />
        <span className="h-6 rounded-full bg-[var(--paper-light)]" />
      </span>
      <span className="grid leading-none">
        <span
          className={`text-[0.62rem] font-extrabold tracking-[0.19em] uppercase ${
            inverted ? "text-[var(--sun-soft)]" : "text-[var(--sun)]"
          }`}
        >
          {tagline}
        </span>
        {!compact && (
          <span
            className={`display mt-1 text-xl font-semibold ${
              inverted ? "text-white" : "text-[var(--ink)]"
            }`}
          >
            {name}
          </span>
        )}
      </span>
    </Link>
  );
}

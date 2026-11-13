import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { getPublicContext } from "@/lib/public-context";
import { localHref, type PublicContext } from "@/lib/locations";

export async function PublicNav({
  context: supplied,
}: { context?: PublicContext } = {}) {
  const context = supplied ?? (await getPublicContext());
  const { location } = context;
  const links = [
    { label: "Our story", href: localHref(context, "about") },
    { label: "Our locations", href: "/locations" },
    ...(location
      ? [{ label: "Plan a visit", href: localHref(context, "#visit") }]
      : []),
    { label: "Believers Training", href: "/believers-training" },
    { label: "Connect", href: localHref(context, "contact") },
  ];
  return (
    <header className="kw-nav">
      <a href="#main-content" className="kw-skip">
        Skip to content
      </a>
      <div className="kw-shell kw-nav-inner">
        <Link
          href={
            !location && context.customDomain ? "/explore" : localHref(context)
          }
          className="kw-brand"
          aria-label={
            location ? `KingsWord ${location.name} home` : "KingsWord home"
          }
        >
          <Image
            src="/brand/kingsword-complete.png"
            width={154}
            height={100}
            alt="KingsWord Everywhere"
            preload
          />
          {location && (
            <span className="kw-brand-location">{location.name}</span>
          )}
        </Link>
        <nav className="kw-nav-links" aria-label="Primary navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          {location?.giveUrl && (
            <a
              className="kw-nav-action"
              href={location.giveUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Give <ArrowUpRight size={14} />
            </a>
          )}
        </nav>
        <details className="kw-nav-mobile">
          <summary aria-label="Open navigation">
            <Menu size={20} />
          </summary>
          <nav aria-label="Mobile navigation">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            {location?.giveUrl && (
              <a
                href={location.giveUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Give
              </a>
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}

import Image from "next/image";
import Link from "next/link";
import { getPublicContext } from "@/lib/public-context";
import {
  LOCATIONS,
  localHref,
  locationHref,
  NETWORK,
  type PublicContext,
} from "@/lib/locations";

export async function SiteFooter({
  context: supplied,
}: { context?: PublicContext } = {}) {
  const context = supplied ?? (await getPublicContext());
  const { location } = context;
  return (
    <footer className="kw-footer">
      <div className="kw-shell">
        <div className="kw-footer-main">
          <div className="kw-footer-brand">
            <Link href={localHref(context)} aria-label="KingsWord home">
              <Image
                src="/brand/kingsword-complete.png"
                width={175}
                height={113}
                alt="KingsWord Everywhere"
              />
            </Link>
            <p>{location?.description ?? NETWORK.description}</p>
          </div>
          <nav aria-label="Locations in footer">
            <p>Our locations</p>
            {LOCATIONS.map((item) => (
              <Link
                key={item.slug}
                href={locationHref(item, context.customDomain)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <nav aria-label="Footer navigation">
            <p>Your next step</p>
            <Link href={localHref(context, "about")}>Our story</Link>
            <Link href={location ? localHref(context, "#visit") : "/locations"}>
              Plan a visit
            </Link>
            <Link href={localHref(context, "children")}>
              Children’s ministry
            </Link>
            <Link href="/believers-training">Believers Training</Link>
            <Link href="/login">Student login</Link>
            <Link href="/ministers/login">Ministers Login</Link>
            <Link href={localHref(context, "contact")}>Contact</Link>
            {location?.giveUrl && (
              <a
                href={location.giveUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Give online
              </a>
            )}
          </nav>
        </div>
        <div className="kw-footer-bottom">
          <span>
            © {new Date().getFullYear()}{" "}
            {location
              ? `KingsWord ${location.name}`
              : "KingsWord Ministries International"}
          </span>
          <span>People of the Word. People of the Spirit.</span>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}

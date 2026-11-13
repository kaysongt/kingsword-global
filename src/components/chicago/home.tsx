import { localHref, type PublicContext } from "@/lib/locations";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, Play } from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { CHURCH } from "@/lib/church";

/**
 * The church's front door.
 *
 * It opens on the congregation rather than on type over a flat ground: the
 * photograph answers "what kind of room am I walking into?" before a word is
 * read, which is most of what a first-time visitor is actually asking.
 *
 * The service card overlaps the hero's lower edge on purpose. Service times and
 * the address are the single most requested thing on a church website, and on
 * the site this replaces neither appears above the fold at all.
 */

const PATHS = [
  {
    title: "Membership",
    body: "Understand the house, its vision and its doctrine, then formally make it yours.",
    go: "Join the next class",
  },
  {
    title: "Small Groups",
    body: "Meet through the week with a handful of people who will actually know your name.",
    go: "Find a group",
  },
  {
    title: "Units",
    body: "Serve on a team and help carry the weight of what happens every Sunday.",
    go: "Start serving",
  },
  {
    title: "Life Groups",
    body: "Gather by life stage — students, singles, couples, parents — for what you are walking through now.",
    go: "See the groups",
  },
];

const MODULES = [
  "The New Covenant",
  "Identity in Christ",
  "The Word: The Agent of Change",
  "The Ministry of the Holy Spirit",
  "Spiritual Authority and Prayer",
  "Purpose and Calling",
  "Stewardship and Missional Lifestyle",
];

export default function HomePage({ context }: { context: PublicContext }) {
  const { address, services } = CHURCH;

  return (
    <main className="overflow-hidden">
      <PublicNav context={context} />

      {/* ---- Hero ---------------------------------------------------------- */}
      <section id="main-content" className="relative isolate bg-[var(--forest-deep)] text-white">
        <div className="photo-hero absolute inset-0 -z-20" aria-hidden="true">
          <Image
            src="/brand/hero-worship.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_38%]"
          />
        </div>
        {/* Two scrims: one across the reading column, one lifting the base so
            the overlapping card has something solid to sit against. */}
        <div
          className="absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(104deg, rgba(10,15,36,0.94) 0%, rgba(10,15,36,0.72) 46%, rgba(10,15,36,0.30) 100%), linear-gradient(to top, rgba(10,15,36,0.96) 0%, rgba(10,15,36,0) 42%)",
          }}
        />

        <div className="page-shell relative pt-24 pb-52 md:pt-32 md:pb-64">
          <div className="reveal max-w-3xl">
            <span className="eyebrow !text-[var(--sun-soft)]">
              {CHURCH.tagline} &middot; Chicago
            </span>
            <h1 className="display mt-8 text-[clamp(3.2rem,8.4vw,6.8rem)] leading-[0.86] font-medium tracking-[-0.055em]">
              Come as you are.
              <br />
              <span className="italic text-[var(--sun-soft)]">Leave built up.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-white/78">
              A Word-centered church on Chicago&rsquo;s West Side, raising people of purpose through
              the teaching of Scripture and the ministry of the Holy Spirit.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={localHref(context, "#visit")}
                className="button-primary !border-[var(--sun)] !bg-[var(--sun)] !text-[#1b1200]"
              >
                Plan your visit <ArrowRight size={17} />
              </Link>
              <a
                href={CHURCH.watchUrl}
                target="_blank"
                rel="noopener"
                className="button-secondary !border-white/30 !bg-white/8 !text-white"
              >
                <Play size={16} /> Watch a service
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Service times: overlaps the hero's lower edge ------------------ */}
      <section id="visit" className="relative z-10 -mt-40 scroll-mt-24">
        <div className="page-shell">
          <div className="grid overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--paper-light)] shadow-[var(--shadow)] md:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.day}
                className="border-b border-[var(--line)] p-8 last:border-b-0 md:border-r md:border-b-0 md:p-10"
              >
                <span className="text-xs font-extrabold tracking-[0.16em] text-[var(--clay)] uppercase">
                  {service.day} service
                </span>
                <p className="display mt-3 text-5xl font-semibold tracking-[-0.03em]">
                  {service.time}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{service.note}</p>
              </div>
            ))}
            <div className="p-8 md:p-10">
              <span className="text-xs font-extrabold tracking-[0.16em] text-[var(--clay)] uppercase">
                Find us
              </span>
              <p className="mt-3 flex items-start gap-2 text-lg leading-7 font-semibold">
                <MapPin size={18} className="mt-1 shrink-0 text-[var(--sun)]" />
                <span>
                  {address.street}
                  <br />
                  {address.city}, {address.state} {address.postcode}
                </span>
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                Free parking in the adjacent lot.
              </p>
              <a
                href={address.mapUrl}
                target="_blank"
                rel="noopener"
                className="button-quiet mt-2 !px-0"
              >
                Get directions <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Who we are ------------------------------------------------------
          Deliberately text-led. There is a photograph two sections above and
          another two below; a third here would make the page one long
          alternating photo-and-paragraph rhythm. The statement is set large
          instead, which gives the eye somewhere different to land. */}
      <section className="py-24 md:py-32">
        <div className="page-shell">
          <Reveal>
            <span className="eyebrow">Who we are</span>
            <h2 className="display mt-7 max-w-5xl text-[clamp(2.4rem,5.4vw,4.4rem)] leading-[0.98] font-medium tracking-[-0.045em]">
              A house that sends people out{" "}
              <span className="italic text-[var(--forest)]">stronger than they came in.</span>
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-14 grid gap-10 border-t border-[var(--line)] pt-12 md:grid-cols-2 md:gap-16">
              <p className="text-lg leading-8 text-[var(--ink-soft)]">
                KingsWord Chicago is the apostolic headquarters of a global ministry with churches
                across Africa, Europe and North America. We are here to train, equip and release
                God&rsquo;s children into their divine purpose — teaching victory in life through
                the Word and the ministry of the Holy Spirit.
              </p>
              <div>
                <p className="text-lg leading-8 text-[var(--ink-soft)]">
                  Whether it is your first Sunday or your fifteenth year, there is a place for you
                  here, and a next step waiting when you are ready to take it.
                </p>
                <Link href={localHref(context, "about")} className="button-quiet mt-6 !px-0">
                  More about us <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Get involved -------------------------------------------------- */}
      <section
        id="involved"
        className="scroll-mt-24 border-y border-[var(--line)] bg-[var(--paper-light)] py-24 md:py-32"
      >
        <div className="page-shell">
          <Reveal>
            <span className="eyebrow">Get involved</span>
            <h2 className="display mt-6 max-w-2xl text-5xl leading-[0.95] font-medium tracking-[-0.04em] md:text-6xl">
              Four ways to stop attending and start belonging.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
              {PATHS.map((path, index) => (
                <article
                  key={path.title}
                  className="card-lift flex min-h-64 flex-col bg-[var(--paper-light)] p-8 md:p-9"
                >
                  <span className="text-xs font-extrabold tracking-[0.14em] text-[var(--ink-soft)]/55 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="display mt-6 text-2xl font-semibold">{path.title}</h3>
                  <p className="mt-4 flex-1 text-sm leading-7 text-[var(--ink-soft)]">{path.body}</p>
                  <Link
                    href={localHref(context, "contact")}
                    className="mt-6 text-xs font-extrabold tracking-[0.1em] text-[var(--clay)] uppercase"
                  >
                    {path.go} &rarr;
                  </Link>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Believers Training -------------------------------------------- */}
      <section
        id="training"
        className="relative scroll-mt-24 overflow-hidden bg-[var(--forest-deep)] py-24 text-white md:py-32"
      >
        <div
          className="absolute top-[-14rem] right-[-10rem] h-[38rem] w-[38rem] rounded-full border-[5rem] border-[var(--sun)]/8"
          aria-hidden="true"
        />
        <div className="page-shell relative grid gap-14 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <Reveal>
            <span className="text-xs font-extrabold tracking-[0.17em] text-[var(--sun-soft)] uppercase">
              Believers Training
            </span>
            <h2 className="display mt-6 max-w-2xl text-5xl leading-[0.95] font-medium tracking-[-0.04em] md:text-6xl">
              Grounded, then sent.
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/72">
              Seven modules, eleven lessons each, taken in order and at your own pace — covenant,
              identity, the Word, the Holy Spirit, prayer, purpose and stewardship. The same
              teaching this house is built on.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/believers-training"
                className="button-primary !border-[var(--sun)] !bg-[var(--sun)] !text-[#1b1200]"
              >
                Explore the programme <ArrowRight size={17} />
              </Link>
              <Link
                href="/signup"
                className="button-secondary !border-white/25 !bg-white/5 !text-white"
              >
                Start free
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <ol className="grid gap-2.5">
              {MODULES.map((title, index) => (
                <li
                  key={title}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 transition-colors hover:border-[var(--sun)]/40 hover:bg-white/[0.07]"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/8 text-xs font-extrabold tabular-nums text-white/60">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-bold">{title}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* ---- Life here ----------------------------------------------------- */}
      <section className="py-24 md:py-32">
        <div className="page-shell grid items-center gap-14 lg:grid-cols-[0.95fr_1fr]">
          <Reveal className="order-2 lg:order-1">
            <figure className="photo-frame aspect-[3/2] w-full">
              <Image
                src="/brand/community.jpg"
                alt="Members greeting one another in the sanctuary after a service"
                width={1100}
                height={733}
                sizes="(max-width: 1024px) 100vw, 47vw"
                className="h-full w-full object-cover"
              />
            </figure>
          </Reveal>
          <Reveal delay={120} className="order-1 lg:order-2">
            <span className="eyebrow">Your first Sunday</span>
            <h2 className="display mt-6 max-w-lg text-5xl leading-[0.95] font-medium tracking-[-0.04em] md:text-6xl">
              Nobody here expects you to have it together.
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[var(--ink-soft)]">
              Come as you are — there is no dress code and no script to follow. Arrive a few minutes
              early if you would like someone to walk you in, and bring your children: care is
              available at every Sunday service.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={localHref(context, "contact")} className="button-primary">
                Tell us you&rsquo;re coming <ArrowRight size={17} />
              </Link>
              <Link href={localHref(context, "children")} className="button-secondary">
                Children&rsquo;s ministry
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Livestream ---------------------------------------------------- */}
      <section className="bg-[var(--sun)] py-24 text-[var(--forest-deep)] md:py-28">
        <div className="page-shell grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="text-xs font-extrabold tracking-[0.17em] uppercase">Livestream</span>
            <h2 className="display mt-6 max-w-4xl text-5xl leading-[0.95] font-medium tracking-[-0.045em] md:text-7xl">
              Can&rsquo;t make it in? Join us live.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 opacity-80">
              Every service streams, and past services stay up on demand.
            </p>
          </div>
          <a
            href={CHURCH.watchUrl}
            target="_blank"
            rel="noopener"
            className="button-primary whitespace-nowrap"
          >
            Watch on YouTube <ArrowUpRight size={17} />
          </a>
        </div>
      </section>

      <SiteFooter context={context} />
    </main>
  );
}

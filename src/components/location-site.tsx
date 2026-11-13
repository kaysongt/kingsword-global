import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  MapPin,
  Play,
} from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { ChurchVideos } from "@/components/church-videos";
import {
  CinematicDirectory,
  TrainingFeature,
} from "@/components/cinematic-home";
import { LOCATION_MEDIA } from "@/lib/location-media";
import {
  DALLAS_CHILDREN,
  DALLAS_LINKS,
  localHref,
  mapHref,
  phoneHref,
  type PublicContext,
} from "@/lib/locations";

const LEADERS: Record<
  string,
  { name: string; role: string; description: string }[]
> = {
  chicago: [
    {
      name: "Dr. Kayode Ijisesan",
      role: "Founder, KingsWord Ministries International",
      description:
        "Leading a global ministry with a calling to raise a supernatural army: people grounded in the Word and yielded to the Spirit.",
    },
    {
      name: "Pastor May Ijisesan",
      role: "Senior Pastor, KingsWord Chicago",
      description:
        "Serving the Chicago church family and equipping people to walk in their God-given purpose.",
    },
  ],
  calgary: [
    {
      name: "Pastor Muyiwa Oseni",
      role: "KingsWord Calgary",
      description:
        "Serving the KingsWord family in Calgary and helping people grow in the Word and the Spirit.",
    },
  ],
  dallas: [
    {
      name: "Pastors Dotun & Buki Oragbade",
      role: "KingsWord Dallas",
      description:
        "Dotun and Buki Oragbade serve as the resident pastors of KingsWord International Church, Dallas.",
    },
  ],
  london: [
    {
      name: "Pastors Emmy & Kemi Akinlaja",
      role: "KingsWord London",
      description:
        "Leading the London church family and helping people encounter God, grow in faith and find community.",
    },
  ],
};

function SiteFrame({
  context,
  children,
}: {
  context: PublicContext;
  children: React.ReactNode;
}) {
  const accent = context.location
    ? LOCATION_MEDIA[context.location.slug].accent
    : "#1743ad";
  return (
    <div className="kw-site" style={{ "--kw-accent": accent } as CSSProperties}>
      <PublicNav context={context} />
      <main id="main-content">{children}</main>
      <SiteFooter context={context} />
    </div>
  );
}

export function VisitSection({ context }: { context: PublicContext }) {
  const location = context.location;
  if (!location)
    return (
      <section className="kw-section">
        <div className="kw-shell">
          <CinematicDirectory context={context} />
        </div>
      </section>
    );
  return (
    <section id="visit" className="kw-section kw-visit">
      <div className="kw-shell">
        <div className="kw-section-heading">
          <div>
            <p className="kw-kicker">YOUR VISIT</p>
            <h2>
              {location.slug === "nigeria" ? (
                <>Find a congregation.</>
              ) : (
                <>See you on Sunday.</>
              )}
            </h2>
          </div>
          <p>
            {location.slug === "nigeria"
              ? "Choose a congregation below and speak with the local team about your first visit."
              : "A real welcome, meaningful worship and a Word for your life. We look forward to meeting you."}
          </p>
        </div>
        <div className="kw-visit-layout">
          <div className="kw-service-details">
            <Clock3 size={22} />
            <h3>When we gather</h3>
            {location.services.length ? (
              location.services.map((service) => (
                <div key={service.day} className="kw-service-time">
                  <p>{service.day}</p>
                  <strong>{service.time}</strong>
                  <span>{service.note}</span>
                </div>
              ))
            ) : (
              <p className="kw-body">
                Times vary by congregation. Call your chosen church for the next
                service.
              </p>
            )}
            <small>
              All times are local · {location.timezone.replaceAll("_", " ")}
            </small>
            {location.slug === "chicago" && (
              <p className="kw-body">
                Free parking in the adjacent lot. Child care is available at
                Sunday services.
              </p>
            )}
            {location.email && (
              <a className="kw-text-link" href={`mailto:${location.email}`}>
                Email the church <ArrowUpRight size={16} />
              </a>
            )}
          </div>
          <div className="kw-address-list">
            {location.congregations.map((church) => (
              <article key={church.name}>
                <div>
                  <MapPin size={19} />
                  <h3>{church.name}</h3>
                </div>
                <p>{church.address}</p>
                <nav aria-label={`${church.name} contact options`}>
                  <a
                    href={mapHref(church.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get directions <ArrowUpRight size={15} />
                  </a>
                  <a href={phoneHref(church.phone)}>{church.phone}</a>
                </nav>
              </article>
            ))}
          </div>
        </div>
        {location.slug === "dallas" && (
          <div className="kw-values kw-visit-faq">
            <article>
              <h3>Parking</h3>
              <p>
                Guest parking is reserved. Turn on your hazard lights when you
                arrive and the parking team can guide you.
              </p>
            </article>
            <article>
              <h3>Children and teens</h3>
              <p>{DALLAS_CHILDREN}</p>
              <Link className="kw-text-link" href={localHref(context, "children")}>
                Children’s ministry <ArrowUpRight size={16} />
              </Link>
            </article>
            <article>
              <h3>What to expect</h3>
              <p>
                Dress comfortably. Water and coffee are available in the lobby
                before the service.
              </p>
              <a className="kw-text-link" href={location.sourceUrl}>
                Let the Dallas team know you’re coming <ArrowUpRight size={16} />
              </a>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}

function CommunityGallery({ context }: { context: PublicContext }) {
  const location = context.location!;
  const media = LOCATION_MEDIA[location.slug];
  return (
    <section id="community" className="kw-section kw-community">
      <div className="kw-shell">
        <div className="kw-section-heading">
          <div>
            <p className="kw-kicker">MORE THAN SUNDAY</p>
            <h2>A glimpse of {location.name}.</h2>
          </div>
          <Link className="kw-text-link" href={localHref(context, "contact")}>
            Get connected <ArrowUpRight size={18} />
          </Link>
        </div>
        <div
          className={`kw-gallery ${media.photos.length === 2 ? "two-photos" : ""}`}
        >
          {media.photos.map((photo, index) => (
            <Reveal key={photo.src} delay={index * 80}>
              <figure>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 650px) 85vw, 32vw"
                />
                <figcaption>
                  {photo.alt}
                  <span>
                    {location.slug === "nigeria"
                      ? "KingsWord Ikeja · Lagos"
                      : `KingsWord ${location.name}`}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <div className="kw-community-paths">
          {[
            {
              name: "Membership & small groups",
              text: "Ask about membership and small groups.",
              path: "contact",
            },
            {
              name: "Children & families",
              text: "Discover what a Sunday looks like for children.",
              path: "children",
            },
            {
              name: "Join a serving team",
              text: "Connect with the team and explore serving.",
              path: "contact",
            },
          ].map((item) => (
            <Link key={item.name} href={localHref(context, item.path)}>
              <h3>
                {item.name}
                <ArrowUpRight size={19} />
              </h3>
              <p>{item.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CinematicLocationHome({ context }: { context: PublicContext }) {
  const location = context.location!;
  const media = LOCATION_MEDIA[location.slug];
  return (
    <SiteFrame context={context}>
      <section className={`kw-place-hero place-${location.slug}`}>
        <div className="kw-shell kw-place-content">
          <Link href="/locations" className="kw-place-breadcrumb">
            Our locations <span>/</span> {location.region}
          </Link>
          <div className="kw-place-main">
            <div className="kw-place-copy">
              <p className="kw-kicker">
                KingsWord {location.name}
              </p>
              <h1>
                {media.heroLead}
                <br />
                <em>{media.heroAccent}</em>
              </h1>
              <p className="kw-place-intro">{media.intro}</p>
              <div className="kw-place-actions">
                <Link
                  href={localHref(context, "#visit")}
                  className="kw-button kw-button-light"
                >
                  {location.slug === "nigeria"
                    ? "Find a congregation"
                    : "Plan your visit"}{" "}
                  <ArrowUpRight size={18} />
                </Link>
                <a href="#watch" className="kw-button">
                  <Play size={15} /> Experience a service
                </a>
              </div>
              <div className="kw-hero-service">
                <span className="kw-kicker">
                  <span className="status-dot" />{" "}
                  {location.slug === "nigeria"
                    ? "ACROSS NIGERIA"
                    : "JOIN US THIS SUNDAY"}
                </span>
                <strong>
                  {location.services[0]?.time ?? "Find your nearest church"}
                </strong>
                <p>
                  {location.slug === "nigeria"
                    ? "Lagos. Abuja. Ibadan. And beyond."
                    : location.congregations[0].address}
                </p>
                <a href="#visit">
                  Service details & directions <ArrowDown size={17} />
                </a>
              </div>
            </div>
            <div className="kw-place-photo">
              <Image
                src={media.hero.src}
                alt={media.hero.alt}
                fill
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 900px) 100vw, 50vw"
              />
              <span>
                {location.slug === "nigeria"
                  ? "Sunday at KingsWord Ikeja, Lagos"
                  : `This is KingsWord ${location.name}`}
              </span>
            </div>
          </div>
          <div className="kw-place-bottom">
            <span>
              {location.slug === "nigeria"
                ? "Photographed at KingsWord Ikeja, Lagos"
                : `The KingsWord ${location.name} family`}
            </span>
            <a href="#life">
              Discover life here <ArrowDown size={15} />
            </a>
          </div>
        </div>
      </section>
      <section id="life" className="kw-section">
        <div className="kw-shell kw-welcome">
          <Reveal>
            <p className="kw-kicker">YOU BELONG HERE</p>
            <h2>{media.headline}</h2>
            <p>{location.description}</p>
            <p>{media.story}</p>
            {location.slug === "dallas" && (
              <div className="kw-place-actions">
                <a className="kw-text-link" href={DALLAS_LINKS.events}>
                  Dallas events <ArrowUpRight size={16} />
                </a>
                <a className="kw-text-link" href={DALLAS_LINKS.articles}>
                  Articles <ArrowUpRight size={16} />
                </a>
              </div>
            )}
            <Link href={localHref(context, "about")} className="kw-text-link">
              Meet your church family <ArrowUpRight size={18} />
            </Link>
          </Reveal>
          <Reveal delay={120} className="kw-welcome-photo">
            <Image
              src={media.photos[0].src}
              alt={media.photos[0].alt}
              fill
              sizes="(max-width: 650px) 90vw, 45vw"
            />
            <span>
              {location.slug === "nigeria"
                ? "KingsWord Ikeja · Lagos"
                : `KingsWord ${location.name}`}
            </span>
          </Reveal>
        </div>
      </section>
      <section id="watch" className="kw-section kw-watch">
        <div className="kw-shell">
          <div className="kw-section-heading">
            <div>
              <p className="kw-kicker">A WORD FOR YOUR WORLD</p>
              <h2>{media.watchTitle}</h2>
            </div>
            <p>{media.watchIntro}</p>
          </div>
          <ChurchVideos videos={media.videos} />
          {location.watchUrl && (
            <a
              className="kw-text-link kw-watch-more"
              href={location.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {location.slug === "dallas"
                ? "Browse Dallas sermons"
                : `More from ${location.name}`}
              <ArrowUpRight size={17} />
            </a>
          )}
        </div>
      </section>
      <CommunityGallery context={context} />
      <VisitSection context={context} />
      <TrainingFeature compact />
    </SiteFrame>
  );
}

export function CinematicInformationPage({
  context,
  page,
}: {
  context: PublicContext;
  page: "about" | "contact" | "children";
}) {
  const location = context.location;
  const media = LOCATION_MEDIA[location?.slug ?? "chicago"];
  const name = location ? `KingsWord ${location.name}` : "KingsWord";
  const titles = {
    about: (
      <>
        The story behind <em>{name}.</em>
      </>
    ),
    contact: (
      <>
        Say hello. <em>Plan your visit.</em>
      </>
    ),
    children: (
      <>
        Big beginnings for <em>little lives.</em>
      </>
    ),
  };
  return (
    <SiteFrame context={context}>
      <section className="kw-info-hero">
        <div className="kw-shell">
          <p className="kw-kicker">
            {name} ·{" "}
            {page === "about"
              ? "OUR STORY"
              : page === "contact"
                ? "LET’S CONNECT"
                : "CHILDREN’S MINISTRY"}
          </p>
          <h1>{titles[page]}</h1>
          <p>
            {page === "about"
              ? "Get to know what we believe, how we worship, and the people who serve our church."
              : page === "contact"
                ? "A first visit, a prayer request, a new beginning. We would love to hear your story."
                : "Helping the next generation know God, love His Word and discover who they are in Christ."}
          </p>
        </div>
      </section>
      {page === "contact" ? (
        <VisitSection context={context} />
      ) : page === "about" ? (
        <>
          <section className="kw-section">
            <div className="kw-shell kw-welcome">
              <Reveal>
                <p className="kw-kicker">OUR CALLING</p>
                <h2>
                  Raising a<br />
                  supernatural army.
                </h2>
                <p>
                  {location?.description ??
                    "KingsWord Ministries International brings together church communities across Africa, Europe and North America. The ministry was commissioned in 1997 with a calling to raise people of the Word and the Spirit."}
                </p>
                <p>
                  We teach the Word, emphasize victory through Jesus Christ, and
                  equip people to step into their God-given purpose. Our faith
                  finds expression in how we worship, how we serve and how we
                  live.
                </p>
                {location?.slug === "dallas" && (
                  <>
                    <p>
                      KingsWord Dallas began in February 2013 with four people
                      praying together in a home. Today the church serves the
                      Dallas–Fort Worth area as part of KingsWord Ministries
                      International.
                    </p>
                    <p>
                      Its mission is to help people live by Scripture, follow
                      the Holy Spirit and fulfill their God-given purpose.
                    </p>
                    <a className="kw-text-link" href={DALLAS_LINKS.about}>
                      Read the Dallas history, values and creed <ArrowUpRight size={16} />
                    </a>
                  </>
                )}
                <Link
                  className="kw-text-link"
                  href={location ? localHref(context, "#visit") : "/locations"}
                >
                  Find your place <ArrowUpRight size={18} />
                </Link>
              </Reveal>
              <Reveal className="kw-welcome-photo" delay={100}>
                <Image
                  src={media.photos[0].src}
                  alt={media.photos[0].alt}
                  fill
                  sizes="(max-width: 650px) 90vw, 45vw"
                />
              </Reveal>
            </div>
          </section>
          <section className="kw-section kw-watch">
            <div className="kw-shell">
              <div className="kw-section-heading">
                <div>
                  <p className="kw-kicker">WHAT GUIDES US</p>
                  <h2>What we believe.</h2>
                </div>
              </div>
              <div className="kw-values">
                {[
                  {
                    title: "The Word",
                    body: "Scripture shapes our understanding of God and becomes the foundation for everyday life.",
                  },
                  {
                    title: "The Spirit",
                    body: "Prayer, worship and a Spirit-filled life make room for God to work in and through us.",
                  },
                  {
                    title: "Our purpose",
                    body: "We equip people to serve faithfully, grow in grace and carry the love of Jesus into their communities.",
                  },
                ].map((value, index) => (
                  <article key={value.title}>
                    <span>0{index + 1}</span>
                    <h3>{value.title}</h3>
                    <p>{value.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
          {(LEADERS[location?.slug ?? "chicago"] ?? []).length > 0 && (
            <section className="kw-section">
              <div className="kw-shell">
                <p className="kw-kicker">MEET OUR LEADERS</p>
                <div className="kw-leaders">
                  {LEADERS[location?.slug ?? "chicago"].map((leader) => (
                    <article key={leader.name}>
                      <p>{leader.role}</p>
                      <h2>{leader.name}</h2>
                      <span>{leader.description}</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}
          <TrainingFeature compact />
        </>
      ) : (
        <>
          <section className="kw-section">
            <div className="kw-shell kw-children-intro">
              <div>
                <p className="kw-kicker">GROWING IN FAITH</p>
                <h2>
                  A foundation
                  <br />
                  for a lifetime.
                </h2>
                <p>
                  Prayer, worship and the Bible help children build a
                  relationship with God, one small step at a time.
                </p>
                <Link
                  href={localHref(context, "contact")}
                  className="kw-button kw-button-light"
                >
                  Plan your family’s visit <ArrowUpRight size={17} />
                </Link>
              </div>
              <blockquote>
                “Train up a child in the way he should go: and when he is old,
                he will not depart from it.”<cite>PROVERBS 22:6 · KJV</cite>
              </blockquote>
            </div>
          </section>
          <section className="kw-section kw-watch">
            <div className="kw-shell">
              <div className="kw-section-heading">
                <div>
                  <p className="kw-kicker">FOR YOUR FIRST VISIT</p>
                  <h2>A little planning for your first Sunday.</h2>
                </div>
              </div>
              <div className="kw-values">
                {[
                  {
                    title: "Before you come",
                    body: "Speak with the local team about age groups, check-in arrangements and any support your child needs.",
                  },
                  {
                    title: "Growing together",
                    body: "We want children to experience prayer, joyful worship and the truth of Scripture as part of daily life.",
                  },
                  {
                    title: "A place to begin",
                    body:
                      location?.slug === "chicago"
                        ? "Child care is available at every Sunday service. Ask our team about Vacation Bible School, Back to School, Hallelujah Night and our Christmas Production."
                        : location?.slug === "dallas"
                          ? DALLAS_CHILDREN
                          : "Every congregation has its own arrangements. Your local team can help you discover what is available for your family.",
                  },
                ].map((item, i) => (
                  <article key={item.title}>
                    <span>0{i + 1}</span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
      <section className="kw-connect-strip">
        <div className="kw-shell">
          <h2>
            {page === "contact"
              ? "Growing in faith, together."
              : "Your story belongs here."}
          </h2>
          <Link
            href={
              page === "contact"
                ? "/believers-training"
                : localHref(context, "contact")
            }
            className="kw-button"
          >
            {page === "contact"
              ? "Explore Believers Training"
              : "Let’s connect"}{" "}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </SiteFrame>
  );
}

export function CinematicLocationsPage({
  context,
}: {
  context: PublicContext;
}) {
  return (
    <SiteFrame context={context}>
      <section className="kw-info-hero">
        <div className="kw-shell">
          <h1>
            Find your <em>KingsWord church.</em>
          </h1>
          <p>
            Explore our communities in Chicago, Nigeria, Calgary, Dallas and
            London. Find service times, directions and a look inside each
            church.
          </p>
          <Link href="/explore" className="kw-text-link">
            Explore the globe <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="kw-section">
        <div className="kw-shell">
          <CinematicDirectory context={context} />
        </div>
      </section>
    </SiteFrame>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { SiteFooter } from "@/components/site-footer";
import { LOCATIONS, localHref, locationHref, mapHref, phoneHref, type PublicContext } from "@/lib/locations";

export function LocationDirectory({ context }: { context: PublicContext }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {LOCATIONS.map((location, index) => (
        <Link key={location.slug} href={locationHref(location, context.customDomain)} className="group flex min-h-64 flex-col justify-between rounded-2xl border border-[var(--line)] bg-white p-8 transition-colors hover:border-[var(--forest)] hover:bg-[var(--paper)]">
          <div className="flex justify-between gap-4 text-sm font-bold text-[var(--ink-soft)]"><span>{location.region}</span><span aria-hidden="true">0{index + 1}</span></div>
          <div><h3 className="display mt-10 text-4xl font-medium">{location.name}</h3><p className="mt-3 text-base text-[var(--ink-soft)]">{location.tagline}</p></div>
          <span className="mt-7 flex items-center gap-2 text-sm font-bold">Explore {location.name} <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></span>
        </Link>
      ))}
    </div>
  );
}

function TrainingInvitation() {
  return (
    <section className="bg-[var(--forest)] py-20 text-white">
      <div className="page-shell grid items-center gap-10 md:grid-cols-[1.5fr_1fr]">
        <div><p className="text-sm font-bold tracking-widest text-[var(--sun-soft)] uppercase">Believers Training</p><h2 className="display mt-5 text-4xl leading-tight md:text-5xl">One faith. A deeper foundation.</h2><p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">Seven modules in covenant, identity, Scripture, the Holy Spirit, prayer, purpose and stewardship. Grow at your own pace, wherever you call home.</p></div>
        <div className="flex flex-wrap gap-3 md:justify-end"><Link href="/believers-training" className="button-primary !border-[var(--sun)] !bg-[var(--sun)] !text-[var(--forest-deep)]">Explore the programme <ArrowRight size={18} /></Link><Link href="/login" className="button-secondary !border-white/30 !bg-transparent !text-white">Student login</Link></div>
      </div>
    </section>
  );
}

export function NetworkHome({ context }: { context: PublicContext }) {
  return (
    <><PublicNav context={context} /><main id="main-content">
      <section className="overflow-hidden bg-[var(--forest-deep)] text-white">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <div className="px-6 py-20 sm:px-10 lg:py-28 lg:pl-[max(40px,calc((100vw-1180px)/2))] lg:pr-14">
            <p className="text-sm font-bold tracking-[0.18em] text-[var(--sun-soft)] uppercase">KingsWord everywhere</p>
            <h1 className="display mt-8 text-[clamp(3.5rem,7vw,6.5rem)] leading-[0.95] tracking-[-0.045em]">A world of faith.<br /><span className="italic text-[var(--sun-soft)]">A place for you.</span></h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-white/75">Across cities and continents, we gather around the Word and the Spirit. Find your church family and take your next step with KingsWord.</p>
            <Link href="#locations" className="button-primary mt-9 !border-[var(--sun)] !bg-[var(--sun)] !text-[var(--forest-deep)]">Find your location <ArrowRight size={18} /></Link>
          </div>
          <figure className="relative m-0 min-h-80 lg:min-h-full">
            <Image src="/brand/hero-worship.jpg" alt="Worship at KingsWord Chicago" fill priority sizes="(min-width: 1024px) 48vw, 100vw" className="object-cover" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-8 pt-20 pb-6 text-sm text-white">Worship together · KingsWord Chicago</figcaption>
          </figure>
        </div>
        <div className="border-t border-white/20"><div className="page-shell flex flex-wrap gap-x-8 gap-y-3 py-6 text-sm font-bold text-white/80">{LOCATIONS.map((location) => <Link key={location.slug} href={locationHref(location, context.customDomain)}>{location.name}</Link>)}</div></div>
      </section>
      <section id="locations" className="scroll-mt-8 py-20 md:py-28"><div className="page-shell"><p className="eyebrow">Find your community</p><div className="mb-12 mt-5 flex flex-wrap items-end justify-between gap-6"><h2 className="display max-w-2xl text-5xl leading-tight md:text-6xl">Different places.<br />The same welcome.</h2><p className="max-w-sm text-lg leading-8 text-[var(--ink-soft)]">Choose a location for service times, directions and ways to connect.</p></div><LocationDirectory context={context} /></div></section>
      <TrainingInvitation />
    </main><SiteFooter context={context} /></>
  );
}

export function LocationsPage({ context }: { context: PublicContext }) {
  return <><PublicNav context={context} /><main id="main-content" className="page-shell py-20"><p className="eyebrow">KingsWord everywhere</p><h1 className="display mt-6 text-5xl md:text-7xl">Find your church family.</h1><p className="mt-6 mb-12 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">Worship with us in Chicago, Nigeria, Calgary, Dallas or London. Every location connects you to the same Believers Training programme.</p><LocationDirectory context={context} /></main><SiteFooter context={context} /></>;
}

function VisitDetails({ context }: { context: PublicContext }) {
  const location = context.location;
  if (!location) return <LocationDirectory context={context} />;
  return (
    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div><p className="eyebrow">Worship with us</p><h2 className="display mt-5 text-4xl leading-tight">{location.slug === "nigeria" ? "Find a congregation." : "Plan your visit."}</h2>
        {location.services.length ? <div className="mt-7 grid gap-4">{location.services.map((service) => <div key={service.day} className="rounded-2xl border border-[var(--line)] bg-white p-6"><p className="text-sm font-bold">{service.day}</p><p className="display mt-2 text-4xl">{service.time}</p><p className="mt-3 text-base leading-7 text-[var(--ink-soft)]">{service.note}</p></div>)}<p className="text-sm text-[var(--ink-soft)]">Local time · {location.timezone.replaceAll("_", " ")}</p></div> : <p className="mt-6 text-lg leading-8 text-[var(--ink-soft)]">{location.slug === "nigeria" ? "Service times vary by congregation. Contact your chosen church to plan your visit." : "Call the local team to confirm the next service time before you travel."}</p>}
        {location.email && <a href={`mailto:${location.email}`} className="mt-6 block break-all text-base font-bold underline">{location.email}</a>}
      </div>
      <div className="grid content-start gap-4">{location.congregations.map((church) => <article key={church.name} className="rounded-2xl border border-[var(--line)] bg-white p-7"><h3 className="display text-2xl font-semibold">{church.name}</h3><p className="mt-4 flex gap-3 text-base leading-7 text-[var(--ink-soft)]"><MapPin className="mt-1 shrink-0" size={18} />{church.address}</p><div className="mt-5 flex flex-wrap gap-x-6 gap-y-4 text-sm font-bold"><a href={mapHref(church.address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 underline">Get directions <ArrowUpRight size={16} /></a><a href={phoneHref(church.phone)} className="underline">{church.phone}</a></div></article>)}
      </div>
    </div>
  );
}

export function LocationHome({ context }: { context: PublicContext }) {
  const location = context.location!;
  return <><PublicNav context={context} /><main id="main-content">
    <section className="bg-[var(--forest-deep)] py-20 text-white md:py-28"><div className="page-shell"><Link href="/locations" className="text-sm font-bold text-white/70 underline">KingsWord everywhere / {location.region}</Link><p className="mt-12 text-sm font-bold tracking-widest text-[var(--sun-soft)] uppercase">{location.tagline}</p><h1 className="display mt-6 text-[clamp(3.5rem,10vw,8rem)] leading-none tracking-[-0.05em]">KingsWord<br /><span className="italic text-[var(--sun-soft)]">{location.name}.</span></h1><p className="mt-8 max-w-2xl text-lg leading-8 text-white/75">{location.description}</p><div className="mt-9 flex flex-wrap gap-3"><Link href={localHref(context, "#visit")} className="button-primary !border-[var(--sun)] !bg-[var(--sun)] !text-[var(--forest-deep)]">{location.slug === "nigeria" ? "Find a congregation" : "Plan your visit"} <ArrowRight size={18} /></Link>{location.watchUrl && <a href={location.watchUrl} target="_blank" rel="noopener noreferrer" className="button-secondary !border-white/30 !bg-transparent !text-white">Watch a service <ArrowUpRight size={17} /></a>}</div></div></section>
    <section id="visit" className="scroll-mt-8 py-20 md:py-28"><div className="page-shell"><VisitDetails context={context} /></div></section>
    <section className="border-t border-[var(--line)] bg-white py-20"><div className="page-shell grid gap-12 md:grid-cols-2"><div><p className="eyebrow">Life together</p><h2 className="display mt-5 text-4xl leading-tight md:text-5xl">Faith grows in community.</h2></div><div><p className="text-lg leading-8 text-[var(--ink-soft)]">There is a next step for every season of life. Speak with the local team about membership, small groups, serving and children’s ministry.</p><Link href={localHref(context, "contact")} className="button-primary mt-7">Connect with us <ArrowRight size={17} /></Link></div></div></section>
    <TrainingInvitation />
  </main><SiteFooter context={context} /></>;
}

export function InformationPage({ context, page }: { context: PublicContext; page: "about" | "contact" | "children" }) {
  const location = context.location;
  const name = location ? `KingsWord ${location.name}` : "KingsWord";
  const title = { about: "Rooted in the Word. Led by the Spirit.", contact: location ? `Connect with ${name}.` : "Let’s get you connected.", children: "A foundation for the next generation." }[page];
  return <><PublicNav context={context} /><main id="main-content"><section className="bg-[var(--forest-deep)] py-20 text-white"><div className="page-shell"><p className="text-sm font-bold tracking-widest text-[var(--sun-soft)] uppercase">{page === "children" ? "Children’s ministry" : page}</p><h1 className="display mt-6 max-w-4xl text-5xl leading-tight md:text-7xl">{title}</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-white/75">{page === "about" ? "Raising a supernatural army: people of the Word, yielded to the Spirit and committed to God’s purpose." : page === "contact" ? "Questions about visiting, community, prayer or your next step? Connect directly with a local congregation." : "Help your children grow in faith, discover Scripture and learn to pray. Your local church team can help you plan a family visit."}</p></div></section>
      <section className="py-20"><div className="page-shell">{page === "contact" ? <VisitDetails context={context} /> : page === "about" ? <div className="grid gap-12 md:grid-cols-2"><div><p className="eyebrow">Our church family</p><h2 className="display mt-5 text-4xl leading-tight">A life of faith and purpose.</h2><p className="mt-6 text-lg leading-8 text-[var(--ink-soft)]">{location?.description ?? "KingsWord brings together communities across Africa, Europe and North America. We gather to worship, learn from Scripture and put our faith into practice."}</p><Link href={location ? localHref(context, "#visit") : "/locations"} className="button-primary mt-7">Find your community <ArrowRight size={17} /></Link></div><div className="grid gap-6">{[{ title: "Know the Word", body: "Build your life on Scripture and grow in your relationship with God." }, { title: "Live by the Spirit", body: "Make room for prayer, worship and the work of the Holy Spirit in everyday life." }, { title: "Serve with purpose", body: "Put your faith into action in your church, your community and your world." }].map((item) => <article key={item.title} className="border-b border-[var(--line)] pb-6"><h3 className="display text-2xl font-semibold">{item.title}</h3><p className="mt-3 text-base leading-7 text-[var(--ink-soft)]">{item.body}</p></article>)}</div></div> : <div className="max-w-3xl"><h2 className="display text-4xl">Plan a visit with your children.</h2><p className="mt-6 text-lg leading-8 text-[var(--ink-soft)]">Contact {location ? name : "your local congregation"} to ask about age groups, check-in, service arrangements and any support your child needs.</p><Link href={localHref(context, "contact")} className="button-primary mt-8">Talk to the local team <ArrowRight size={17} /></Link></div>}</div></section>
      {page === "about" && <TrainingInvitation />}
    </main><SiteFooter context={context} /></>;
}

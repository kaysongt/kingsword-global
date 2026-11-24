import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, HeartHandshake, Users, ShieldCheck } from "lucide-react";
import { ChicagoCheckIn } from "@/components/chicago-check-in";
import { SiteFrame } from "@/components/location-site";
import { CHURCH } from "@/lib/church";
import { localHref, type PublicContext } from "@/lib/locations";
import "./chicago-community.css";

export const CHICAGO_PAGES = {
  members: "My Chicago",
  "check-in": "Sunday check-in",
  groups: "Small groups",
  gatherings: "Gatherings",
  confessions: "Monthly Confessions",
  team: "Staff & leaders",
} as const;
export type ChicagoPage = keyof typeof CHICAGO_PAGES;

function publicUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}
const portalUrl = publicUrl(process.env.NEXT_PUBLIC_CHICAGO_MEMBER_PORTAL_URL);
const connectUrl = publicUrl(process.env.NEXT_PUBLIC_CHICAGO_CONNECT_FORM_URL) ?? "https://kingswordchicago.breezechms.com/form/89a2bc";
const groupsUrl = publicUrl(process.env.NEXT_PUBLIC_CHICAGO_GROUP_FORM_URL);
const email = (subject: string) => `mailto:${CHURCH.email}?subject=${encodeURIComponent(subject)}`;

export function ChicagoNextSteps({ context }: { context: PublicContext }) {
  const steps = [
    { title: "New here? Start here.", text: "Meet the welcome team and find your next step in the Chicago family.", path: "members", Icon: HeartHandshake },
    { title: "Find your people.", text: "Ask about small groups and ways to grow alongside others.", path: "groups", Icon: Users },
    { title: "Make room for community.", text: "Plan for Sunday, midweek worship and time together.", path: "gatherings", Icon: CalendarDays },
  ];
  return <section className="kw-section chi-next" aria-labelledby="chi-next-title"><div className="kw-shell">
    <div className="kw-section-heading"><div><p className="kw-kicker">LIFE AT KINGSWORD CHICAGO</p><h2 id="chi-next-title">A place for you.<br />A next step together.</h2></div><p>Whether this is your first Sunday or your church home, there is a place for you to connect.</p></div>
    <div className="chi-grid">{steps.map(({ title, text, path, Icon }) => <Link className="chi-card" href={localHref(context, path)} key={path}><Icon aria-hidden="true" size={28}/><h3>{title}</h3><p>{text}</p><span className="kw-text-link">Explore <ArrowUpRight size={18} aria-hidden="true"/></span></Link>)}</div>
  </div></section>;
}

const intro = {
  "check-in": { kicker: "KINGSWORD CHICAGO", title: "Sunday service check-in", text: "Here with us in person? Check in once during today’s Sunday service using your name and email." },
  members: { kicker: "YOUR CHICAGO CHURCH FAMILY", title: "Welcome home.", text: "Find your next step, stay connected and make yourself at home at KingsWord Chicago." },
  groups: { kicker: "GROW TOGETHER", title: "Faith grows in community.", text: "Get to know people beyond Sunday. Let us help you find a small group that fits your season of life." },
  gatherings: { kicker: "MAKE TIME TO GATHER", title: "See you at church.", text: "Worship, learn and pray with the Chicago family. All service times are local to Chicago." },
  confessions: { kicker: "MONTHLY CONFESSIONS", title: "November 2026 Confession", text: "" },
  team: { kicker: "STAFF & MINISTRY LEADERS", title: "Care for the church family.", text: "Use your assigned church account to manage attendance, member care and ministry administration." },
};

export function ChicagoCommunityPage({ context, page }: { context: PublicContext; page: ChicagoPage }) {
  if (page === "check-in") {
    return <SiteFrame context={context}>
      <section className="chi-arrival" aria-labelledby="arrival-title">
        <Image src="/media/chicago-worship.jpg" alt="" fill sizes="100vw" priority />
        <div className="chi-arrival-layout">
          <header className="chi-arrival-welcome">
            <p className="chi-arrival-label">KingsWord Chicago</p>
            <h1 id="arrival-title">Welcome<br /><em>home.</em></h1>
            <p>We’re glad you’re here. Check in when you arrive for Sunday service.</p>
          </header>
          <ChicagoCheckIn endpoint={process.env.NEXT_PUBLIC_CHICAGO_CHECKIN_ENDPOINT === "off" ? "" :
            publicUrl(process.env.NEXT_PUBLIC_CHICAGO_CHECKIN_ENDPOINT)?.replace(/\/$/, "") || "https://kingsword-chicago-checkin-production.up.railway.app"} />
        </div>
      </section>
    </SiteFrame>;
  }
  const content = intro[page];
  return <SiteFrame context={context}>
    <section className="kw-info-hero chi-hero"><div className="kw-shell">
      <Link href={localHref(context)} className="kw-text-link">KingsWord Chicago</Link>
      <p className="kw-kicker">{content.kicker}</p><h1>{content.title}</h1>{content.text && <p>{content.text}</p>}
      <nav className="chi-subnav" aria-label="Chicago community">{Object.entries(CHICAGO_PAGES).filter(([key]) => key !== "team").map(([key, title]) => <Link key={key} href={localHref(context, key)} aria-current={key === page ? "page" : undefined}>{title}</Link>)}</nav>
    </div></section>
    <section className="kw-section chi-content"><div className="kw-shell">
      {page === "confessions" && <article className="chi-confession" aria-label="November 2026 confession">
        <p>I give thanks to the Father, who has qualified me to share in the inheritance of the saints in light. He has delivered me from the power of darkness and brought me into the kingdom of His beloved Son. In Christ, I have redemption and the forgiveness of sins. I am accepted, secure, surrounded by His love, and blessed beyond measure.</p>
        <p>My eyes are open to His goodness, and my heart remembers His faithfulness. I live with a grateful heart. My eyes are open to God’s goodness, and I remember His faithfulness in every season. I rest in Christ’s finished work and receive the abundance of His grace.</p>
        <p>Thanksgiving fills my mouth, and God’s peace guards my heart and mind. I recognize His gifts in ordinary moments and acknowledge His hand upon my life. God’s presence sustains me through every storm. His joy renews my strength, and His love anchors my soul.</p>
        <p>I choose contentment over comparison, appreciation over complaint, and faith over fear. My words encourage others, and my actions reflect His kindness. I give thanks over my household and church family. I face each day with confidence, knowing that my Father cares for me.</p>
        <p>On a consistent basis, gratitude shapes my perspective, strengthens my faith, and overflows from my life. (Amen)</p>
      </article>}
      {page === "members" && <>
        <div className="chi-feature"><div><p className="kw-kicker">YOUR FIRST STEP</p><h2>We would love to know you.</h2><p>Visiting Chicago or trying church for the first time? Leave your name and email if you’d like our welcome team to get in touch. You’re welcome to visit for as long as you like.</p><a className="kw-button kw-button-light" href="https://kingswordchicago.breezechms.com/form/fc2427">Fill out the welcome card<ArrowUpRight size={18}/></a></div>
          <aside className="chi-note"><HeartHandshake size={30} aria-hidden="true"/><h3>Your member portal</h3>{portalUrl ? <><p>Open the Chicago member portal to sign in and view the services available to your account.</p><a href={portalUrl} className="kw-button kw-button-light">Open member portal <ArrowUpRight size={18}/></a></> : <><p>Here for Sunday service? Use the attendance form when you arrive.</p><Link className="kw-text-link" href={localHref(context, "check-in")}>Sunday check-in <ArrowUpRight size={16}/></Link></>}</aside></div>
        <div className="chi-grid chi-spaced">
          <article className="chi-card"><h3>Ready to become a member?</h3><p>Sign up for a Connect meeting when you’re ready to join. Your membership begins when you attend. We’ll help you find your small group and fellowship group there.</p><a href={connectUrl} className="kw-text-link">Sign up for Connect <ArrowUpRight size={16}/></a></article>
          <article className="chi-card"><h3>Find community</h3><p>Ask about small groups, meeting times and the best place for you to connect.</p><Link href={localHref(context, "groups")} className="kw-text-link">Small groups <ArrowUpRight size={16}/></Link></article>
          <article className="chi-card"><h3>Make a difference</h3><p>Tell the church team where you would like to serve and ask about current opportunities.</p><a href={email("I'd like to serve at KingsWord Chicago")} className="kw-text-link">Ask about serving <ArrowUpRight size={16}/></a></article>
        </div>
        <div className="chi-support"><div><h3>Need prayer or a conversation?</h3><p>Contact the church team to arrange a conversation. You do not need a member account to reach us.</p></div><a className="kw-button" href={email("I'd like to speak with the church team")}>Contact the team <ArrowUpRight size={18}/></a></div>
      </>}
      {page === "groups" && <>
        <div className="chi-feature"><div><p className="kw-kicker">FIND YOUR GROUP</p><h2>A smaller circle.<br />Room to grow.</h2><p>Share your preferred day, general area and whether you are looking to meet online or in person. The Chicago team can confirm current groups, availability and the next meeting.</p><a className="kw-button kw-button-light" href={groupsUrl ?? email("Small group enquiry — KingsWord Chicago")}>{groupsUrl ? "Ask about a group" : "Email about small groups"}<ArrowUpRight size={18}/></a></div><aside className="chi-note"><Users size={30} aria-hidden="true"/><h3>Let us help you connect</h3><p>Current group listings and meeting details are available from the church team. Contact us before making plans to attend.</p><a href={CHURCH.phoneHref} className="kw-text-link">{CHURCH.phone}</a></aside></div>
        <div className="chi-steps chi-spaced"><article><span>01</span><h3>Tell us what works</h3><p>Let us know your availability and what you are hoping to find.</p></article><article><span>02</span><h3>Meet a group leader</h3><p>The church team can introduce you and confirm the details.</p></article><article><span>03</span><h3>Come as you are</h3><p>Bring your questions and get to know your church family.</p></article></div>
        <div className="chi-support"><div><h3>Interested in helping lead?</h3><p>Speak with the church team about group leadership and serving opportunities.</p></div><a className="kw-button" href={email("Small group leadership enquiry")}>Get in touch <ArrowUpRight size={18}/></a></div>
      </>}
      {page === "gatherings" && <>
        <div className="chi-grid">{CHURCH.services.map(service => <article className="chi-card" key={service.day}><CalendarDays size={28} aria-hidden="true"/><p className="kw-kicker">{service.day}</p><h2>{service.time}</h2><p>{service.note}</p><Link href={localHref(context, "#visit")} className="kw-text-link">Plan your visit <ArrowUpRight size={16}/></Link></article>)}<article className="chi-card"><h3>Join us online</h3><p>Watch services and revisit messages on the church’s YouTube channel.</p><a href={CHURCH.watchUrl} className="kw-text-link">Watch messages <ArrowUpRight size={16}/></a></article></div>
        <div className="chi-support"><div><h3>Special events & announcements</h3><p>Contact the Chicago team for upcoming events, registration details and any changes to the regular schedule.</p></div><a className="kw-button" href={email("Upcoming Chicago church events")}>Ask about events <ArrowUpRight size={18}/></a></div>
        <Link href={localHref(context, "children")} className="kw-text-link">Bringing children? Explore children’s ministry <ArrowUpRight size={18}/></Link>
      </>}
      {page === "team" && <>
        <div className="chi-feature"><div><p className="kw-kicker">CHURCH OPERATIONS</p><h2>Open your staff workspace.</h2><p>Breeze is the church’s current workspace for member records and attendance. Sign in with your existing staff account; your assigned permissions determine what you can access.</p><a className="kw-button kw-button-light" href="https://kingswordchicago.breezechms.com">Sign in to Breeze <ArrowUpRight size={18}/></a></div><aside className="chi-note"><ShieldCheck size={30} aria-hidden="true"/><h3>Staff access only</h3><p>This page does not display member information. If you need staff access or a change to your responsibilities, contact the church administrator.</p><a href={email("KingsWord Chicago staff access request")} className="kw-text-link">Request staff access <ArrowUpRight size={16}/></a></aside></div>
        <div className="chi-support"><div><h3>Attendance & member care</h3><p>After Sunday service, the office confirms that attendance was taken for the dated service in Breeze. The small group organizing committee reviews referrals and assigns a leader to follow up.</p></div><Link href={localHref(context, "members")} className="kw-button">View member entry page <ArrowUpRight size={18}/></Link></div>
      </>}
    </div></section>
  </SiteFrame>;
}

"use client";

import { useEffect, useRef, useState, type FormEvent, type HTMLInputTypeAttribute } from "react";
import { ArrowRight, Check, ChevronDown, Mail, MapPin, UserRound } from "lucide-react";

const sunday = "https://kingswordchicago.breezechms.com/form/fc242753";
const welcome = "https://kingswordchicago.breezechms.com/form/fc2427";
const regionCodes = "AA AB AE AK AL AP AR AS AZ BC CA CO CT DC DE FL FM GA GU HI IA ID IL IN KS KY LA MA MB MD ME MH MI MN MO MP MS MT NB NC ND NE NH NJ NL NM NS NT NU NV NY OH OK ON OR PA PE PR PW QC RI SC SD SK TN TX UT VA VI VT WA WI WV WY YT".split(" ");

type Step = "arrival" | "invite" | "profile" | "complete";
type Field = { key: string; label: string; autocomplete?: string; type?: HTMLInputTypeAttribute; choices?: string[] };
const groups: { title: string; fields: Field[] }[] = [
  { title: "Phone & address", fields: [
    { key: "mobile", label: "Mobile phone", type: "tel", autocomplete: "mobile tel" },
    { key: "home", label: "Home phone", type: "tel", autocomplete: "home tel" },
    { key: "work", label: "Work phone", type: "tel", autocomplete: "work tel" },
    { key: "street", label: "Street address", autocomplete: "address-line1" },
    { key: "unit", label: "Apartment or suite", autocomplete: "address-line2" },
    { key: "city", label: "City", autocomplete: "address-level2" },
    { key: "state", label: "State or province", choices: regionCodes, autocomplete: "address-level1" },
    { key: "zip", label: "Postal code", autocomplete: "postal-code" },
    { key: "country", label: "Country", autocomplete: "country-name" },
  ] },
  { title: "About you", fields: [
    { key: "title", label: "Title", autocomplete: "honorific-prefix", choices: ["Mr.", "Mrs.", "Ms.", "Dr.", "Pastor"] },
    { key: "birth", label: "Birthday", type: "date", autocomplete: "bday" },
    { key: "gender", label: "Gender", choices: ["Male", "Female", "Not Stated"] },
    { key: "ageGroup", label: "Age group", choices: ["Child", "Teen", "College", "Single", "Older Single", "Married", "Over 50", "Not Stated"] },
    { key: "anniversary", label: "Wedding anniversary", type: "date" },
  ] },
  { title: "Education & work", fields: [
    { key: "grade", label: "School grade" },
    { key: "employment", label: "Employment status", choices: ["Student", "Employed", "Not Employed", "Retired"] },
    { key: "occupation", label: "Field of work or study" },
  ] },
  { title: "Church connections", fields: [
    { key: "interest", label: "Are you interested in membership?", choices: ["Yes - Expressed Interest", "No"] },
    { key: "campus", label: "Home campus" }, { key: "group", label: "Life group" },
    { key: "team", label: "Serving team" }, { key: "training", label: "Training class" },
  ] },
];

function readLocal(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeLocal(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Private browsing can disable storage. */ }
}

export function ChicagoCheckIn({ endpoint }: { endpoint: string }) {
  const [step, setStep] = useState<Step>("arrival");
  const [identity, setIdentity] = useState({ first: "", last: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shared, setShared] = useState(false);
  const [details, setDetails] = useState<Record<string, string>>({});
  const device = useRef("");
  const receipt = useRef("");
  const sending = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const initial = useRef(true);
  useEffect(() => {
    if (!initial.current) heading.current?.focus({ preventScroll: true });
    initial.current = false;
  }, [step]);

  function finish(sent = false) {
    setShared(sent);
    receipt.current = "";
    setDetails({});
    setError("");
    setIdentity({ first: "", last: "", email: "" });
    setStep("complete");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const isProfile = step === "profile";
    const answers = Object.fromEntries(Object.entries(details).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value));
    if (isProfile && !Object.keys(answers).length) { finish(); return; }
    const clean = { first: identity.first.trim(), last: identity.last.trim(), email: identity.email.trim() };
    if (!clean.first || !clean.last) { setError("Enter your first and last name."); return; }
    setError("");
    setBusy(true);
    sending.current = true;
    try {
      if (!device.current) {
        device.current = readLocal("kw.chicago.device") || crypto.randomUUID();
        writeLocal("kw.chicago.device", device.current);
      }
      const response = await fetch(endpoint + (isProfile ? "/welcome" : "/attendance"), {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit",
        referrerPolicy: "no-referrer", cache: "no-store", signal: AbortSignal.timeout(80000),
        body: JSON.stringify({ ...clean, device: device.current, ...(isProfile ? { receipt: receipt.current, details: answers } : {}) }),
      });
      if (!response.ok) {
        if (response.status === 409) throw Error("Breeze hasn’t confirmed this submission. Please check with the welcome team before sending it again.");
        if (response.status === 429) throw Error("Several people are checking in. Give it a moment, then try again.");
        throw Error("We couldn’t save this in Breeze. Your answers are still here. Try again or use the direct form below.");
      }
      const result = await response.json();
      if (result.saved !== true || (!isProfile && (!result.receipt || !result.marker))) throw Error();
      if (isProfile) { finish(true); return; }
      receipt.current = result.receipt;
      const markerKey = "kw.chicago.seen." + result.marker;
      if (readLocal(markerKey)) { finish(); return; }
      writeLocal(markerKey, "1");
      setStep("invite");
    } catch (reason) {
      setError(reason instanceof Error && reason.constructor === Error && reason.message ? reason.message :
        "We couldn’t confirm the submission. Please check your connection or ask the welcome team.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  if (!endpoint) return <div className="chi-arrival-card">
    <h2>Sunday check-in</h2><p>Enter your name and email. After you check in, first-time guests can choose to share more with our welcome team.</p>
    <iframe title="Your Sunday attendance" src={sunday + "?embedded=true&background_color=ffffff&border_width=0&button_color=173b63"} />
    <small><a href={sunday}>Open the check-in form directly</a></small>
  </div>;

  return <div className="chi-arrival-card chi-check">
    <div className="chi-check-meta">{step === "arrival" ? <MapPin aria-hidden size={15}/> : <Check aria-hidden size={16}/>}
      {step === "arrival" ? "Sunday service · Chicago" : "Sunday check-in saved"}</div>
    <h2 ref={heading} tabIndex={-1}>{step === "arrival" ? "Sunday check-in" : step === "invite" ? "First time checking in?" :
      step === "profile" ? "Your welcome card" : shared ? "Welcome card saved." : "You’re checked in."}</h2>
    {step === "arrival" && <p>Let us know you’re here with your name and email.</p>}
    {step === "invite" && <><p>Welcome, {identity.first.trim()}! Would you like to share a little more with our welcome team?</p>
      <button type="button" className="chi-check-primary" onClick={() => setStep("profile")}>Yes, share more <ArrowRight aria-hidden size={18}/></button>
      <button type="button" className="chi-check-secondary" onClick={() => finish()}>No thanks, I’m all set</button></>}
    {step === "complete" && <><p>{shared ? "Thank you for sharing with the welcome team. Enjoy the service!" : "We’re glad you’re worshipping with us today."}</p>
      <button type="button" className="chi-check-secondary" onClick={() => { setStep("arrival"); setShared(false); }}>Check in another person</button></>}
    {(step === "arrival" || step === "profile") && <form method="post" action={step === "profile" ? welcome : sunday} onSubmit={submit} aria-busy={busy}>
      {step === "arrival" ? <>
        <div className="chi-check-fields">{(["first", "last"] as const).map((key) => <label key={key}>
          {key === "first" ? "First name" : "Last name"}
          <span className="chi-check-input">{key === "first" && <UserRound aria-hidden size={17}/>}
            <input name={key} required maxLength={key === "first" ? 80 : 100} autoComplete={key === "first" ? "given-name" : "family-name"}
              value={identity[key]} onChange={e => setIdentity({ ...identity, [key]: e.target.value })} disabled={busy}/></span></label>)}</div>
        <label>Email address<span className="chi-check-input"><Mail aria-hidden size={17}/>
          <input name="email" type="email" autoComplete="email" maxLength={254} required value={identity.email} autoCapitalize="none" spellCheck={false}
            onChange={e => setIdentity({ ...identity, email: e.target.value })} disabled={busy}/></span></label>
      </> : <>
        <p>Share whichever details you’d like, {identity.first.trim()}. Every question here is optional.</p>
        {groups.map(group => <details key={group.title} className="chi-check-group">
          <summary>{group.title}<ChevronDown aria-hidden size={17}/></summary>
          <div>{group.fields.map(field => <label key={field.key}>{field.label}
            {field.choices ? <select name={field.key} autoComplete={field.autocomplete} value={details[field.key] ?? ""} disabled={busy}
              onChange={e => setDetails({ ...details, [field.key]: e.target.value })}><option value="">Choose an option</option>
              {field.choices.map(choice => <option key={choice} value={choice}>{choice === "Yes - Expressed Interest" ? "Yes" : choice}</option>)}</select>
              : <input name={field.key} type={field.type || "text"} maxLength={180} autoComplete={field.autocomplete} disabled={busy}
                value={details[field.key] ?? ""} onChange={e => setDetails({ ...details, [field.key]: e.target.value })}/>}</label>)}</div>
        </details>)}
      </>}
      {error && <p role="alert" className="chi-check-error">{error}</p>}
      <button type="submit" className="chi-check-primary" disabled={busy}>
        {busy ? "Saving in Breeze…" : step === "arrival" ? "Check me in" : "Finish welcome card"}{!busy && <ArrowRight aria-hidden size={18}/>}</button>
      {step === "profile" && <button type="button" className="chi-check-secondary" disabled={busy} onClick={() => finish()}>Skip and finish</button>}
      <small>{step === "arrival" ? "Having trouble? " : "Prefer the full form? "}<a href={step === "arrival" ? sunday : welcome}>Open in Breeze</a></small>
    </form>}
  </div>;
}

import Link from "next/link";

export const metadata = { title: "Download the BBT Final Assessment", robots: { index: false } };

export default function PrintableAssessmentPage() {
  return (
    <main className="page-shell max-w-2xl py-16">
      <Link href="/believers-training#assessment" className="button-secondary">Believers Training</Link>
      <h1 className="display mt-8 text-4xl font-semibold">Download the BBT final assessment</h1>
      <p className="mt-4 leading-7">
        Enter your church name and location to download the printable exam. We save both details with the download record.
      </p>
      <form method="post" action="/final-assessment/print/download" className="mt-8 grid gap-5">
        <div className="field">
          <label htmlFor="church">Church name</label>
          <input id="church" name="church" required minLength={2} maxLength={200} />
        </div>
        <div className="field">
          <label htmlFor="location">Church location</label>
          <input id="location" name="location" required minLength={2} maxLength={200} placeholder="City, state or province, and country" />
        </div>
        <button className="button-primary">Download printable exam</button>
      </form>
      <p className="mt-5 text-sm">Open the downloaded file in your browser to print it or save it as a PDF.</p>
    </main>
  );
}

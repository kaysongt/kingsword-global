import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, FileText, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clearanceLabel, fileSizeLabel } from "@/lib/ministry-policy";
import { ministerLogout } from "./actions";

export const metadata = { title: "Ministry Files and Documents" };

export default async function MinistersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/ministers/login");
  const profile = await db.ministerProfile.findUnique({
    where: { userId: user.id },
    select: { status: true, clearance: true },
  });
  const admin = user.role === "ADMIN";
  const approved =
    profile?.status === "APPROVED" &&
    profile.clearance >= 1 &&
    profile.clearance <= 3;
  const query = (await searchParams).q?.trim().slice(0, 160) ?? "";
  const files =
    admin || approved
      ? await db.ministryFile.findMany({
          where: {
            status: "PUBLISHED",
            clearance: { lte: admin ? 3 : profile!.clearance },
            ...(query
              ? { title: { contains: query, mode: "insensitive" } }
              : {}),
          },
          select: {
            id: true,
            title: true,
            description: true,
            fileName: true,
            byteSize: true,
            clearance: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : [];
  return (
    <div className="kw-shell">
      <header className="ministry-header">
        <div>
          <p className="kw-kicker">KingsWord MINISTERS</p>
          <h1>
            Ministry Files
            <br />
            and Documents
          </h1>
          <p>Welcome, {user.fullName}.</p>
        </div>
        <nav aria-label="Minister account">
          <Link href="/explore" className="kw-button">
            Church website
          </Link>
          <form action={ministerLogout}>
            <button className="kw-button">Sign out</button>
          </form>
        </nav>
      </header>
      {admin || approved ? (
        <>
          <span className="ministry-status">
            <ShieldCheck size={16} />
            {admin ? "Administrator" : clearanceLabel(profile!.clearance)}
          </span>
          <p className="mt-4 text-sm leading-7 text-[#42566d]">
            Documents available to your clearance level and below. Downloads are
            private to approved ministers.
          </p>
          {admin && (
            <p className="ministry-admin-link">
              <Link href="/admin/ministers" className="kw-text-link">
                Manage ministers
              </Link>
              <span className="mx-4">·</span>
              <Link href="/admin/ministry-files" className="kw-text-link">
                Manage documents
              </Link>
            </p>
          )}
          <form className="ministry-filter">
            <div className="field">
              <label htmlFor="document-search">Search document titles</label>
              <input
                id="document-search"
                name="q"
                defaultValue={query}
                maxLength={160}
                placeholder="Search ministry files"
              />
            </div>
            <button className="kw-button kw-button-light">Search</button>
            {query && (
              <Link href="/ministers" className="kw-button">
                Clear
              </Link>
            )}
          </form>
          {files.length ? (
            <div className="ministry-files">
              {files.map((file) => (
                <article className="ministry-file" key={file.id}>
                  <FileText size={26} color="#1743ad" />
                  <span className="ministry-status">
                    {clearanceLabel(file.clearance)}
                  </span>
                  <h2>{file.title}</h2>
                  {file.description && <p>{file.description}</p>}
                  <div className="ministry-file-meta">
                    <span>
                      {file.fileName.split(".").pop()?.toUpperCase()} ·{" "}
                      {fileSizeLabel(file.byteSize)}
                    </span>
                    <span>
                      Updated {file.updatedAt.toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <a
                    href={`/ministers/files/${file.id}`}
                    className="kw-text-link"
                  >
                    <Download size={18} />
                    Download document
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <section className="ministry-panel ministry-empty">
              <h2>
                {query ? "No matching documents" : "Your library is ready"}
              </h2>
              <p>
                {query
                  ? "Try another title or clear your search."
                  : "There are no published documents at your clearance level yet. Your administrator can add them here."}
              </p>
            </section>
          )}
          {files.length === 100 && (
            <p className="mt-6 text-sm">
              Showing the first 100 results. Search for a title to narrow the
              list.
            </p>
          )}
        </>
      ) : (
        <section className="ministry-panel ministry-empty">
          <span className="ministry-status">
            {profile?.status === "PENDING"
              ? "Awaiting approval"
              : profile?.status === "DECLINED"
                ? "Request declined"
                : profile?.status === "SUSPENDED"
                  ? "Access suspended"
                  : "Request access"}
          </span>
          <h2 className="mt-6">
            {profile?.status === "PENDING"
              ? "Your request is with our team."
              : profile
                ? "Please contact your administrator."
                : "Tell us about your ministry."}
          </h2>
          <p>
            {profile?.status === "PENDING"
              ? "You can sign in to check your status. Ministry files will appear here once an administrator approves your request and assigns a clearance level."
              : profile
                ? "Your account cannot access ministry documents at the moment. Speak with the church administrator about your access."
                : "You are signed in, but minister access has not been requested for this account yet."}
          </p>
          {!profile && (
            <Link
              href="/ministers/signup"
              className="kw-button kw-button-light"
            >
              Request minister access
            </Link>
          )}
        </section>
      )}
    </div>
  );
}

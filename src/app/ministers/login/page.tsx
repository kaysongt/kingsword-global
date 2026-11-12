import Link from "next/link";
import { FolderLock, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/app/login/login-form";

export const metadata = { title: "Ministers Login" };

export default function MinistersLoginPage() {
  return (
    <div className="kw-shell ministry-auth">
      <section className="ministry-intro">
        <span className="ministry-icon">
          <FolderLock size={28} />
        </span>
        <p className="kw-kicker">KingsWord MINISTERS</p>
        <h1>
          Resources for
          <br />
          <em>your ministry.</em>
        </h1>
        <p>
          A private library for the pastors and ministers serving our KingsWord
          family.
        </p>
        <div className="ministry-note">
          <ShieldCheck size={22} />
          <p>
            Access is approved by a site administrator. Your clearance
            determines which documents you can see.
          </p>
        </div>
        <Link href="/explore" className="kw-text-link">
          Back to KingsWord
        </Link>
      </section>
      <section className="ministry-panel">
        <h2>Ministers Login</h2>
        <p>
          Sign in with your KingsWord account. If you already use Believers
          Training, use the same email and password.
        </p>
        <LoginForm
          next="/ministers"
          signupHref="/ministers/signup"
          signupLabel="Request minister access"
        />
      </section>
    </div>
  );
}

import Link from "next/link";
import { PAGE_MAIN, PAGE_SHELL } from "@/lib/page-layout";
import { homeTextLink, marketingBody, marketingPageTitle } from "@/lib/homepage-ui";

export default function PrivacyPage() {
  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <main className={`${PAGE_MAIN} max-w-2xl`}>
        <Link href="/" className={`inline-flex items-center gap-2 ${homeTextLink}`}>
          ← Back home
        </Link>
        <h1 className={`mt-8 ${marketingPageTitle}`}>Privacy</h1>
        <p className={`mt-5 ${marketingBody}`}>
          We&apos;re collecting a short waitlist so we know who to reach out to when WalkIn
          Locals launches in Dublin. When you join, we store your name, email address, phone
          number, and whether you&apos;re interested as a Host or a Guest.
        </p>
        <p className={`mt-5 ${marketingBody}`}>
          We use this only to contact you about the launch and to understand early interest in
          the platform. We don&apos;t sell or share this information with third parties, and you
          can ask us to remove your details at any time by contacting us below.
        </p>
        <p className={`mt-5 ${marketingBody}`}>
          Full Terms of Service will apply once the platform is live and real connections between
          Guests and Hosts begin.
        </p>
      </main>
    </div>
  );
}

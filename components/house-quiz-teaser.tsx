import Link from "next/link";
import { CREAM } from "@/lib/brand";
import {
  homeBody,
  homeContainer,
  homeDisplayTitle,
  homePrimaryButton,
  homeSectionBorder,
  homeSectionY,
} from "@/lib/homepage-ui";

export default function HouseQuizTeaser() {
  return (
    <section className={`${homeSectionBorder} ${homeSectionY}`} style={{ backgroundColor: CREAM }}>
      <div className={homeContainer}>
        <h2 className={homeDisplayTitle}>Which Dublin house are you?</h2>
        <p className={`mt-4 max-w-2xl ${homeBody}`}>
          Ten quick questions, let&apos;s see what matches your style.
        </p>
        <Link href="/quiz" className={`mt-8 ${homePrimaryButton}`}>
          Take the quiz
        </Link>
      </div>
    </section>
  );
}

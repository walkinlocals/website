import Link from "next/link";
import { CREAM } from "@/lib/brand";
import { homeImage } from "@/lib/home-images";
import {
  homeBody,
  homeContainer,
  homeDisplayTitle,
  homeEyebrow,
  homePrimaryButton,
  homeSectionBorder,
  homeSectionY,
} from "@/lib/homepage-ui";

export default function HouseQuizTeaser() {
  return (
    <section className={`${homeSectionBorder} ${homeSectionY}`} style={{ backgroundColor: CREAM }}>
      <div className={homeContainer}>
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <p className={homeEyebrow}>Dublin homes</p>
            <h2 className={`mt-3 ${homeDisplayTitle} lg:text-[2rem]`}>
              Which Dublin house are you?
            </h2>
            <p className={`mt-4 ${homeBody}`}>
              Ten quick questions on architecture, mood, and neighbourhood — then browse hosts that match your style.
            </p>
            <Link href="/quiz" className={`mt-8 ${homePrimaryButton}`}>
              Take the house quiz
            </Link>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="overflow-hidden rounded-xl">
                <img
                  src={homeImage("quiz", "quiz1.jpeg")}
                  alt=""
                  className="aspect-[4/5] h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="overflow-hidden rounded-xl">
                <img
                  src={homeImage("quiz", "quiz2.jpeg")}
                  alt=""
                  className="aspect-[4/5] h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

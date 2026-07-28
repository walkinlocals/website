import DoorHero from "@/components/door-hero";
import HomeClosingWaitlist from "@/components/home-closing-waitlist";
import HomeDiscoverySections from "@/components/home-discovery-sections";
import HouseQuizTeaser from "@/components/house-quiz-teaser";
import { PAGE_SHELL } from "@/lib/page-layout";

export default function HomePage() {
  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-900`}>
      <DoorHero doorHref="#waitlist" showComingSoon waitlistDoor />

      <HomeDiscoverySections />

      <HouseQuizTeaser />

      <HomeClosingWaitlist />
    </div>
  );
}

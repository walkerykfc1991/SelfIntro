import { Career } from "@/components/career";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { HistoryBanner } from "@/components/history-banner";
import { Skills } from "@/components/skills";
import { Summary } from "@/components/summary";

export default function Page() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Summary />
        <HistoryBanner />
        <Career />
        <Skills />
      </main>
      <Footer />
    </>
  );
}

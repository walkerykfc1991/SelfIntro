import { Career } from "@/components/career";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Skills } from "@/components/skills";
import { Summary } from "@/components/summary";

export default function Page() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Summary />
        <Career />
        <Skills />
      </main>
      <Footer />
    </>
  );
}

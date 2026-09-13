import Nav from "@/components/site/Nav";
import Hero from "@/components/site/Hero";
import TryAgent from "@/components/site/TryAgent";
import HowItWorks from "@/components/site/HowItWorks";
import Reliability from "@/components/site/Reliability";
import Integrations from "@/components/site/Integrations";
import Testing from "@/components/site/Testing";
import Architecture from "@/components/site/Architecture";
import Team from "@/components/site/Team";
import Story from "@/components/site/Story";
import FinalCTA from "@/components/site/FinalCTA";
import Footer from "@/components/site/Footer";

export default function Landing() {
  return (
    <main className="relative bg-[#050506] text-white min-h-screen" data-testid="landing-page">
      <Nav />
      <Hero />
      <TryAgent />
      <HowItWorks />
      <Reliability />
      <Integrations />
      <Testing />
      <Architecture />
      <Story />
      <Team />
      <FinalCTA />
      <Footer />
    </main>
  );
}

import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ProblemRecognition from "@/components/ProblemRecognition";
import HowItWorks from "@/components/HowItWorks";
import WhatYouGet from "@/components/WhatYouGet";
import UntukPerusahaan from "@/components/UntukPerusahaan";
import Faq from "@/components/Faq";
import ClosingCta from "@/components/ClosingCta";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <ProblemRecognition />
        <HowItWorks />
        <WhatYouGet />
        <UntukPerusahaan />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}

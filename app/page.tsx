import Nav from "@/components/marketing/Nav";
import Hero from "@/components/marketing/Hero";
import ProblemRecognition from "@/components/marketing/ProblemRecognition";
import HowItWorks from "@/components/marketing/HowItWorks";
import WhatYouGet from "@/components/marketing/WhatYouGet";
import Faq from "@/components/marketing/Faq";
import ClosingCta from "@/components/marketing/ClosingCta";
import Footer from "@/components/marketing/Footer";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/app");
  }

  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <ProblemRecognition />
        <HowItWorks />
        <WhatYouGet />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}

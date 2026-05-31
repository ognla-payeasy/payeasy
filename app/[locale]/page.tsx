"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { PayEasyHero } from "@/components/ui/payeasy-hero";
import { PayEasyLogo } from "@/components/ui/payeasy-logo";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Stellar from "@/components/landing/Stellar";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function LocalePage() {
  const t = useTranslations();
  const router = useRouter();

  return (
    <main id="main-content" aria-label="Landing Page">
      <PayEasyHero
        logo={<PayEasyLogo size={34} />}
        navigation={[
          { label: t("nav.features"), href: "#features" },
          { label: t("nav.howItWorks"), href: "#how-it-works" },
          { label: t("nav.stellar"), href: "#stellar" },
        ]}
        ctaButton={{
          label: t("nav.connectWallet"),
          onClick: () => router.push("/connect"),
        }}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        primaryAction={{
          label: t("hero.getStarted"),
          onClick: () => router.push("/connect"),
        }}
        secondaryAction={{
          label: t("hero.viewOnGithub"),
          onClick: () =>
            window.open("https://github.com/Ogstevyn/payeasy", "_blank"),
        }}
        disclaimer={t("hero.disclaimer")}
        socialProof={{
          avatars: [
            "https://i.pravatar.cc/150?img=11",
            "https://i.pravatar.cc/150?img=12",
            "https://i.pravatar.cc/150?img=13",
            "https://i.pravatar.cc/150?img=14",
          ],
          text: t("hero.socialProof"),
        }}
        stats={[
          { value: "~$0.00001", label: t("hero.stats.transactionFee") },
          { value: "~5 sec", label: t("hero.stats.settlementTime") },
          { value: "100%", label: t("hero.stats.transparency") },
        ]}
        programs={[
          {
            image:
              "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=500&fit=crop",
            category: t("hero.programs.findRoommates"),
            title: t("hero.programs.findRoommatesDesc"),
          },
          {
            image:
              "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=500&fit=crop",
            category: t("hero.programs.smartEscrow"),
            title: t("hero.programs.smartEscrowDesc"),
          },
          {
            image:
              "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=500&fit=crop",
            category: t("hero.programs.instantPayments"),
            title: t("hero.programs.instantPaymentsDesc"),
          },
          {
            image:
              "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=500&fit=crop",
            category: t("hero.programs.moveIn"),
            title: t("hero.programs.moveInDesc"),
          },
          {
            image:
              "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=500&fit=crop",
            category: t("hero.programs.community"),
            title: t("hero.programs.communityDesc"),
          },
        ]}
      />

      <div id="features" />
      <Features />
      <div className="section-divider" />
      <div id="how-it-works" />
      <HowItWorks />
      <div className="section-divider" />
      <div id="stellar" />
      <Stellar />
      <div className="section-divider" />
      <div id="cta" />
      <CTA />
      <Footer />
    </main>
  );
}

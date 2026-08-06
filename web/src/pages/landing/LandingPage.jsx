import { useEffect, useState } from "react";
import { getLandingSections, getLatestRelease } from "@/api/landingApi";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import StatsBarSection from "./components/StatsBarSection";
import FeaturesSection from "./components/FeaturesSection";
import HowItWorksSection from "./components/HowItWorksSection";
import ScreenshotsSection from "./components/ScreenshotsSection";
import ConsultSection from "./components/ConsultSection";
import DownloadSection from "./components/DownloadSection";
import FooterSection from "./components/FooterSection";
import FloatingButtons from "./components/FloatingButtons";

/** Trả về data của section theo key, hoặc {} nếu không tìm thấy */
function getSectionData(sections, key) {
  return sections.find((s) => s.sectionKey === key)?.content || {};
}

export default function LandingPage() {
  const [sections, setSections] = useState([]);
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLandingSections(), getLatestRelease()])
      .then(([secs, rel]) => {
        setSections(secs);
        setRelease(rel);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Trong thời gian loading, hiện skeleton tối giản
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-pink-500/30 border-t-pink-500 animate-spin" />
          <p className="text-white/40 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  const hero       = getSectionData(sections, "hero");
  const statsBar   = getSectionData(sections, "stats_bar");
  const features   = getSectionData(sections, "features");
  const howItWorks = getSectionData(sections, "how_it_works");
  const screenshots= getSectionData(sections, "screenshots");
  const consultCta = getSectionData(sections, "consult_cta");
  const downloadCta= getSectionData(sections, "download_cta");
  const footer     = getSectionData(sections, "footer");

  return (
    <div className="landing-root font-sans antialiased" style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>
      <Navbar />
      <HeroSection data={hero} />
      <StatsBarSection data={statsBar} />
      <FeaturesSection data={features} />
      <HowItWorksSection data={howItWorks} />
      <ScreenshotsSection data={screenshots} />
      <ConsultSection data={consultCta} />
      <DownloadSection data={downloadCta} />
      <FooterSection data={footer} />
      <FloatingButtons
        apkUrl={release?.apkUrl || null}
        zaloLink={footer?.zaloLink || null}
      />
    </div>
  );
}

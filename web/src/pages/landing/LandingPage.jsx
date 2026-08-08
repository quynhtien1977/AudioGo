import { useEffect, useState } from "react";
import { getLandingSections, getLatestRelease } from "@/api/landingApi";
import { ThemeProvider } from "@/context/ThemeContext";
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

/**
 * Trả về content của section nếu isActive = true, ngược lại null.
 * Cho phép ẩn từng section từ CMS admin.
 */
function getSectionData(sections, key) {
  const sec = sections.find((s) => s.sectionKey === key);
  if (!sec) return null;
  if (sec.isActive === false) return null;   // respect toggle
  return sec.content || {};
}

export default function LandingPage() {
  const [sections, setSections] = useState([]);
  const [release, setRelease]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getLandingSections(), getLatestRelease()])
      .then(([secs, rel]) => {
        setSections(secs);
        setRelease(rel);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lp-bg, #0D0D1A)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-pink-500/30 border-t-pink-500 animate-spin" />
          <p className="text-white/40 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  const hero        = getSectionData(sections, "hero");
  const statsBar    = getSectionData(sections, "stats_bar");
  const features    = getSectionData(sections, "features");
  const howItWorks  = getSectionData(sections, "how_it_works");
  const screenshots = getSectionData(sections, "screenshots");
  const consultCta  = getSectionData(sections, "consult_cta");
  const downloadCta = getSectionData(sections, "download_cta");
  const footer      = getSectionData(sections, "footer");

  // footer data cần cho FloatingButtons dù footer có ẩn hay không
  const footerRaw = sections.find((s) => s.sectionKey === "footer")?.content || {};

  return (
    <ThemeProvider>
      <div className="landing-root font-sans antialiased" style={{ fontFamily: "'Sora', system-ui, sans-serif", background: "var(--lp-bg)" }}>
        <Navbar />

        {/* Hero luôn hiển thị nếu active, fallback graceful nếu null */}
        {hero !== null
          ? <HeroSection data={hero} />
          : (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lp-bg)" }}>
              <p style={{ color: "var(--lp-text-faint)" }} className="text-sm">Hero section đang ẩn</p>
            </div>
          )
        }

        {statsBar    && <StatsBarSection   data={statsBar}    />}
        {features    && <FeaturesSection   data={features}    />}
        {howItWorks  && <HowItWorksSection data={howItWorks}  />}
        {screenshots && <ScreenshotsSection data={screenshots} />}
        {consultCta  && <ConsultSection    data={consultCta}  />}
        {downloadCta && <DownloadSection   data={downloadCta} />}
        {footer      && <FooterSection     data={footer}      />}

        <FloatingButtons
          apkUrl={release?.apkUrl || null}
          zaloLink={footerRaw?.zaloLink || null}
          facebookLink={footerRaw?.facebookLink || null}
          phone={footerRaw?.phone || null}
          email={footerRaw?.email || null}
        />
      </div>
    </ThemeProvider>
  );
}

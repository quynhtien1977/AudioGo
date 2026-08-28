import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { getLandingSections, getLatestRelease } from "@/api/landingApi";
import { ThemeProvider } from "@/context/ThemeContext";

// Eager load above-the-fold components for instant FCP & LCP (< 1.5s)
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";

// Lazy load below-the-fold components to reduce initial JS payload to ~35KB
const StatsBarSection = lazy(() => import("./components/StatsBarSection"));
const FeaturesSection = lazy(() => import("./components/FeaturesSection"));
const HowItWorksSection = lazy(() => import("./components/HowItWorksSection"));
const ScreenshotsSection = lazy(() => import("./components/ScreenshotsSection"));
const ConsultSection = lazy(() => import("./components/ConsultSection"));
const DownloadSection = lazy(() => import("./components/DownloadSection"));
const FooterSection = lazy(() => import("./components/FooterSection"));
const FloatingButtons = lazy(() => import("./components/FloatingButtons"));

/**
 * Trả về content của section nếu isActive = true, ngược lại null.
 */
function getSectionData(sections, key) {
  const sec = sections.find((s) => s.sectionKey === key);
  if (!sec) return null;
  if (sec.isActive === false) return null;
  return sec.content || {};
}

const DEFAULT_HERO = {
  badge: "Thuyết minh du lịch bằng âm thanh",
  heading1: "Khám Phá Phố Ẩm Thực",
  heading2: "Qua Từng Câu Chuyện",
  description: "Ứng dụng thuyết minh tự động theo vị trí cho Phố Ẩm Thực Vĩnh Khánh Q4.",
  cta1Text: "Tải App Android",
  cta1Link: "#download",
  cta2Text: "Xem cách hoạt động",
  cta2Link: "#how-it-works",
  backgroundImages: [{ url: "/asset/loginImg.webp", alt: "Phố Ẩm Thực Vĩnh Khánh Q4 AudioGo" }],
  stats: [
    { icon: "MapPin", value: "30+", label: "Điểm thuyết minh" },
    { icon: "Headphones", value: "100%", label: "Tự động kích hoạt" },
    { icon: "Globe", value: "7", label: "Ngôn ngữ" },
  ]
};

export default function LandingPage() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("lp_lang") || "vi";
  });

  // Khởi tạo sections từ cache nếu có để paint ngay FCP/LCP < 1.0s
  const [sections, setSections] = useState(() => {
    try {
      const cached = localStorage.getItem(`lp_sections_${lang}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [release, setRelease] = useState(() => {
    try {
      const cached = localStorage.getItem("lp_release");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const fetchSections = useCallback((targetLang) => {
    getLandingSections(targetLang)
      .then((secs) => {
        if (Array.isArray(secs) && secs.length > 0) {
          setSections(secs);
          try {
            localStorage.setItem(`lp_sections_${targetLang}`, JSON.stringify(secs));
          } catch {
            // Ignore quota errors
          }
        }
      })
      .catch(console.error);
  }, []);

  // Load release chỉ 1 lần
  useEffect(() => {
    getLatestRelease()
      .then((rel) => {
        if (rel) {
          setRelease(rel);
          try {
            localStorage.setItem("lp_release", JSON.stringify(rel));
          } catch {
            // Ignore quota errors
          }
        }
      })
      .catch(() => {});
  }, []);

  // Re-fetch sections khi đổi ngôn ngữ
  useEffect(() => {
    fetchSections(lang);
  }, [lang, fetchSections]);

  const handleLangChange = (newLang) => {
    localStorage.setItem("lp_lang", newLang);
    setLang(newLang);
    try {
      const cached = localStorage.getItem(`lp_sections_${newLang}`);
      if (cached) {
        setSections(JSON.parse(cached));
      }
    } catch {
      // Fallback
    }
  };

  const hero        = getSectionData(sections, "hero") || (sections.length === 0 ? DEFAULT_HERO : null);
  const statsBar    = getSectionData(sections, "stats_bar");
  const features    = getSectionData(sections, "features");
  const howItWorks  = getSectionData(sections, "how_it_works");
  const screenshots = getSectionData(sections, "screenshots");
  const consultCta  = getSectionData(sections, "consult_cta");
  const downloadCta = getSectionData(sections, "download_cta");
  const footer      = getSectionData(sections, "footer");
  const navbarStatic= getSectionData(sections, "navbar_static") || {};

  // footer data cần cho FloatingButtons dù footer có ẩn hay không
  const footerRaw = sections.find((s) => s.sectionKey === "footer")?.content || {};

  return (
    <ThemeProvider>
      <div className="landing-root font-sans antialiased" style={{ fontFamily: "'Sora', system-ui, sans-serif", background: "var(--lp-bg)" }}>
        <Navbar lang={lang} onLangChange={handleLangChange} staticData={navbarStatic} />

        {/* Hero luôn hiển thị tức thì */}
        {hero !== null ? (
          <HeroSection data={hero} />
        ) : (
          <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lp-bg)" }}>
            <p style={{ color: "var(--lp-text-faint)" }} className="text-sm">Hero section đang ẩn</p>
          </div>
        )}

        {/* Below-the-fold sections are lazy loaded */}
        <Suspense fallback={null}>
          {statsBar    && <StatsBarSection   data={statsBar}    />}
          {features    && <FeaturesSection   data={features}    />}
          {howItWorks  && <HowItWorksSection data={howItWorks}  />}
          {screenshots && <ScreenshotsSection data={screenshots} />}
          {consultCta  && <ConsultSection    data={consultCta}  />}
          {downloadCta && <DownloadSection   data={downloadCta} />}
          {footer      && <FooterSection     data={footer}      staticData={navbarStatic} />}

          <FloatingButtons
            apkUrl={release?.apkUrl || null}
            zaloLink={footerRaw?.zaloLink || null}
            facebookLink={footerRaw?.facebookLink || null}
            phone={footerRaw?.phone || null}
            email={footerRaw?.email || null}
            staticData={navbarStatic}
          />
        </Suspense>
      </div>
    </ThemeProvider>
  );
}

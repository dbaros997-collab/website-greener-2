import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useLocation, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListNewsItems,
  useListStats,
  useListVideos,
  useListProgrammes,
  useListAdmissionSteps,
  useListGalleryImages,
  useListSiteText,
} from "@workspace/api-client-react";

import schoolLogo from "@assets/school_logo_transparent.png";
import img_computerlab from "@assets/481077779_1149890966830658_5041740680217479426_n_1780399993019.jpg";
import img_library from "@assets/481080206_1149891370163951_6952293395059892096_n_1780400223690.jpg";
import img_assembly1 from "@assets/483102123_1154996392986782_6972322137511794977_n_1780398909145.jpg";
import img_about_group from "@assets/SSEKAMATTE_SIMON_1780946570401.png";
import img_campus_hero from "@assets/IMG_9926_1780652934166.jpg";
import img_footer_watermark from "@assets/IMG_9926_1780730298484.jpg";
import img_admissions_watermark from "@assets/IMG_9926_1780917530721.jpg";
import img_alevel from "@assets/3@_(7)_1780653886082.JPG";
import img_students_group from "@assets/3@_(5)_1781252589025.JPG";
import img_mdd from "@assets/IMG_5939_1780675538368.JPG";
import img_exam from "@assets/505808199_3139672606197826_738541539324222896_n_1780398909147.jpg";
import img_media from "@assets/481302535_1149890503497371_8676145292623403547_n_1780398909148.jpg";
import img_excursion from "@assets/481667540_1150000930152995_4111129775898704329_n_1780398909149.jpg";
import img_waterfilter from "@assets/481698095_1150000593486362_595453668791169278_n_1780398909149.jpg";
import img_sewing from "@assets/481774229_1150000706819684_3856748495753883636_n_1780398909150.jpg";
import img_lab from "@assets/481779877_1149893336830421_4127942201837184591_n_1780398909151.jpg";
import img_uace from "@assets/481820657_1149996483486773_2392940494083029153_n_1780398909151.jpg";
import img_welding from "@assets/481823396_1149998740153214_8410241474044159533_n_1780398909152.jpg";
import img_trophy from "@assets/481896802_1149890086830746_7205278328307673506_n_1780398909152.jpg";
import img_assembly3 from "@assets/481907330_1149892830163805_8613282942842560566_n_1780398909153.jpg";
import img_conference from "@assets/481919937_1149893610163727_7736672364831677932_n_1780398909153.jpg";
import img_campus from "@assets/IMG_20260321_093718_497_1780675601336.jpg";
import img_food from "@assets/481964449_1149999646819790_6834026191577424925_n_1780398909154.jpg";
import img_featured_video from "@assets/featured_video_thumb_1780677204039.png";
import { generateApplicationForm } from "./applicationForm";

const GREEN_DARK  = "#0A4020";
const GREEN_MAIN  = "#1A6B3C";
const GREEN_MID   = "#237A48";
const GREEN_LIGHT = "#E8F5EE";
const WHITE       = "#FFFFFF";
const OFF_WHITE   = "#F5FAF7";
const GOLD        = "#C9A24B";
const GOLD_LIGHT  = "#E6C66E";

const HERO_SLIDES = [
  img_students_group,
  img_campus_hero,
  img_assembly1,
  img_alevel,
];

const HERO_WORDS = ["Vision", "Faith", "Excellence"];

const API = "/api";

interface Resource {
  id: number;
  title: string;
  subject: string;
  category: "past_paper" | "holiday_work" | "application_form";
  level: string;
  term: string | null;
  objectPath: string;
  fileName: string;
  fileSize: number | null;
  contentType: string | null;
  createdAt: string;
}

const formatSize = (bytes: number | null): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function App() {
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const isHome = location === "/";
  const [, vmParams] = useRoute("/about/vision-mission");
  const [, progRoute] = useRoute("/programmes/:slug");
  const [, admRoute] = useRoute("/admissions/:slug");
  const [isUpdates] = useRoute("/updates");
  const [scrolledY, setScrolledY]     = useState(false);
  // The header switches to its "solid" treatment when the user scrolls OR
  // whenever we are on a detail page (so white nav text stays readable over the
  // page's dark hero band instead of a transparent bar over light content).
  const scrolled = scrolledY || !isHome;
  const pendingScroll = useRef<string | null>(null);
  // Remembers the home-page scroll position from just before a detail page was
  // opened, so "Back" (and the browser back button) returns there instead of top.
  const homeScrollY = useRef<number | null>(null);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [openGroup, setOpenGroup]     = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const [lightbox, setLightbox]       = useState<string | null>(null);
  const [videoModal, setVideoModal]   = useState<string | null>(null);
  const [galleryFilter, setGalFilter] = useState("all");
  const [formSent, setFormSent]       = useState(false);
  const [formSending, setFormSending] = useState(false);
  const [formError, setFormError]     = useState(false);
  const [submitFile, setSubmitFile]   = useState<File | null>(null);
  const [submitSending, setSubmitSending] = useState(false);
  const [submitSent, setSubmitSent]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resources, setResources]     = useState<Resource[]>([]);
  const [resLoading, setResLoading]   = useState(true);
  const [heroSlide, setHeroSlide]     = useState(0);

  const lastScrollY = useRef(0);
  const scrollDir = useRef<"down" | "up">("down");

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      scrollDir.current = y >= lastScrollY.current ? "down" : "up";
      lastScrollY.current = y;
      setScrolledY(y > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setHeroSlide(i => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  // Scroll-reveal: fade/slide sections into view every time they enter the
  // viewport, and reset them when they leave so the animation replays on each
  // scroll-down. The .reveal section wrappers are all static in the JSX, so a
  // single observer set up on mount is enough.
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            // Reset so the animation replays next time the section returns.
            // Prime the direction it should slide in FROM: when the user is
            // scrolling down it will re-enter from below; when scrolling up it
            // should re-enter from above.
            entry.target.classList.remove("is-visible");
            entry.target.classList.toggle(
              "reveal-from-top",
              scrollDir.current === "down"
            );
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    document
      .querySelectorAll<HTMLElement>(".reveal")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
    // Re-run when returning to the home page so the freshly-remounted section
    // wrappers get re-observed (otherwise they stay stuck at opacity 0).
  }, [isHome]);

  const loadResources = async () => {
    try {
      const res = await fetch(`${API}/resources`);
      if (!res.ok) throw new Error("Failed to load resources");
      setResources(await res.json());
    } catch {
      setResources([]);
    } finally {
      setResLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  // Close the video modal when the Escape key is pressed.
  useEffect(() => {
    if (videoModal === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVideoModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [videoModal]);

  // Scroll to the top whenever we land on a detail page.
  useEffect(() => {
    if (!isHome) window.scrollTo(0, 0);
  }, [location, isHome]);

  // After navigating back to the home page from a detail page, scroll to the
  // section the user asked for (stashed in pendingScroll before navigating).
  useEffect(() => {
    if (!isHome) return;
    const target = pendingScroll.current;
    const savedY = homeScrollY.current;
    pendingScroll.current = null;
    homeScrollY.current = null;
    if (!target && savedY == null) return;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (target === "__top") window.scrollTo({ top: 0 });
        else if (target) document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
        else if (savedY != null) window.scrollTo(0, savedY);
      }),
    );
  }, [isHome]);

  // Play the selected video via the YouTube IFrame API so we can auto-close the
  // modal the moment playback finishes ("after watching").
  const ytPlayerRef = useRef<{ destroy?: () => void } | null>(null);
  useEffect(() => {
    if (!videoModal) return;
    let cancelled = false;

    const loadApi = (): Promise<void> =>
      new Promise((resolve) => {
        const w = window as unknown as {
          YT?: { Player: unknown };
          onYouTubeIframeAPIReady?: () => void;
        };
        if (w.YT && w.YT.Player) {
          resolve();
          return;
        }
        if (!document.getElementById("youtube-iframe-api")) {
          const tag = document.createElement("script");
          tag.id = "youtube-iframe-api";
          tag.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(tag);
        }
        const prev = w.onYouTubeIframeAPIReady;
        w.onYouTubeIframeAPIReady = () => {
          prev?.();
          resolve();
        };
      });

    loadApi().then(() => {
      if (cancelled) return;
      const YT = (window as unknown as { YT: { Player: new (el: string, opts: unknown) => { destroy?: () => void } } }).YT;
      ytPlayerRef.current = new YT.Player("yt-player-host", {
        width: "100%",
        height: "100%",
        videoId: videoModal,
        playerVars: { autoplay: 1, rel: 0 },
        events: {
          onStateChange: (e: { data: number }) => {
            // 0 === YT.PlayerState.ENDED
            if (e.data === 0) setVideoModal(null);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      ytPlayerRef.current?.destroy?.();
      ytPlayerRef.current = null;
    };
  }, [videoModal]);

  // Live updates: subscribe to the API's Server-Sent Events stream so any change
  // made in the admin dashboard refreshes the public site instantly, without a
  // page reload. The EventSource auto-reconnects if the connection drops.
  useEffect(() => {
    const source = new EventSource(`${API}/events`);
    const onChange = () => {
      queryClient.invalidateQueries();
      loadResources();
    };
    source.addEventListener("content-changed", onChange);
    return () => {
      source.removeEventListener("content-changed", onChange);
      source.close();
    };
  }, [queryClient]);

  const closeMenus = () => {
    setMenuOpen(false);
    setOpenGroup(null);
    setOpenMobileGroup(null);
  };

  const scrollTo = (id: string) => {
    if (id === "__home") return goHome();
    closeMenus();
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      // On a detail page: remember where to land, then return to the home page.
      pendingScroll.current = id;
      navigate("/");
    }
  };

  const goHome = () => {
    closeMenus();
    if (isHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      pendingScroll.current = "__top";
      navigate("/");
    }
  };

  // Open a detail page, remembering where on the home page we were so the user
  // can be returned to that exact spot when they go back.
  const openDetail = (path: string) => {
    closeMenus();
    homeScrollY.current = window.scrollY;
    navigate(path);
  };

  // Return to the home page at the scroll position the user came from (falls
  // back to the top on a direct/deep link where no position was recorded).
  const goBack = () => {
    closeMenus();
    if (homeScrollY.current == null) pendingScroll.current = "__top";
    navigate("/");
  };

  const NAV_GROUPS: { label: string; id?: string; children?: { label: string; id: string; desc: string }[] }[] = [
    { label: "Home", id: "__home" },
    { label: "About", children: [
      { label: "About Us", id: "about", desc: "Our story, Christian foundation & values" },
      { label: "Campus Gallery", id: "campus", desc: "Photos of our 28-acre Gayaza campus" },
    ] },
    { label: "Academics", children: [
      { label: "Programmes", id: "programmes", desc: "O-Level, A-Level & vocational skills" },
      { label: "Student Resources", id: "resources", desc: "Download past papers & holiday work" },
      { label: "Videos", id: "videos", desc: "Watch everyday life at Grace" },
    ] },
    { label: "School Life", children: [
      { label: "Updates", id: "updates", desc: "Notices for parents & guardians" },
    ] },
    { label: "Admissions", id: "admissions" },
    { label: "Contact", id: "contact" },
  ];

  const navGo = (id: string) => (id === "__home" ? goHome() : scrollTo(id));

  const galleryItems = [
    { src: img_computerlab, label: "Computer Lab — ICT Practical Session",  cat: "academics", wide: true },
    { src: img_library,     label: "School Library — Students Reading",      cat: "academics" },
    { src: img_alevel,      label: "A-Level Students — S5 & S6 Class",       cat: "campus", wide: true },
    { src: img_mdd,         label: "Music, Dance & Drama — Stage Performance", cat: "events", wide: true },
    { src: img_welding,     label: "Vocational Skills — Metal Welding",      cat: "vocational", wide: true },
    { src: img_trophy,      label: "Award Ceremony — Excellence Recognised", cat: "achievements", wide: true },
  ];

  const schoolVideos = [
    { thumb: img_featured_video,cat: "Featured", title: "Grace High School — Featured Video", youtubeId: "c6dBmvv4BLQ" },
  ];

  // ===== Dynamic content (DB-backed, with the static content above as a
  // graceful fallback whenever the API is empty or unreachable). =====
  const storageUrl = (objectPath: string) => `${API}/storage${objectPath}`;

  const sfInput: CSSProperties = {
    padding: "11px 14px", border: "1.5px solid rgba(255,255,255,0.18)", borderRadius: 6,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: WHITE,
    background: "rgba(255,255,255,0.06)", outline: "none", width: "100%",
  };

  const newsQ = useListNewsItems();
  const statsQ = useListStats();
  const videosQ = useListVideos();
  const programmesQ = useListProgrammes();
  const admissionsQ = useListAdmissionSteps();
  const galleryQ = useListGalleryImages();
  const siteTextQ = useListSiteText();

  // Editable section copy: look up by key, falling back to the original
  // hard-coded strings whenever the API is empty or unreachable.
  const siteTextMap: Record<string, string> = {};
  for (const b of siteTextQ.data ?? []) siteTextMap[b.key] = b.value;
  const text = (key: string, fallback: string) => siteTextMap[key] ?? fallback;

  const NEWS_FALLBACK = [
    "Admissions Open for 2025/2026 — All Classes S1–S6",
    "UACE 2023 — Katumwa Hannington scores 20 Points — Glory Be to God!",
    "Grace High School featured on Spark TV for Extra-Curricular Excellence",
    "Students represent at National Renewable Energy Conference 2023",
    "New Term III begins 14 July 2025 — All students report",
  ];
  const tickerMessages = newsQ.data?.length
    ? newsQ.data.map((n) => n.message)
    : NEWS_FALLBACK;

  const STATS_FALLBACK = [
    { num: "28", label: "Acre Campus" },
    { num: "S1–S6", label: "All Levels" },
    { num: "UCE", label: "& UACE" },
    { num: "100%", label: "Christian Values" },
    { num: "∞", label: "Opportunities" },
  ];
  const statItems = statsQ.data?.length
    ? statsQ.data.map((s) => ({ num: s.value, label: s.label }))
    : STATS_FALLBACK;

  const PROGRAMMES_FALLBACK = [
    {
      tag: "S1 – S4", title: "Ordinary Level", img: img_students_group,
      desc: "Four years of broad foundational education leading to the Uganda Certificate of Education (UCE), setting students up for A-Level and beyond.",
      subjects: ["Mathematics", "Sciences", "English", "History", "Geography", "CRE", "SST", "Languages"],
    },
    {
      tag: "S5 – S6", title: "Advanced Level", img: img_alevel,
      desc: "Two-year advanced programme leading to the Uganda Advanced Certificate of Education (UACE), preparing students for university entrance.",
      subjects: ["Sciences", "Arts", "Business", "ICT", "Agriculture", "Economics"],
    },
    {
      tag: "Extracurricular", title: "Vocational Skills", img: img_sewing,
      desc: "Practical skills training alongside academics, equipping students with capabilities that create real-world opportunities.",
      subjects: ["Entrepreneurship", "Life Skills", "Sports", "Arts & Crafts", "Leadership", "Welding"],
    },
  ];
  const programmeImg = (title: string) =>
    PROGRAMMES_FALLBACK.find((p) => p.title === title)?.img ?? img_campus_hero;
  const programmeItems = programmesQ.data?.length
    ? programmesQ.data.map((p) => ({
        tag: p.tag, title: p.title, img: programmeImg(p.title),
        desc: p.description, subjects: p.subjects,
      }))
    : PROGRAMMES_FALLBACK;

  const ADMISSIONS_FALLBACK = [
    { step: 1, title: "Contact the School", desc: "Call or email us to express interest and get an admissions form." },
    { step: 2, title: "Visit Our Campus", desc: "Schedule a tour of our 28-acre campus in Gayaza, Wakiso District." },
    { step: 3, title: "Submit Application", desc: "Complete the form with academic records and personal information." },
    { step: 4, title: "Placement Assessment", desc: "Students may sit a brief assessment to identify the right class." },
    { step: 5, title: "Confirm Enrollment", desc: "Receive your admission letter, pay fees, and report on opening day." },
  ];
  const admissionItems = admissionsQ.data?.length
    ? admissionsQ.data.map((a, i) => ({ step: i + 1, title: a.title, desc: a.description }))
    : ADMISSIONS_FALLBACK;

  // ===== Detail-page bodies =====
  // These three blocks used to live inside click-to-open popups. They now power
  // dedicated detail pages (their own URLs) and are reused by the link buttons
  // on the home page. They are plain values/functions in App scope so the
  // pages get the live API/site_text data without duplicating any fetch logic.
  const visionMissionBody = (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ background: GREEN_LIGHT, borderRadius: 10, padding: "20px 24px", borderLeft: `4px solid ${GOLD}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "50%", background: "rgba(201,162,75,0.16)", border: `1px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#9A7A2E" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9A7A2E", margin: 0 }}>Our Vision</p>
        </div>
        <p style={{ fontSize: 15, color: GREEN_DARK, lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>"{text("about_vision", "A centre of excellence that shapes exceptional individuals who will make a defining difference in our world.")}"</p>
      </div>
      <div style={{ background: GREEN_LIGHT, borderRadius: 10, padding: "20px 24px", borderLeft: `4px solid ${GREEN_MAIN}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "50%", background: "rgba(26,107,60,0.12)", border: `1px solid ${GREEN_MAIN}`, display: "flex", alignItems: "center", justifyContent: "center", color: GREEN_MAIN }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: GREEN_MAIN, margin: 0 }}>Our Mission</p>
        </div>
        <p style={{ fontSize: 15, color: GREEN_DARK, lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>"{text("about_mission", "To create unique learners who are socially functional, analytically precise, financially savvy and very creative in all areas of life for the glorification of God.")}"</p>
        <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: "#4A5A50" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            Gayaza-Kasangati, Uganda
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: "#4A5A50" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M5 6h14M5 6v8a7 7 0 0 0 14 0V6" /></svg>
            Christian-Founded
          </span>
        </div>
      </div>
    </div>
  );

  const programmeBody = (p: { tag: string; title: string; desc: string; subjects: string[] }) => (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: GREEN_MAIN, marginBottom: 8 }}>{p.tag}</div>
      <p style={{ fontSize: 15, color: "#5A5A5A", lineHeight: 1.7, marginBottom: 20 }}>{p.desc}</p>
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: GREEN_DARK, marginBottom: 12 }}>Subjects Offered</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {p.subjects.map(s => (
          <span key={s} style={{ fontSize: 13, fontWeight: 500, background: GREEN_LIGHT, color: GREEN_DARK, padding: "6px 14px", borderRadius: 100 }}>{s}</span>
        ))}
      </div>
    </div>
  );

  const admissionSlides: { title: string; subtitle: string; body: React.ReactNode }[] = [
    {
      title: "How to Apply",
      subtitle: "Step-by-step guide to enrolling your child",
      body: (
        <div style={{ display: "grid", gap: 12 }}>
          {admissionItems.map(s => (
            <div key={s.step} style={{
              display: "flex", gap: 16, alignItems: "flex-start", padding: "16px 18px",
              background: "rgba(255,255,255,0.05)", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{
                width: 32, height: 32, flexShrink: 0, background: "#4CAF82", color: GREEN_DARK,
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 14,
              }}>{s.step}</div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: WHITE, marginBottom: 3 }}>{s.title}</h4>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Entry Points",
      subtitle: "Classes you can join and their requirements",
      body: (
        <div className="entry-points-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { tag: "O-Level", cls: "Senior 1 – Senior 4", req: "Direct entry into S1 for candidates who have sat PLE. Transfers into S2–S4 are considered subject to vacancies and a short placement assessment." },
            { tag: "A-Level", cls: "Senior 5 – Senior 6", req: "Open to candidates whose UCE results meet the requirements for their chosen subject combination. S6 transfers considered on available space." },
          ].map(e => (
            <div key={e.tag} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "18px 20px",
            }}>
              <span style={{
                display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", color: GREEN_DARK, background: "#8EEDC0",
                borderRadius: 100, padding: "3px 12px", marginBottom: 10,
              }}>{e.tag}</span>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: WHITE, marginBottom: 6 }}>{e.cls}</h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{e.req}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "What to Bring",
      subtitle: "Documents to carry on admission day",
      body: (
        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "22px 24px", display: "grid", gap: 13,
        }}>
          {[
            "A completed Grace High School application form",
            "Photocopy of the PLE results slip (S1) or UCE results (S5)",
            "Report cards or academic records from the previous school",
            "Two recent passport-size photographs of the student",
            "A copy of the student's birth certificate",
            "A transfer letter from the former school (transfers only)",
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0, marginTop: 1, color: "#8EEDC0" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{r}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Good to Know",
      subtitle: "Helpful tips before you apply",
      body: (
        <div className="entry-points-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { icon: <><path d="M3 9.5 12 4l9 5.5" /><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" /><path d="M9 20v-6h6v6" /></>, title: "Boarding & Day", desc: "We offer both boarding and day options, with safe, well-supervised dormitories on our 28-acre campus." },
            { icon: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>, title: "Fees & Payment", desc: "A detailed fees structure is provided on application. School fees are payable per term before reporting." },
          ].map((g, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "18px 20px",
            }}>
              <span style={{ display: "block", color: "#8EEDC0", marginBottom: 10 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{g.icon}</svg>
              </span>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: WHITE, marginBottom: 5 }}>{g.title}</h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>{g.desc}</p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  // Parent noticeboard items (static). Shown as a short teaser on the home page;
  // the full list lives on the dedicated /updates page so the home stays short.
  const updateItems = [
    { date: "02 Jun 2026", cat: "Programmes", tag: "PROGRAMME", title: "Term II Co-Curricular Programme Released", body: "The full schedule for Music, Dance & Drama, sports, and the vocational skills exhibition is now available. Parents are encouraged to support their children's participation." },
    { date: "28 May 2026", cat: "Fees", tag: "FEES", title: "Term II Fees Payment Reminder", body: "Kindly clear all outstanding school fees before the mid-term break. Bank details and payment plans are available at the bursar's office." },
    { date: "20 May 2026", cat: "Academics", tag: "ACADEMICS", title: "Mid-Term Examinations Timetable", body: "Mid-term assessments for all classes (S1–S6) will run during the third week. The detailed timetable has been shared with class teachers." },
    { date: "12 May 2026", cat: "Events", tag: "EVENT", title: "Parents' Visitation Day — Save the Date", body: "Our next Visitation Day is scheduled for the first Saturday of next month. Come meet your child's teachers and tour the campus." },
    { date: "05 May 2026", cat: "General", tag: "GENERAL", title: "New Library Resources & Science Equipment", body: "Thanks to your continued support, the school has acquired new textbooks and laboratory equipment to enrich our students' learning experience." },
  ];

  const updateCard = (u: { date: string; cat: string; tag: string; title: string; body: string }, i: number) => (
    <div key={i} style={{
      background: WHITE, borderRadius: 12, padding: "22px 26px",
      border: "1px solid rgba(0,0,0,0.06)", borderLeft: `4px solid ${GREEN_MAIN}`,
      display: "flex", gap: 20, alignItems: "flex-start",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(10,64,32,0.1)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ flexShrink: 0, textAlign: "center", minWidth: 64 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: GREEN_MAIN }}>{u.date.split(" ")[1]}</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.7rem", fontWeight: 700, color: GREEN_DARK, lineHeight: 1 }}>{u.date.split(" ")[0]}</div>
        <div style={{ fontSize: 11, color: "#7A8A80" }}>{u.date.split(" ")[2]}</div>
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: GREEN_LIGHT, color: GREEN_DARK, padding: "3px 10px", borderRadius: 100 }}>{u.tag}</span>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: GREEN_DARK, margin: "10px 0 6px" }}>{u.title}</h3>
        <p style={{ fontSize: 14, color: "#5A5A5A", lineHeight: 1.6 }}>{u.body}</p>
      </div>
    </div>
  );

  // Full noticeboard body for the dedicated /updates page.
  const updatesBody = (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {updateItems.map((u, i) => updateCard(u, i))}
      </div>
      <div style={{ marginTop: 32, background: GREEN_DARK, borderRadius: 12, padding: "24px 28px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: WHITE, marginBottom: 4 }}>Never miss an update</h4>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>For direct enquiries, contact the school office and we'll keep you informed.</p>
        </div>
        <button onClick={() => scrollTo("contact")} style={{
          background: "#4CAF82", color: GREEN_DARK, padding: "12px 28px",
          borderRadius: 6, fontWeight: 600, border: "none", cursor: "pointer", fontSize: 15,
        }}>Contact the Office</button>
      </div>
    </>
  );

  // ===== Detail-page layout =====
  // Shared chrome for the detail pages: a GREEN_DARK hero band with a
  // clickable breadcrumb + title + optional subtitle, then a content area
  // (light by default, dark for the admissions pages whose bodies are styled
  // for a dark background). Called as a function (not <Component>) so it shares
  // App state without remounting.
  const detailLayout = (opts: {
    sectionLabel: string;
    sectionId: string;
    title: string;
    subtitle?: string;
    dark?: boolean;
    children: React.ReactNode;
  }) => {
    const crumbBtn: React.CSSProperties = {
      background: "none", border: "none", cursor: "pointer", padding: 0,
      color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
      transition: "color 0.2s",
    };
    return (
      <main style={{ background: opts.dark ? GREEN_DARK : OFF_WHITE, minHeight: "70vh" }}>
        {/* Hero band — padding-top clears the fixed logo/nav overhang */}
        <div style={{ position: "relative", background: GREEN_DARK, padding: "170px 5% 56px", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 0%, rgba(26,107,60,0.5), transparent 60%)" }} />
          <div style={{ position: "relative", maxWidth: 880, margin: "0 auto" }}>
            <nav style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <button onClick={goHome} style={crumbBtn}
                onMouseEnter={e => (e.currentTarget.style.color = GOLD_LIGHT)} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}>Home</button>
              <span style={{ color: "rgba(255,255,255,0.35)" }}>/</span>
              <button onClick={() => scrollTo(opts.sectionId)} style={crumbBtn}
                onMouseEnter={e => (e.currentTarget.style.color = GOLD_LIGHT)} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}>{opts.sectionLabel}</button>
              <span style={{ color: "rgba(255,255,255,0.35)" }}>/</span>
              <span style={{ color: "#8EEDC0", fontSize: 13 }}>{opts.title}</span>
            </nav>
            <div style={{ width: 44, height: 3, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, borderRadius: 2, marginBottom: 18 }} />
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 3rem)", color: WHITE, lineHeight: 1.15, margin: 0 }}>{opts.title}</h1>
            {opts.subtitle && <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginTop: 14, maxWidth: 620 }}>{opts.subtitle}</p>}
          </div>
        </div>
        {/* Content area */}
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "44px 5% 64px" }}>
          {opts.children}
          <div style={{ marginTop: 40 }}>
            <button onClick={goBack} style={{
              display: "inline-flex", alignItems: "center", gap: 9, cursor: "pointer",
              background: opts.dark ? "rgba(255,255,255,0.08)" : GREEN_LIGHT,
              color: opts.dark ? WHITE : GREEN_DARK,
              border: opts.dark ? "1px solid rgba(255,255,255,0.18)" : `1px solid ${GREEN_MAIN}33`,
              borderRadius: 100, padding: "11px 22px", fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
              Back
            </button>
          </div>
        </div>
      </main>
    );
  };

  const notFoundPage = (sectionLabel: string, sectionId: string) =>
    detailLayout({
      sectionLabel, sectionId, title: "Page Not Found",
      subtitle: "We couldn't find what you were looking for.",
      children: (
        <p style={{ fontSize: 15, color: "#5A5A5A", lineHeight: 1.7 }}>
          The page you requested doesn't exist or may have moved. Use the link below to return to the home page.
        </p>
      ),
    });

  // Pick the detail page body based on the active route. Programme/admission
  // lookups slugify the live data so DB-driven items resolve too.
  const renderDetailPage = () => {
    if (vmParams) {
      return detailLayout({
        sectionLabel: "About", sectionId: "about",
        title: "Our Vision & Mission",
        subtitle: "What we strive for and the promise behind a Grace education.",
        children: visionMissionBody,
      });
    }
    if (progRoute) {
      const prog = programmeItems.find(p => slugify(p.title) === progRoute.slug);
      if (!prog) return notFoundPage("Programmes", "programmes");
      return detailLayout({
        sectionLabel: "Programmes", sectionId: "programmes",
        title: prog.title,
        children: programmeBody(prog),
      });
    }
    if (admRoute) {
      const slide = admissionSlides.find(s => slugify(s.title) === admRoute.slug);
      if (!slide) return notFoundPage("Admissions", "admissions");
      return detailLayout({
        sectionLabel: "Admissions", sectionId: "admissions",
        title: slide.title, subtitle: slide.subtitle, dark: true,
        children: slide.body,
      });
    }
    if (isUpdates) {
      return detailLayout({
        sectionLabel: "Updates", sectionId: "updates",
        title: "School Updates & Announcements",
        subtitle: "Our official noticeboard for parents and guardians — programmes, fees, term dates, and important announcements.",
        children: updatesBody,
      });
    }
    return notFoundPage("Home", "__home");
  };

  const videoThumb = (youtubeId: string) =>
    schoolVideos.find((v) => v.youtubeId === youtubeId)?.thumb ??
    `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  const videoItems = videosQ.data?.length
    ? videosQ.data.map((v) => ({
        thumb: videoThumb(v.youtubeId), cat: v.category, title: v.title, youtubeId: v.youtubeId,
      }))
    : schoolVideos;

  const galleryViewItems = galleryQ.data?.length
    ? galleryQ.data.map((g) => ({
        src: storageUrl(g.objectPath), label: g.caption, cat: g.category, wide: g.wide,
      }))
    : galleryItems;
  const filtered = galleryFilter === "all"
    ? galleryViewItems
    : galleryViewItems.filter((g) => g.cat === galleryFilter);
  const catLabel = (cat: string) =>
    ({ campus: "Campus", academics: "Academics", vocational: "Vocational", events: "Events", achievements: "Achievements" } as Record<string, string>)[cat] ?? cat;

  const navBg = scrolled
    ? `rgba(10,64,32,0.45)`
    : `transparent`;
  const navText = WHITE;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: OFF_WHITE, color: "#1A1A1A", overflowX: "hidden" }}>

      {/* ===== LIGHTBOX ===== */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Full size" />
        </div>
      )}

      {/* ===== VIDEO MODAL ===== */}
      {videoModal !== null && (
        <div className="lightbox-overlay" onClick={() => setVideoModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "min(900px, 92vw)", maxWidth: 900 }}>
            <button
              onClick={() => setVideoModal(null)}
              aria-label="Close video"
              style={{
                position: "absolute", top: -48, right: 0, zIndex: 2,
                width: 40, height: 40, borderRadius: "50%", border: "none", cursor: "pointer",
                background: "rgba(255,255,255,0.15)", color: WHITE, fontSize: 20, lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            >
              ✕
            </button>
            {videoModal ? (
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 12, overflow: "hidden", background: "#000" }}>
                <div id="yt-player-host" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
              </div>
            ) : (
              <div style={{ background: GREEN_DARK, borderRadius: 12, padding: "48px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🎬</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: WHITE, marginBottom: 8 }}>Video Coming Soon</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>This video will be available shortly. Check back soon to watch it here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== UTILITY BAR ===== */}
      <div className={scrolled ? "nav-drop" : undefined} style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1001,
        background: scrolled ? "rgba(6,44,21,0.35)" : "transparent", height: 36, padding: "0 5%",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
        transition: "background 0.3s",
      }}>
        <div className="utility-links" style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {[
            { id: "resources", label: "Student Resources" },
            { id: "campus", label: "Campus Life" },
            { id: "contact", label: "Contact" },
          ].map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500, letterSpacing: "0.02em",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = GOLD_LIGHT)}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            >{l.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span className="utility-links" style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>✉ gracehighschoolgayaza@gmail.com</span>
          <a href="/admin/" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: GOLD_LIGHT, fontSize: 12, fontWeight: 600, textDecoration: "none",
            letterSpacing: "0.04em", textTransform: "uppercase",
          }}>Staff Login →</a>
        </div>
      </div>

      {/* ===== NAV ===== */}
      <nav className={scrolled ? "nav-drop" : undefined} style={{
        position: "fixed", top: 36, left: 0, right: 0, zIndex: 1000,
        background: navBg, backdropFilter: scrolled ? "blur(10px)" : "none",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `0 5%`, height: scrolled ? "62px" : "74px",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
        boxShadow: scrolled ? "0 8px 30px rgba(10,64,32,0.18)" : "none",
        transition: "height 0.3s, background 0.3s, box-shadow 0.3s",
      }}>
        <a href="#" style={{ display: "flex", alignItems: "center", textDecoration: "none", alignSelf: "flex-start", marginTop: scrolled ? 6 : 8 }}>
          <img
            src={schoolLogo}
            alt="Grace High School Logo"
            style={{
              height: scrolled ? 120 : 164,
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
              transition: "height 0.3s",
              filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.45))",
            }}
          />
        </a>

        {/* Desktop nav */}
        <ul style={{ gap: "1.4rem", listStyle: "none", alignItems: "center" }}
            className="hidden md:flex">
          {NAV_GROUPS.map(group => (
            <li key={group.label} style={{ position: "relative" }}
              onMouseEnter={() => group.children && setOpenGroup(group.label)}
              onMouseLeave={() => group.children && setOpenGroup(null)}
            >
              <button onClick={() => !group.children && group.id && navGo(group.id)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: openGroup === group.label ? GOLD : navText, fontSize: 14, fontWeight: 600,
                letterSpacing: "0.01em", transition: "color 0.2s",
                textShadow: "0 1px 6px rgba(0,0,0,0.35)",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.color = openGroup === group.label ? GOLD : navText)}
              >
                {group.label}
                {group.children && (
                  <span style={{ fontSize: 9, transition: "transform 0.2s", transform: openGroup === group.label ? "rotate(180deg)" : "none", display: "inline-block" }}>▼</span>
                )}
              </button>
              {group.children && openGroup === group.label && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, paddingTop: 12,
                }}>
                  <div style={{
                    background: WHITE, borderRadius: 10, minWidth: 290,
                    boxShadow: "0 12px 32px rgba(10,64,32,0.18)",
                    border: `1px solid ${GREEN_LIGHT}`, overflow: "hidden",
                    display: "flex", flexDirection: "column", padding: "8px",
                  }}>
                    {group.children.map(child => (
                      <button key={child.id} onClick={() => scrollTo(child.id)} style={{
                        background: "none", border: "none", cursor: "pointer", borderRadius: 8,
                        textAlign: "left", padding: "10px 12px", transition: "background 0.15s",
                        display: "block",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = GREEN_LIGHT; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                      >
                        <span style={{ display: "block", color: GREEN_DARK, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{child.label}</span>
                        <span style={{ display: "block", color: "#6A7A70", fontSize: 12, lineHeight: 1.45 }}>{child.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
          <li>
            <button onClick={() => scrollTo("admissions")} style={{
              background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`, color: "#3A2D08",
              padding: "9px 22px", borderRadius: 6, fontWeight: 700,
              border: "none", cursor: "pointer", fontSize: 14, letterSpacing: "0.02em",
              boxShadow: "0 6px 18px rgba(201,162,75,0.3)",
              transition: "transform 0.15s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 26px rgba(201,162,75,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(201,162,75,0.3)"; }}
            >Apply Now</button>
          </li>
        </ul>

        {/* Hamburger */}
        <button
          className="flex md:hidden flex-col gap-1.5 p-1.5 bg-transparent border-0 cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {[0,1,2].map(i => (
            <span key={i} style={{ width: 24, height: 2, background: navText, borderRadius: 2, display: "block", transition: "background 0.3s" }} />
          ))}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: "fixed", top: scrolled ? 98 : 110, left: 0, right: 0, zIndex: 999,
          background: GREEN_DARK, padding: "20px 5% 28px",
          borderBottom: `2px solid #4CAF82`,
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <button
                onClick={() => group.children ? setOpenMobileGroup(openMobileGroup === group.label ? null : group.label) : (group.id && navGo(group.id))}
                style={{
                  width: "100%", background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: 500,
                  padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.07)",
                  textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                {group.label}
                {group.children && (
                  <span style={{ fontSize: 10, transition: "transform 0.2s", transform: openMobileGroup === group.label ? "rotate(180deg)" : "none" }}>▼</span>
                )}
              </button>
              {group.children && openMobileGroup === group.label && (
                <div style={{ display: "flex", flexDirection: "column", paddingLeft: 14 }}>
                  {group.children.map(child => (
                    <button key={child.id} onClick={() => scrollTo(child.id)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", textAlign: "left",
                    }}>
                      <span style={{ display: "block", color: "#8EEDC0", fontSize: 14.5, fontWeight: 600 }}>{child.label}</span>
                      <span style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2, lineHeight: 1.45 }}>{child.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button onClick={() => scrollTo("admissions")} style={{
            background: "#4CAF82", color: GREEN_DARK, border: "none",
            padding: 14, borderRadius: 6, fontWeight: 700, marginTop: 12, cursor: "pointer",
          }}>Apply Now</button>
        </div>
      )}

      {/* ===== HOME PAGE (all sections below render only on "/") ===== */}
      {isHome && (<>
      {/* ===== HERO ===== */}
      <section style={{
        minHeight: "88vh", background: GREEN_DARK,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden", padding: "120px 5% 64px",
      }}>
        {/* Background image slideshow — crossfades between campus photos */}
        {HERO_SLIDES.map((src, i) => (
          <div key={i} style={{
            position: "absolute", inset: 0,
            backgroundImage: `url("${src}")`,
            backgroundSize: "cover", backgroundPosition: "center",
            filter: "saturate(1.08) contrast(1.04) brightness(1.03)",
            transform: i === heroSlide ? "scale(1.08)" : "scale(1.0)",
            opacity: i === heroSlide ? 1 : 0,
            transition: "opacity 1.4s ease-in-out, transform 6s ease-out",
          }} />
        ))}
        {/* Cinematic scrim — neutral charcoal so the photo colours stay true */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(180deg, rgba(10,18,14,0.62) 0%, rgba(10,18,14,0.30) 45%, rgba(8,16,12,0.72) 100%)`,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 70% 60% at 50% 44%, rgba(201,162,75,0.14) 0%, transparent 60%),
                        radial-gradient(ellipse 120% 90% at 50% 50%, transparent 38%, rgba(8,16,12,0.5) 100%)`,
        }} />

        <div className="hero-center" style={{
          maxWidth: 880, margin: "0 auto", textAlign: "center",
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          {/* Eyebrow — "Be Part of Our Story" */}
          <div style={{
            fontFamily: "'Playfair Display', serif", fontStyle: "italic",
            fontSize: "clamp(1rem, 2vw, 1.4rem)", color: GOLD_LIGHT,
            marginBottom: 16, letterSpacing: "0.01em",
            textShadow: "0 2px 16px rgba(0,0,0,0.5)",
          }}>Be Part of Our Story</div>

          {/* Rotating headline — "___ to Create the Future." */}
          <h1 style={{
            fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800,
            fontSize: "clamp(2.7rem, 6.6vw, 5.3rem)",
            color: WHITE, lineHeight: 1.02, marginBottom: 26,
            letterSpacing: "-0.02em", textShadow: "0 2px 30px rgba(0,0,0,0.45)",
          }}>
            <span key={heroSlide} className="hero-word" style={{
              display: "inline-block",
              background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD})`,
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>{HERO_WORDS[heroSlide % HERO_WORDS.length]}</span>{" "}
            to Create<br />the Future.
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.8, color: "rgba(255,255,255,0.88)", marginBottom: 36, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
            A Christian-founded mixed secondary school on a 28-acre campus in Gayaza — producing morally upright, academically excellent, Christ-like leaders of tomorrow.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => scrollTo("admissions")} style={{
              background: `linear-gradient(135deg, ${GREEN_MAIN}, ${GREEN_DARK})`, color: WHITE,
              padding: "16px 40px", borderRadius: 6, fontWeight: 700, fontSize: 15,
              border: "1px solid rgba(230,198,110,0.5)", cursor: "pointer", letterSpacing: "0.02em",
              boxShadow: "0 12px 34px rgba(10,64,32,0.45)",
              transition: "box-shadow 0.25s, transform 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 18px 44px rgba(10,64,32,0.6)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 12px 34px rgba(10,64,32,0.45)"; }}
            >Enroll Now</button>

            <button onClick={() => scrollTo("about")} style={{
              background: "rgba(255,255,255,0.06)", color: WHITE,
              border: "1.5px solid rgba(255,255,255,0.45)",
              padding: "16px 34px", borderRadius: 6, fontWeight: 600, fontSize: 15,
              cursor: "pointer", backdropFilter: "blur(6px)",
              transition: "border-color 0.2s, color 0.2s, background 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD_LIGHT; e.currentTarget.style.color = GOLD_LIGHT; e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)"; e.currentTarget.style.color = WHITE; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            >Read Our Story</button>
          </div>
        </div>
      </section>

      {/* ===== TICKER ===== */}
      <div style={{ background: GREEN_MAIN, overflow: "hidden", padding: "9px 0", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-block", animation: "ticker-scroll 35s linear infinite" }}>
          {tickerMessages.map((msg, i) => (
            <span key={i} style={{ fontSize: 13, fontWeight: 500, color: WHITE, padding: "0 48px", letterSpacing: "0.02em" }}>
              📢 {msg}
            </span>
          ))}
        </div>
      </div>

      {/* ===== STATS BAR ===== */}
      <div style={{ background: GREEN_MAIN, padding: "20px 5%", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="stats-grid">
          {statItems.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: WHITE, display: "block" }}>{s.num}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== SERVICE CARDS ===== */}
      <section className="reveal" style={{ background: OFF_WHITE, padding: "56px 5%" }}>
        <div className="service-grid">
          {[
            {
              icon: <><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 2 2 6 2s6-1 6-2v-5" /></>,
              title: "Admissions to All Classes",
              desc: "Now open for S1–S6. Join a disciplined, faith-based community where every learner is guided toward academic effort and character growth.",
              id: "admissions",
            },
            {
              icon: <><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></>,
              title: "Why Choose Grace?",
              desc: "Structured teaching, close supervision and continuous assessment help our students excel and progress with confidence.",
              id: "about",
            },
            {
              icon: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>,
              title: "Academic Results",
              desc: "A consistent record of strong UNEB performance at O-Level and A-Level, with graduates advancing to leading universities.",
              id: "achievements",
            },
            {
              icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
              title: "Student Resources",
              desc: "Download past papers and holiday work, and explore everyday school life through our videos and campus gallery.",
              id: "resources",
            },
          ].map((c, i) => (
            <button key={i} onClick={() => scrollTo(c.id)} style={{
              textAlign: "left", cursor: "pointer", background: WHITE,
              border: "1px solid rgba(10,64,32,0.08)", borderRadius: 14,
              padding: "28px 24px 26px", borderBottom: `4px solid ${GOLD}`,
              boxShadow: "0 10px 30px rgba(10,64,32,0.07)",
              display: "flex", flexDirection: "column", gap: 14,
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 44px rgba(10,64,32,0.16)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(10,64,32,0.07)"; }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${GREEN_MAIN}, ${GREEN_DARK})`, display: "flex", alignItems: "center", justifyContent: "center", color: WHITE, boxShadow: "0 8px 20px rgba(10,64,32,0.25)" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{c.icon}</svg>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.18rem", color: GREEN_DARK, lineHeight: 1.25, margin: 0 }}>{c.title}</h3>
              <p style={{ fontSize: 14, color: "#5A6B60", lineHeight: 1.65, margin: 0 }}>{c.desc}</p>
              <span style={{ marginTop: "auto", fontSize: 13, fontWeight: 700, color: GREEN_MAIN, letterSpacing: "0.02em", display: "inline-flex", alignItems: "center", gap: 6, paddingTop: 4 }}>
                Learn More
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ===== WELCOME ===== */}
      <section id="welcome" className="reveal" style={{ background: OFF_WHITE, padding: "56px 5%" }}>
        <div className="welcome-grid">
          <div className="welcome-media" style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: -10, borderRadius: 18, background: `linear-gradient(135deg, ${GREEN_LIGHT}, rgba(201,162,75,0.18))`, zIndex: 0 }} />
            <img src={img_about_group} alt="The Head Teacher, Grace High School" style={{ position: "relative", zIndex: 1, width: "100%", aspectRatio: "4 / 5", objectFit: "cover", objectPosition: "center 18%", borderRadius: 14, background: `linear-gradient(135deg, ${GREEN_LIGHT}, rgba(201,162,75,0.12))`, boxShadow: "0 20px 50px rgba(10,64,32,0.22)" }} />
            <div style={{ position: "absolute", zIndex: 2, bottom: 16, left: 16, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.94)", borderRadius: 100, padding: "8px 16px 8px 8px", boxShadow: "0 8px 22px rgba(0,0,0,0.18)" }}>
              <img src={schoolLogo} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: GREEN_DARK }}>Grace High School</span>
            </div>
            {/* Years-of-experience badge */}
            <div style={{ position: "absolute", zIndex: 3, top: -18, right: -14, width: 96, height: 96, borderRadius: "50%", background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", boxShadow: "0 12px 28px rgba(201,162,75,0.4)", border: "3px solid #FFFFFF" }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.7rem", fontWeight: 700, color: "#3A2D08", lineHeight: 1 }}>25+</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5A4715", marginTop: 3, lineHeight: 1.2 }}>Years of<br />Experience</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ display: "block", width: 28, height: 2, background: GREEN_MAIN }} />
              Welcome Message
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, lineHeight: 1.2, marginBottom: 18 }}>
              Welcome to Grace High School
            </h2>
            <p style={{ fontSize: 15.5, color: "#5A5A5A", lineHeight: 1.8, marginBottom: 16 }}>
              Thank you for your interest in Grace High School &ndash; Gayaza. Since our founding, we have been dedicated to nurturing young people who are academically excellent, morally upright, and grounded in Christian values.
            </p>
            <p style={{ fontSize: 15.5, color: "#5A5A5A", lineHeight: 1.8, marginBottom: 16 }}>
              On our 28-acre campus near Kasangati, students learn in a safe, supportive environment guided by passionate teachers. We offer both O-Level and A-Level programmes, alongside vocational skills and a vibrant co-curricular life that helps every learner discover their God-given potential.
            </p>
            <p style={{ fontSize: 15.5, color: "#5A5A5A", lineHeight: 1.8, marginBottom: 24 }}>
              We warmly invite you to join the Grace family and partner with us in shaping a bright future for your child.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 18, borderTop: `1px solid ${GREEN_LIGHT}` }}>
              <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "50%", background: `linear-gradient(135deg, ${GREEN_MAIN}, ${GREEN_DARK})`, display: "flex", alignItems: "center", justifyContent: "center", color: WHITE }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></svg>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: GREEN_DARK, margin: 0 }}>The Head Teacher</p>
                <p style={{ fontSize: 13, color: GREEN_MAIN, margin: 0 }}>Grace High School, Gayaza</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about" className="reveal" style={{ background: WHITE, padding: "56px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ display: "block", width: 28, height: 2, background: GREEN_MAIN }} />
              About Us
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, lineHeight: 1.2, marginBottom: 16 }}>
              {text("about_heading", "A School Built on Faith, Vision & Excellence")}
            </h2>
            <p style={{ fontSize: 16, color: "#5A5A5A", lineHeight: 1.7, maxWidth: 560, marginBottom: 28 }}>
              {text("about_body", "Grace High School – Gayaza is a Christian-founded school focused on producing students who are morally upright and Christ-like leaders of tomorrow.")}
            </p>

            {/* Vision & Mission — opens its own dedicated page */}
            <button onClick={() => openDetail("/about/vision-mission")} style={{
              display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 28, cursor: "pointer",
              background: GREEN_LIGHT, border: `1px solid ${GREEN_MAIN}33`, borderRadius: 100,
              padding: "12px 14px 12px 16px", fontFamily: "'DM Sans', sans-serif", transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 26px rgba(10,64,32,0.14)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${GREEN_MAIN}, ${GREEN_DARK})`, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
              </span>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: GREEN_DARK }}>View our Vision &amp; Mission</span>
              <span style={{ flexShrink: 0, color: GREEN_MAIN, display: "inline-flex" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </button>

          </div>

        </div>
      </section>

      {/* ===== ACHIEVEMENTS ===== */}
      <section id="achievements" className="reveal" style={{ background: GREEN_LIGHT, padding: "64px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ width: 24, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />
              Our Achievements
              <span style={{ width: 24, height: 2, background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD})`, display: "block", borderRadius: 2 }} />
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, lineHeight: 1.2, marginBottom: 14 }}>A Tradition of Excellence</h2>
            <p style={{ fontSize: 16, color: "#4A6655", lineHeight: 1.7 }}>Year after year, our students excel in the classroom and beyond — growing into confident, capable, and Christ-like leaders.</p>
          </div>
          <div className="achv-grid">
            {[
              { icon: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>, title: "Consistent Results", desc: "Strong first-grade performances at O-Level and solid A-Level passes, term after term." },
              { icon: <><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 2 2 6 2s6-1 6-2v-5" /></>, title: "University Pathways", desc: "A-Level graduates progressing to universities and tertiary institutions at home and abroad." },
              { icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></>, title: "Beyond the Classroom", desc: "Achievements in sports, music, dance & drama, debate, and student leadership." },
              { icon: <><path d="M12 2v20M5 6h14M5 6v8a7 7 0 0 0 14 0V6" /></>, title: "Christ-Centred Character", desc: "Graduates who are disciplined, morally upright, and God-fearing." },
            ].map((a, i) => (
              <div key={i} style={{ background: WHITE, border: "1px solid rgba(10,64,32,0.07)", borderRadius: 16, padding: "30px 24px", textAlign: "center", boxShadow: "0 10px 30px rgba(10,64,32,0.07)", transition: "transform 0.25s ease, box-shadow 0.25s ease" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 18px 40px rgba(10,64,32,0.14)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(10,64,32,0.07)"; }}>
                <div style={{ width: 60, height: 60, margin: "0 auto 18px", borderRadius: 18, background: `linear-gradient(135deg, ${GREEN_MAIN}, ${GREEN_DARK})`, display: "flex", alignItems: "center", justifyContent: "center", color: WHITE, boxShadow: "0 8px 18px rgba(26,107,60,0.32)" }}>
                  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                </div>
                <h3 style={{ fontSize: 16.5, fontWeight: 700, color: GREEN_DARK, marginBottom: 8 }}>{a.title}</h3>
                <p style={{ fontSize: 13.5, color: "#5A6B60", lineHeight: 1.6 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROGRAMMES ===== */}
      <section id="programmes" className="reveal" style={{ background: OFF_WHITE, padding: "56px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />Academics
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, lineHeight: 1.2, marginBottom: 16 }}>{text("programmes_heading", "Our Programmes")}</h2>
          <p style={{ fontSize: 16, color: "#5A5A5A", lineHeight: 1.7, maxWidth: 560, marginBottom: 32 }}>
            {text("programmes_intro", "A comprehensive National Curriculum across O-Level and A-Level, complemented by vocational programmes that prepare students for life beyond school.")}
          </p>

          <div className="programmes-rows">
            {programmeItems.map((p, i) => (
              <div key={i} className={`programme-row${i % 2 === 1 ? " programme-row--reverse" : ""}`}>
                <div className="programme-row-img" style={{ overflow: "hidden", borderRadius: 12, minHeight: 300 }}>
                  <img src={p.img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div className="programme-row-body" style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "8px 4px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: GREEN_MAIN, marginBottom: 8 }}>{p.tag}</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: GREEN_DARK, lineHeight: 1.2, marginBottom: 14 }}>{p.title}</h3>
                  <p style={{ fontSize: 15, color: "#5A5A5A", lineHeight: 1.7, marginBottom: 18 }}>{p.desc}</p>
                  <button onClick={() => openDetail(`/programmes/${slugify(p.title)}`)} style={{
                    alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 9, cursor: "pointer",
                    background: GREEN_MAIN, color: WHITE, border: "none", borderRadius: 100,
                    padding: "10px 20px", fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                    transition: "background 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = GREEN_DARK; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = GREEN_MAIN; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    View Subjects &amp; Details
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== UPDATES / PARENT NOTICEBOARD ===== */}
      <section id="updates" className="reveal" style={{ background: GREEN_LIGHT, padding: "56px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />Updates for Parents
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, marginBottom: 12 }}>School Updates &amp; Announcements</h2>
          <p style={{ fontSize: 16, color: "#4A5A50", lineHeight: 1.7, maxWidth: 620, marginBottom: 40 }}>
            This is our official noticeboard for parents and guardians. Check here regularly for the latest information on school programmes, fees, term dates, and important announcements.
          </p>

          {/* Compact teaser — the two most recent notices; full list on /updates */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {updateItems.slice(0, 2).map((u, i) => updateCard(u, i))}
          </div>

          <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
            <button onClick={() => openDetail("/updates")} style={{
              display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer",
              background: GREEN_MAIN, color: WHITE, border: "none", borderRadius: 100,
              padding: "13px 30px", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 10px 24px rgba(10,64,32,0.18)", transition: "background 0.2s, transform 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = GREEN_DARK; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = GREEN_MAIN; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              View All {updateItems.length} Updates
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      </section>

      {/* ===== CAMPUS GALLERY ===== */}
      <section id="campus" className="reveal" style={{ background: OFF_WHITE, padding: "56px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />Campus Life
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, marginBottom: 12 }}>Life at Grace High School</h2>
          <p style={{ fontSize: 16, color: "#5A5A5A", lineHeight: 1.7, maxWidth: 560, marginBottom: 24 }}>Our 28-acre campus near Kasangati, Gayaza provides a serene, green environment ideal for learning, worship, and growth.</p>

          {/* Filter buttons */}
          <div style={{ display: "flex", gap: 10, marginBottom: 26, flexWrap: "wrap" }}>
            {[
              { key: "all",          label: "All Photos",   icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></> },
              { key: "campus",       label: "Campus",       icon: <><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-3" /><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" /></> },
              { key: "academics",    label: "Academics",    icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></> },
              { key: "vocational",   label: "Vocational",   icon: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></> },
              { key: "events",       label: "Events",       icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></> },
              { key: "achievements", label: "Achievements", icon: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></> },
            ].map(btn => {
              const active = galleryFilter === btn.key;
              return (
                <button key={btn.key} onClick={() => setGalFilter(btn.key)} style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "9px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                  background: active ? `linear-gradient(135deg, ${GREEN_MAIN}, ${GREEN_DARK})` : WHITE,
                  color: active ? WHITE : "#4A5A50",
                  border: `1.5px solid ${active ? "transparent" : "rgba(10,64,32,0.12)"}`,
                  boxShadow: active ? "0 8px 20px rgba(10,64,32,0.22)" : "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = GREEN_MAIN; e.currentTarget.style.color = GREEN_MAIN; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "rgba(10,64,32,0.12)"; e.currentTarget.style.color = "#4A5A50"; } }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{btn.icon}</svg>
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* Modern masonry gallery grid */}
          <div className="gallery-grid">
            {filtered.map((item, i) => (
              <div key={i} className={`gallery-item${item.wide ? " wide" : ""}`}
                role="button" tabIndex={0} aria-label={`View photo: ${item.label}`}
                onClick={() => setLightbox(item.src)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLightbox(item.src); } }}>
                <img src={item.src} alt={item.label} />
                <span className="gallery-cat">{catLabel(item.cat)}</span>
                <span className="gallery-zoom" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3M11 8v6M8 11h6" /></svg>
                </span>
                <div className="gallery-caption">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== VIDEOS ===== */}
      <section id="videos" className="reveal" style={{ background: OFF_WHITE, padding: "56px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />School Videos
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, marginBottom: 12 }}>Watch Grace High School in Action</h2>
          <p style={{ fontSize: 16, color: "#5A5A5A", lineHeight: 1.7, maxWidth: 620, marginBottom: 40 }}>
            Explore videos of school events, performances, and student life. Click any video to play it.
          </p>

          <div className="videos-grid">
            {videoItems.map((v, i) => (
              <div key={i} onClick={() => setVideoModal(v.youtubeId)} style={{
                background: WHITE, borderRadius: 12, overflow: "hidden", cursor: "pointer",
                border: "1px solid rgba(0,0,0,0.08)", transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(10,64,32,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ position: "relative", height: 190, overflow: "hidden" }}>
                  <img src={v.thumb} alt={v.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent, rgba(10,64,32,0.55))" }} />
                  <div style={{
                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                    width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.92)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                  }}>
                    <span style={{ fontSize: 22, color: GREEN_DARK, marginLeft: 4 }}>▶</span>
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: GREEN_MAIN, marginBottom: 6 }}>{v.cat}</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", color: GREEN_DARK, lineHeight: 1.3 }}>{v.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RESOURCES ===== */}
      <section id="resources" className="reveal" style={{ background: OFF_WHITE, padding: "72px 5%", position: "relative", overflow: "hidden" }}>
        {/* soft decorative blobs */}
        <div aria-hidden style={{ position: "absolute", top: -120, right: -120, width: 360, height: 360, borderRadius: "50%", background: GREEN_LIGHT, opacity: 0.6, filter: "blur(10px)", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", bottom: -140, left: -100, width: 320, height: 320, borderRadius: "50%", background: "rgba(201,162,75,0.10)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />Student Resources
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, marginBottom: 12 }}>Download Centre</h2>
          <p style={{ fontSize: 16, color: "#5A5A5A", lineHeight: 1.7, maxWidth: 640, marginBottom: 44 }}>
            Past examination papers, holiday assignments, and application forms shared by the school — all in one place. Tap any file to download it straight to your device.
          </p>

          {resLoading ? (
            <div className="resources-grid">
              {[0, 1, 2].map(i => (
                <div key={i} style={{ background: WHITE, borderRadius: 18, padding: 22, border: "1px solid rgba(10,64,32,0.07)", height: 150, opacity: 0.6 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: GREEN_LIGHT, marginBottom: 16 }} />
                  <div style={{ width: "70%", height: 12, borderRadius: 6, background: GREEN_LIGHT, marginBottom: 10 }} />
                  <div style={{ width: "45%", height: 12, borderRadius: 6, background: GREEN_LIGHT }} />
                </div>
              ))}
            </div>
          ) : (
            ([
              { key: "past_paper" as const, label: "Past Papers", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h8" /><path d="M8 9h2" /></>, blurb: "Revision papers from previous examinations." },
              { key: "holiday_work" as const, label: "Holiday Work", icon: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></>, blurb: "Assignments to keep learning over the break." },
              { key: "application_form" as const, label: "Application Forms", icon: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="m9 14 2 2 4-4" /></>, blurb: "Forms for new student admissions." },
            ]).map(group => {
              const items = resources.filter(r => r.category === group.key);
              return (
                <div key={group.key} style={{ marginBottom: 40 }}>
                  {/* group header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
                    <span style={{
                      flexShrink: 0, width: 52, height: 52, borderRadius: 14,
                      background: `linear-gradient(135deg, ${GREEN_MAIN}, ${GREEN_DARK})`,
                      display: "flex", alignItems: "center", justifyContent: "center", color: WHITE,
                      boxShadow: "0 8px 22px rgba(10,64,32,0.22)",
                    }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{group.icon}</svg></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", color: GREEN_DARK, lineHeight: 1.2, marginBottom: 2 }}>{group.label}</h3>
                      <p style={{ fontSize: 13, color: "#7A8A80" }}>{group.blurb}</p>
                    </div>
                    <span style={{
                      flexShrink: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.03em",
                      padding: "6px 14px", borderRadius: 999,
                      background: items.length ? GREEN_LIGHT : "rgba(0,0,0,0.04)",
                      color: items.length ? GREEN_DARK : "#9AA5A0",
                      whiteSpace: "nowrap",
                    }}>{items.length ? `${items.length} file${items.length > 1 ? "s" : ""}` : "Coming soon"}</span>
                  </div>

                  {items.length === 0 ? (
                    <div style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      textAlign: "center", padding: "40px 24px", borderRadius: 18,
                      background: WHITE, border: `1.5px dashed rgba(26,107,60,0.28)`,
                    }}>
                      <span style={{
                        width: 56, height: 56, borderRadius: "50%", background: GREEN_LIGHT,
                        display: "flex", alignItems: "center", justifyContent: "center", color: GREEN_MAIN, marginBottom: 14,
                      }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{group.icon}</svg></span>
                      <p style={{ fontSize: 14, fontWeight: 600, color: GREEN_DARK, marginBottom: 4 }}>Nothing here yet</p>
                      <p style={{ fontSize: 13, color: "#8A958F", maxWidth: 320 }}>No {group.label.toLowerCase()} have been uploaded yet — please check back soon.</p>
                    </div>
                  ) : (
                    <div className="resources-grid">
                      {items.map(r => (
                        <a
                          key={r.id}
                          href={`${API}/storage${r.objectPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex", flexDirection: "column", background: WHITE, borderRadius: 18, padding: 22,
                            border: "1px solid rgba(10,64,32,0.08)", textDecoration: "none",
                            boxShadow: "0 4px 18px rgba(10,64,32,0.05)",
                            transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 16px 44px rgba(10,64,32,0.16)"; e.currentTarget.style.borderColor = GREEN_MAIN; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(10,64,32,0.05)"; e.currentTarget.style.borderColor = "rgba(10,64,32,0.08)"; }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                            <span style={{
                              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                              background: GREEN_LIGHT, color: GREEN_DARK,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{group.icon}</svg></span>
                            <span style={{
                              fontSize: 11, fontWeight: 700, letterSpacing: "0.03em",
                              padding: "4px 11px", borderRadius: 999,
                              background: "rgba(201,162,75,0.16)", color: "#8A6A1E", whiteSpace: "nowrap",
                            }}>{r.level}</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: GREEN_MAIN, marginBottom: 6 }}>{r.subject}</span>
                          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.12rem", color: GREEN_DARK, lineHeight: 1.3, marginBottom: 18 }}>{r.title}</h4>
                          <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, paddingTop: 14, borderTop: "1px solid rgba(10,64,32,0.07)" }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: WHITE,
                              background: `linear-gradient(135deg, ${GREEN_MAIN}, ${GREEN_DARK})`,
                              padding: "8px 16px", borderRadius: 999,
                            }}>⬇ Download</span>
                            <span style={{ fontSize: 11, color: "#A0AAA4", textAlign: "right" }}>{[r.term, formatSize(r.fileSize)].filter(Boolean).join(" · ")}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ===== STAFF ===== */}
      <section id="staff" className="reveal" style={{ background: WHITE, padding: "56px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />Our Team
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, marginBottom: 12 }}>
            Meet Our Dedicated Staff
          </h2>
          <p style={{ fontSize: 16, color: "#5A5A5A", lineHeight: 1.7, maxWidth: 580, marginBottom: 40 }}>
            Grace High School is powered by a committed team of qualified teachers and support staff who pour heart and knowledge into every student's journey.
          </p>

          {/* Staff stats */}
          <div style={{
            borderRadius: 14, marginBottom: 40,
            background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN_MAIN})`,
            padding: "32px", display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap", gap: 24,
          }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: WHITE, marginBottom: 4 }}>
                Our Teaching Team
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
                Qualified, passionate educators — Gayaza campus
              </p>
            </div>
            <div style={{ display: "flex", gap: 28 }}>
              {[
                { num: "12+", label: "Teaching Staff" },
                { num: "100%", label: "Qualified" },
                { num: "S1–S6", label: "All Levels" },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, color: "#8EEDC0", display: "block", lineHeight: 1 }}>{s.num}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ===== ADMISSIONS ===== */}
      <section id="admissions" className="reveal" style={{ position: "relative", overflow: "hidden", background: GREEN_DARK, padding: "56px 5%" }}>
        <img src={img_admissions_watermark} alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.18 }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, rgba(10,64,32,0.92) 0%, rgba(10,64,32,0.82) 100%)` }} />
        <div className="admissions-grid" style={{ position: "relative" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8EEDC0", display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />Admissions
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: WHITE, marginBottom: 12 }}>{text("admissions_heading", "Join the Grace Family")}</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 36 }}>{text("admissions_intro", "Admissions are currently open for all classes — S1 through S6. We welcome students and families who share our commitment to faith, excellence, and vision.")}</p>

            {/* Admissions info — compact tiles, each opening its own page */}
            <div className="entry-points-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {admissionSlides.map((s, i) => (
                <button key={i} onClick={() => openDetail(`/admissions/${slugify(s.title)}`)} style={{
                  display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  padding: "18px 18px", color: WHITE, fontFamily: "'DM Sans', sans-serif",
                  transition: "background 0.2s, transform 0.2s, border-color 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(142,237,192,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", background: "rgba(142,237,192,0.14)", border: "1px solid rgba(142,237,192,0.4)", color: "#8EEDC0", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: WHITE, marginBottom: 2 }}>{s.title}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.45 }}>{s.subtitle}</span>
                  </span>
                  <span style={{ flexShrink: 0, color: "#8EEDC0", display: "inline-flex" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </button>
              ))}
            </div>

            {/* Intake banner */}
            <div style={{
              display: "flex", gap: 14, alignItems: "center", marginTop: 24,
              background: "linear-gradient(135deg, rgba(142,237,192,0.14), rgba(76,175,130,0.1))",
              border: "1px solid rgba(142,237,192,0.3)", borderRadius: 8, padding: "16px 20px",
            }}>
              <span style={{ flexShrink: 0, color: "#8EEDC0" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m9 16 2 2 4-4" /></svg>
              </span>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, margin: 0 }}>
                <strong style={{ color: WHITE }}>Admissions are open</strong> for all classes (S1–S6) for the 2025/2026 academic year. Apply early to secure a place.
              </p>
            </div>

            {/* Download application forms */}
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: WHITE, marginTop: 32, marginBottom: 6 }}>Download Application Form</h3>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 16 }}>
              Choose the form for your entry class, print and fill it in — then send the completed form straight to the school using the <strong style={{ color: GOLD_LIGHT }}>“Submit Your Completed Form”</strong> box below.
            </p>
            <div className="entry-points-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {([
                { level: "S1" as const, label: "S1 Application Form", note: "For Senior One (from PLE)" },
                { level: "S5" as const, label: "S5 Application Form", note: "For Senior Five (from UCE)" },
              ]).map(f => (
                <button key={f.level} onClick={() => generateApplicationForm(f.level)} style={{
                  display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer",
                  background: WHITE, border: "none", borderRadius: 8, padding: "16px 18px",
                  fontFamily: "'DM Sans', sans-serif", transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <span style={{
                    flexShrink: 0, width: 40, height: 40, borderRadius: 8,
                    background: `linear-gradient(135deg, ${GREEN_MAIN}, ${GREEN_DARK})`, color: WHITE,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  </span>
                  <span>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: GREEN_DARK }}>{f.label}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "#7A8A80", marginTop: 2 }}>{f.note} · PDF</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Submit completed form */}
            <div style={{
              marginTop: 26, background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)", borderRadius: 12, padding: 22,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{
                  flexShrink: 0, width: 34, height: 34, borderRadius: 8,
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: GREEN_DARK,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                </span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: WHITE, margin: 0 }}>Submit Your Completed Form</h3>
              </div>
              <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 16 }}>
                Finished filling in the form? Scan or photograph it and send it straight to the admissions office here — no email needed. We accept PDF, photos, or Word documents (max 15&nbsp;MB).
              </p>
              {submitSent ? (
                <div style={{ background: "rgba(142,237,192,0.14)", border: "1px solid rgba(142,237,192,0.4)", borderRadius: 8, padding: 18, textAlign: "center", fontSize: 14, color: "#8EEDC0", fontWeight: 500 }}>
                  ✅ Form received! The admissions office will review it and contact you soon.
                </div>
              ) : (
                <form onSubmit={async e => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const firstName = (fd.get("sfFirstName") as string)?.trim();
                  if (!firstName) { setSubmitError("Please enter your name."); return; }
                  if (!submitFile) { setSubmitError("Please choose your completed form file."); return; }
                  setSubmitSending(true);
                  setSubmitError(null);
                  try {
                    const contentType = submitFile.type || "application/octet-stream";
                    const up = await fetch(`${API}/storage/application-uploads/request-url`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: submitFile.name, size: submitFile.size, contentType }),
                    });
                    if (!up.ok) {
                      const body = await up.json().catch(() => null);
                      throw new Error(body?.error || `Upload failed (${up.status})`);
                    }
                    const { uploadURL, objectPath } = await up.json();
                    const put = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": contentType }, body: submitFile });
                    if (!put.ok) throw new Error(`Upload failed (${put.status})`);
                    const res = await fetch(`${API}/submissions`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        type: "application",
                        firstName,
                        lastName: (fd.get("sfLastName") as string)?.trim() || null,
                        phone: (fd.get("sfPhone") as string)?.trim() || null,
                        email: (fd.get("sfEmail") as string)?.trim() || null,
                        level: (fd.get("sfLevel") as string) || null,
                        fileUrl: objectPath,
                        fileName: submitFile.name,
                        website: "",
                      }),
                    });
                    if (!res.ok) throw new Error(`Submission failed (${res.status})`);
                    setSubmitSent(true);
                    setSubmitFile(null);
                  } catch (err) {
                    setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
                  } finally {
                    setSubmitSending(false);
                  }
                }}>
                  {submitError ? (
                    <div style={{ background: "rgba(230,162,60,0.15)", border: "1px solid rgba(230,162,60,0.5)", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13, color: "#F0C36B" }}>
                      {submitError}
                    </div>
                  ) : null}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    {[["First Name", "sfFirstName", true], ["Surname", "sfLastName", false]].map(([lbl, name, req]) => (
                      <input key={name as string} name={name as string} required={req as boolean} placeholder={lbl as string} style={sfInput} />
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <input name="sfPhone" type="tel" placeholder="Phone / WhatsApp" style={sfInput} />
                    <select name="sfLevel" defaultValue="" style={sfInput}>
                      <option value="">Applying for…</option>
                      {["S1", "S5"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <input name="sfEmail" type="email" placeholder="Email (optional)" style={{ ...sfInput, marginBottom: 12 }} />
                  <label style={{
                    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                    background: "rgba(255,255,255,0.05)", border: "1.5px dashed rgba(255,255,255,0.25)",
                    borderRadius: 8, padding: "12px 14px", marginBottom: 16,
                  }}>
                    <span style={{ flexShrink: 0, color: GOLD_LIGHT }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                    </span>
                    <span style={{ fontSize: 13.5, color: submitFile ? WHITE : "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {submitFile ? submitFile.name : "Choose your completed form (PDF, photo or Word)"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      onChange={e => { setSubmitFile(e.target.files?.[0] ?? null); setSubmitError(null); }}
                      style={{ display: "none" }}
                    />
                  </label>
                  <button type="submit" disabled={submitSending} style={{
                    width: "100%", background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: GREEN_DARK,
                    padding: 14, border: "none", borderRadius: 6, fontWeight: 800, fontSize: 15,
                    cursor: submitSending ? "not-allowed" : "pointer", opacity: submitSending ? 0.7 : 1,
                    fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.2s",
                  }}>{submitSending ? "Sending…" : "Send to School"}</button>
                </form>
              )}
            </div>
          </div>

          {/* Contact form */}
          <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 12, padding: 32 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", color: GREEN_DARK, marginBottom: 24 }}>Enquire / Apply Now</h3>
            {formSent ? (
              <div style={{ background: GREEN_LIGHT, border: `1px solid ${GREEN_MAIN}`, borderRadius: 8, padding: 20, textAlign: "center", fontSize: 14, color: GREEN_MAIN, fontWeight: 500 }}>
                ✅ Thank you! We'll be in touch within 1–2 business days.
              </div>
            ) : (
              <form onSubmit={async e => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const firstName = (fd.get("firstName") as string)?.trim();
                if (!firstName) return;
                setFormSending(true);
                try {
                  const res = await fetch(`${API}/submissions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      type: "enquiry",
                      firstName,
                      lastName: (fd.get("lastName") as string)?.trim() || null,
                      phone: (fd.get("phone") as string)?.trim() || null,
                      email: (fd.get("email") as string)?.trim() || null,
                      level: (fd.get("level") as string) || null,
                      message: (fd.get("message") as string)?.trim() || null,
                      website: (fd.get("website") as string) || "",
                    }),
                  });
                  if (!res.ok) throw new Error(`Request failed (${res.status})`);
                  setFormSent(true);
                } catch {
                  setFormError(true);
                } finally {
                  setFormSending(false);
                }
              }}>
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
                />
                {formError ? (
                  <div style={{ background: "#FFF4E5", border: "1px solid #E6A23C", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13, color: "#8A5A00" }}>
                    Sorry, something went wrong sending your message. Please try again, or contact the school office directly.
                  </div>
                ) : null}
                <div className="form-name-row">
                  {[["First Name","text","firstName"],["Surname","text","lastName"]].map(([lbl, type, name]) => (
                    <div key={lbl} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5A5A", letterSpacing: "0.05em", textTransform: "uppercase" }}>{lbl}</label>
                      <input required={name === "firstName"} name={name} type={type} placeholder={lbl} style={{
                        padding: "11px 14px", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: 6,
                        fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#1A1A1A",
                        background: OFF_WHITE, outline: "none",
                      }}
                      onFocus={e => (e.target.style.borderColor = GREEN_MAIN)}
                      onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                      />
                    </div>
                  ))}
                </div>
                {[
                  ["Phone / WhatsApp", "tel",   "E.g. +256 700 000000", "phone"],
                  ["Email Address",    "email", "yourname@example.com", "email"],
                ].map(([lbl, type, ph, name]) => (
                  <div key={lbl} style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5A5A", letterSpacing: "0.05em", textTransform: "uppercase" }}>{lbl}</label>
                    <input name={name} type={type} placeholder={ph as string} style={{
                      padding: "11px 14px", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: 6,
                      fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#1A1A1A",
                      background: OFF_WHITE, outline: "none",
                    }}
                    onFocus={e => (e.target.style.borderColor = GREEN_MAIN)}
                    onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                    />
                  </div>
                ))}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5A5A", letterSpacing: "0.05em", textTransform: "uppercase" }}>Applying For</label>
                  <select name="level" required style={{
                    padding: "11px 14px", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: 6,
                    fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#1A1A1A",
                    background: OFF_WHITE, outline: "none",
                  }}
                  onFocus={e => (e.target.style.borderColor = GREEN_MAIN)}
                  onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                  >
                    <option value="">Select class</option>
                    {["S1","S2","S3","S4","S5","S6"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5A5A", letterSpacing: "0.05em", textTransform: "uppercase" }}>Message (Optional)</label>
                  <textarea name="message" rows={3} placeholder="Any questions for us?" style={{
                    padding: "11px 14px", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: 6,
                    fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#1A1A1A",
                    background: OFF_WHITE, outline: "none", resize: "vertical",
                  }}
                  onFocus={e => (e.target.style.borderColor = GREEN_MAIN)}
                  onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                  />
                </div>
                <button type="submit" disabled={formSending} style={{
                  width: "100%", background: GREEN_MAIN, color: WHITE,
                  padding: 14, border: "none", borderRadius: 6, fontWeight: 700, fontSize: 15,
                  cursor: formSending ? "not-allowed" : "pointer", opacity: formSending ? 0.7 : 1,
                  fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = GREEN_DARK)}
                onMouseLeave={e => (e.currentTarget.style.background = GREEN_MAIN)}
                >{formSending ? "Sending…" : "Submit Enquiry"}</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ===== AFFILIATIONS ===== */}
      <section className="reveal" style={{ background: WHITE, padding: "56px 5%", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: GREEN_MAIN, marginBottom: 8 }}>Affiliations &amp; Partners</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.4rem, 2.4vw, 2rem)", color: GREEN_DARK, marginBottom: 28 }}>Recognised &amp; Connected</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            {[
              "Uganda National Curriculum",
              "UNEB — Examinations Body",
              "Ministry of Education & Sports",
              "Gayaza Zone Schools",
              "Wakiso District Education",
            ].map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: OFF_WHITE, border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 100, padding: "12px 22px",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`, display: "block", flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: GREEN_DARK }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="reveal" style={{ background: OFF_WHITE, padding: "56px 5%" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ background: GREEN_DARK, borderRadius: 12, padding: 28, color: WHITE }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", color: "#8EEDC0", marginBottom: 14 }}>Find Us on Campus</h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 18 }}>
              Grace High School is located near Kasangati Town along Namavundu Road, Gayaza, in Wakiso District. Our 28-acre campus is easily accessible from Kampala via Gayaza Road.
            </p>
            <a href="mailto:gracehighschoolgayaza@gmail.com" style={{
              display: "inline-block", background: "#4CAF82", color: GREEN_DARK,
              padding: "11px 24px", borderRadius: 6, fontWeight: 700, fontSize: 14,
              textDecoration: "none",
            }}>Email Us Now</a>
          </div>
        </div>
      </section>
      </>)}

      {/* ===== DETAIL PAGES (own URLs; chrome above/below is shared) ===== */}
      {!isHome && renderDetailPage()}

      {/* ===== FOOTER ===== */}
      <footer style={{ position: "relative", background: GREEN_DARK, borderTop: "1px solid rgba(255,255,255,0.08)", padding: "48px 5% 28px", overflow: "hidden" }}>
        {/* Campus watermark */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none", userSelect: "none",
          backgroundImage: `url("${img_footer_watermark}")`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.22,
        }} />
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `linear-gradient(180deg, ${GREEN_DARK}80, ${GREEN_DARK}99)`,
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto" }}>
          <div className="footer-grid">
            {/* About Us */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: WHITE, padding: 3, boxShadow: "0 0 0 2px rgba(76,175,130,0.4)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}><img src={schoolLogo} alt="Grace High School Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
                <div style={{ color: WHITE }}>
                  <strong style={{ display: "block", fontSize: 13, fontWeight: 600 }}>Grace High School</strong>
                  <span style={{ fontSize: 11, color: "#8EEDC0" }}>Gayaza, Uganda</span>
                </div>
              </div>
              <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8EEDC0", marginBottom: 10 }}>About Us</h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                Grace High School fosters a supportive, Christ-centred environment where every student feels valued and empowered to reach their full potential.
              </p>
            </div>

            {/* Opening Hours */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8EEDC0", marginBottom: 16 }}>Opening Hours</h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 6 }}>Open Monday – Saturday</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>7:00am to 6:00pm</p>
            </div>

            {/* Our Students */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8EEDC0", marginBottom: 16 }}>Our Students</h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                A student of Grace High School grows into a caring, innovative and reflective thinker, rooted in faith, excellence and integrity.
              </p>
            </div>

            {/* News Feed */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8EEDC0", marginBottom: 16 }}>News Feed</h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.55, marginBottom: 4 }}>Admissions Open for All Classes — 2025/2026 Academic Year</p>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>2025 · Grace High School</span>
            </div>

            {/* Get In Touch */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8EEDC0", marginBottom: 16 }}>Get In Touch</h4>
              <ul style={{ listStyle: "none", display: "grid", gap: 8 }}>
                <li style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>Namavundu Road, Gayaza</li>
                <li style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>Wakiso District, Uganda</li>
                <li style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>Near Kasangati Town</li>
                <li style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginTop: 4 }}>
                  Email:<br />
                  <a href="mailto:gracehighschoolgayaza@gmail.com" style={{ color: "#8EEDC0", textDecoration: "none" }}>gracehighschoolgayaza@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>© {new Date().getFullYear()} Grace High School – Gayaza. All rights reserved.</p>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#8EEDC0", marginBottom: 2 }}>Grace High School — Education For A Bright Future</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

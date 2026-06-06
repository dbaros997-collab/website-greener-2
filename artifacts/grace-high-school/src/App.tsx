import { useState, useEffect, useRef } from "react";
import {
  useListNewsItems,
  useListStats,
  useListTestimonials,
  useListVideos,
  useListProgrammes,
  useListAdmissionSteps,
  useListGalleryImages,
  useListSiteText,
} from "@workspace/api-client-react";

import schoolLogo from "@assets/school_logo_transparent.png";
import img_computerlab from "@assets/481077779_1149890966830658_5041740680217479426_n_1780399993019.jpg";
import img_library from "@assets/481080206_1149891370163951_6952293395059892096_n_1780400223690.jpg";
import img_staff from "@assets/480812359_1141749094311512_4566229955265803529_n_1780400736314.jpg";
import img_assembly1 from "@assets/483102123_1154996392986782_6972322137511794977_n_1780398909145.jpg";
import img_campus_hero from "@assets/IMG_9926_1780652934166.jpg";
import img_alevel from "@assets/3@_(7)_1780653886082.JPG";
import img_science from "@assets/IMG_0144_-_Copy_1780654332068.jpg";
import img_mdd from "@assets/IMG_5939_1780675538368.JPG";
import img_assembly2 from "@assets/484133260_1154995782986843_2670185066900187260_n_1780398909146.jpg";
import img_garden from "@assets/505593050_3139476362884117_3169080199463829847_n_1780398909147.jpg";
import img_exam from "@assets/505808199_3139672606197826_738541539324222896_n_1780398909147.jpg";
import img_media from "@assets/481302535_1149890503497371_8676145292623403547_n_1780398909148.jpg";
import img_dorm from "@assets/481469630_1149892456830509_9107022341216219801_n_1780398909148.jpg";
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

const GREEN_DARK  = "#0A4020";
const GREEN_MAIN  = "#1A6B3C";
const GREEN_MID   = "#237A48";
const GREEN_LIGHT = "#E8F5EE";
const WHITE       = "#FFFFFF";
const OFF_WHITE   = "#F5FAF7";
const GOLD        = "#C9A24B";
const GOLD_LIGHT  = "#E6C66E";

const HERO_SLIDES = [
  img_campus_hero,
  img_campus,
  img_assembly1,
  img_alevel,
];

const API = "/api";

interface Resource {
  id: number;
  title: string;
  subject: string;
  category: "past_paper" | "holiday_work";
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

export default function App() {
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [lightbox, setLightbox]       = useState<string | null>(null);
  const [videoModal, setVideoModal]   = useState<string | null>(null);
  const [testitIdx, setTestiIdx]      = useState(0);
  const [galleryFilter, setGalFilter] = useState("all");
  const [formSent, setFormSent]       = useState(false);
  const [resources, setResources]     = useState<Resource[]>([]);
  const [resLoading, setResLoading]   = useState(true);
  const [heroSlide, setHeroSlide]     = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setHeroSlide(i => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

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

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${testitIdx * 364}px)`;
    }
  }, [testitIdx]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const galleryItems = [
    { src: img_computerlab, label: "Computer Lab — ICT Practical Session",  cat: "academics", wide: true },
    { src: img_science,     label: "Science Students — Lab Coats & Study",  cat: "academics", wide: true },
    { src: img_library,     label: "School Library — Students Reading",      cat: "academics" },
    { src: img_staff,       label: "Our Teaching Staff — Grace High School", cat: "campus", wide: true },
    { src: img_alevel,      label: "A-Level Students — S5 & S6 Class",       cat: "campus", wide: true },
    { src: img_campus,      label: "Campus Grounds — 28 Acres of Green",     cat: "campus" },
    { src: img_dorm,        label: "Dormitory — Boarding Facilities",        cat: "campus" },
    { src: img_assembly1,   label: "School Assembly — Students Gathered",    cat: "events", wide: true },
    { src: img_mdd,         label: "Music, Dance & Drama — Stage Performance", cat: "events", wide: true },
    { src: img_welding,     label: "Vocational Skills — Metal Welding",      cat: "vocational", wide: true },
    { src: img_garden,      label: "Agriculture — Students in the Farm",     cat: "vocational" },
    { src: img_trophy,      label: "Award Ceremony — Excellence Recognised", cat: "achievements", wide: true },
  ];

  const schoolVideos = [
    { thumb: img_featured_video,cat: "Featured", title: "Grace High School — Featured Video", youtubeId: "c6dBmvv4BLQ" },
  ];

  const testimonials = [
    { text: "Grace High School gave me more than grades — it gave me faith, discipline, and purpose. My UACE results opened doors I never imagined.", name: "Katumwa Hannington", role: "UACE 2023 — 20 Points", init: "KH" },
    { text: "The teachers here go beyond the syllabus. They invest in you as a person, not just a student. I feel ready for university and for life.", name: "Ainebyoona Miriam", role: "S6 Graduate, 2024", init: "AM" },
    { text: "As a parent, I have watched my son transform — academically and morally. The Christian foundation at Grace is real, not just on paper.", name: "Mr. Byaruhanga", role: "Parent of S4 Student", init: "BB" },
    { text: "The vocational skills programme taught me tailoring alongside my A-Levels. I already have income while I wait for university admission.", name: "Namutebi Rose", role: "A-Level Graduate, 2024", init: "NR" },
  ];

  // ===== Dynamic content (DB-backed, with the static content above as a
  // graceful fallback whenever the API is empty or unreachable). =====
  const storageUrl = (objectPath: string) => `${API}/storage${objectPath}`;

  const newsQ = useListNewsItems();
  const statsQ = useListStats();
  const testimonialsQ = useListTestimonials();
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
      tag: "S1 – S4", title: "Ordinary Level", img: img_exam,
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

  const testimonialItems = testimonialsQ.data?.length
    ? testimonialsQ.data.map((t) => ({ text: t.quote, name: t.name, role: t.role, init: t.initials }))
    : testimonials;

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

  const navBg = scrolled
    ? `rgba(255,255,255,0.98)`
    : `rgba(255,255,255,0.96)`;

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
          <div onClick={e => e.stopPropagation()} style={{ width: "min(900px, 92vw)", maxWidth: 900 }}>
            {videoModal ? (
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 12, overflow: "hidden", background: "#000" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${videoModal}?autoplay=1`}
                  title="School video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                />
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
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1001,
        background: "#062C15", height: 36, padding: "0 5%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
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
          <span className="utility-links" style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>✉ gracehighschool2000@gmail.com</span>
          <a href="/admin/" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: GOLD_LIGHT, fontSize: 12, fontWeight: 600, textDecoration: "none",
            letterSpacing: "0.04em", textTransform: "uppercase",
          }}>Staff Login →</a>
        </div>
      </div>

      {/* ===== NAV ===== */}
      <nav style={{
        position: "fixed", top: 36, left: 0, right: 0, zIndex: 1000,
        background: navBg, backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `0 5%`, height: scrolled ? "62px" : "74px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        boxShadow: scrolled ? "0 4px 20px rgba(10,64,32,0.12)" : "0 2px 12px rgba(10,64,32,0.06)",
        transition: "height 0.3s, background 0.3s, box-shadow 0.3s",
      }}>
        <a href="#" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
          <div style={{
            width: 60, height: 60, borderRadius: 12,
            background: WHITE, padding: 4,
            boxShadow: "0 6px 18px rgba(10,64,32,0.18)", border: `1px solid ${GREEN_LIGHT}`, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}><img src={schoolLogo} alt="Grace High School Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
          <div style={{ color: GREEN_DARK }}>
            <strong style={{ display: "block", fontSize: 15, fontWeight: 700, letterSpacing: "0.01em", fontFamily: "'Playfair Display', serif" }}>Grace High School</strong>
            <span style={{ fontSize: 10.5, color: GREEN_MAIN, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>Gayaza, Uganda</span>
          </div>
        </a>

        {/* Desktop nav */}
        <ul style={{ gap: "1.6rem", listStyle: "none", alignItems: "center" }}
            className="hidden md:flex">
          {["about","programmes","news","updates","resources","campus","videos","admissions","contact"].map(id => (
            <li key={id}>
              <button onClick={() => scrollTo(id)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: GREEN_DARK, fontSize: 14, fontWeight: 600,
                letterSpacing: "0.01em", textTransform: "capitalize",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.color = GREEN_DARK)}
              >{id.charAt(0).toUpperCase() + id.slice(1)}</button>
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
            <span key={i} style={{ width: 24, height: 2, background: GREEN_DARK, borderRadius: 2, display: "block" }} />
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
          {["about","programmes","news","updates","resources","campus","videos","admissions","contact"].map(id => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: 500,
              padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.07)",
              textAlign: "left", textTransform: "capitalize",
            }}>{id.charAt(0).toUpperCase() + id.slice(1)}</button>
          ))}
          <button onClick={() => scrollTo("admissions")} style={{
            background: "#4CAF82", color: GREEN_DARK, border: "none",
            padding: 14, borderRadius: 6, fontWeight: 700, marginTop: 12, cursor: "pointer",
          }}>Apply Now</button>
        </div>
      )}

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
            backgroundImage: `url(${src})`,
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

        {/* Scroll cue */}
        <div className="scroll-cue" style={{
          position: "absolute", bottom: 26, left: "50%", transform: "translateX(-50%)",
          zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>Scroll</span>
          <span style={{ width: 22, height: 36, borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.4)", display: "flex", justifyContent: "center", paddingTop: 6 }}>
            <span style={{ width: 3, height: 7, borderRadius: 2, background: GOLD_LIGHT, display: "block" }} />
          </span>
        </div>

        <div className="hero-center" style={{
          maxWidth: 880, margin: "0 auto", textAlign: "center",
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          {/* Crest */}
          <div style={{ position: "relative", marginBottom: 24, animation: "crest-float 6s ease-in-out infinite" }}>
            <div style={{
              position: "absolute", inset: -22,
              background: "radial-gradient(circle, rgba(76,175,130,0.28) 0%, transparent 70%)",
              borderRadius: "50%",
            }} />
            <img src={schoolLogo} alt="Grace High School Crest" style={{
              width: 108, height: 108, objectFit: "contain", position: "relative",
              filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.55)) drop-shadow(0 0 22px rgba(142,237,192,0.45)) brightness(1.05)",
            }} />
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(201,162,75,0.12)", border: "1px solid rgba(230,198,110,0.45)",
            borderRadius: 100, padding: "7px 18px",
            fontSize: 12, fontWeight: 600, color: GOLD_LIGHT,
            letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 26,
            backdropFilter: "blur(4px)",
          }}>✦ Welcome to Excellence</div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2.6rem, 5.4vw, 4.6rem)",
            color: WHITE, lineHeight: 1.08, marginBottom: 24,
            letterSpacing: "-0.01em", textShadow: "0 2px 30px rgba(0,0,0,0.45)",
          }}>
            Run With a{" "}
            <em style={{
              fontStyle: "italic",
              background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD})`,
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>Vision</em>
            <br />at Grace High School
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.8, color: "rgba(255,255,255,0.88)", marginBottom: 38, maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
            A Christian-founded mixed secondary school on a 28-acre campus in Gayaza — producing morally upright, academically excellent, Christ-like leaders of tomorrow.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => scrollTo("admissions")} style={{
              background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`, color: "#3A2D08",
              padding: "15px 30px", borderRadius: 6, fontWeight: 700, fontSize: 15,
              border: "none", cursor: "pointer", letterSpacing: "0.02em",
              boxShadow: "0 10px 30px rgba(201,162,75,0.35)",
              transition: "box-shadow 0.25s, transform 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 42px rgba(201,162,75,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(201,162,75,0.35)"; }}
            >Apply For O'Level</button>

            <button onClick={() => scrollTo("admissions")} style={{
              background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`, color: "#3A2D08",
              padding: "15px 30px", borderRadius: 6, fontWeight: 700, fontSize: 15,
              border: "none", cursor: "pointer", letterSpacing: "0.02em",
              boxShadow: "0 10px 30px rgba(201,162,75,0.35)",
              transition: "box-shadow 0.25s, transform 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 42px rgba(201,162,75,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(201,162,75,0.35)"; }}
            >Apply For A'Level</button>

            <button onClick={() => scrollTo("about")} style={{
              background: "rgba(255,255,255,0.06)", color: WHITE,
              border: "1.5px solid rgba(255,255,255,0.45)",
              padding: "15px 32px", borderRadius: 6, fontWeight: 600, fontSize: 15,
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

      {/* ===== ABOUT ===== */}
      <section id="about" style={{ background: WHITE, padding: "56px 5%" }}>
        <div className="about-grid">
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

            {/* Vision & Mission */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 28, alignItems: "stretch" }}>
              <div style={{ background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_MID} 100%)`, borderRadius: 10, padding: "20px 24px", borderLeft: `4px solid ${GOLD}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "50%", background: "rgba(201,162,75,0.18)", border: `1px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌍</div>
                  <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: GOLD_LIGHT, margin: 0 }}>Our Vision</p>
                </div>
                <p style={{ fontSize: 15, color: WHITE, lineHeight: 1.7, fontStyle: "italic" }}>"{text("about_vision", "A centre of excellence that shapes exceptional individuals who will make a defining difference in our world.")}"</p>
              </div>
              <div style={{ background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_MID} 100%)`, borderRadius: 10, padding: "20px 24px", borderLeft: `4px solid #4CAF82` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "50%", background: "rgba(76,175,130,0.18)", border: "1px solid #4CAF82", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✝️</div>
                  <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8EEDC0", margin: 0 }}>Our Mission</p>
                </div>
                <p style={{ fontSize: 15, color: WHITE, lineHeight: 1.7, fontStyle: "italic" }}>"{text("about_mission", "To create unique learners who are socially functional, analytically precise, financially savvy and very creative in all areas of life for the glorification of God.")}"</p>
                <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>📍 Gayaza-Kasangati, Uganda</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>✝️ Christian-Founded</span>
                </div>
              </div>
            </div>

            {/* Feature cards */}
            <div style={{ display: "grid", gap: 16 }}>
              {[
                { icon: "✝️", title: "Christian Foundation", desc: "Rooted in Christian values, we develop the whole person — spiritually, academically, and socially." },
                { icon: "📚", title: "Academic Excellence", desc: "National Curriculum at both O-Level and A-Level, preparing students for university and beyond." },
                { icon: "🔧", title: "Vocational Skilling", desc: "Practical skills programmes ensure graduates are equipped for real-world opportunities." },
                { icon: "🌿", title: "Spacious 28-Acre Campus", desc: "Sports grounds, lush greens, and a peaceful learning environment near Kasangati." },
              ].map((f, i) => (
                <div key={i} style={{
                  display: "flex", gap: 16, padding: "18px 20px",
                  background: OFF_WHITE, borderRadius: 8,
                  borderLeft: `3px solid ${GREEN_MAIN}`, transition: "transform 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateX(4px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateX(0)")}
                >
                  <div style={{ width: 40, height: 40, flexShrink: 0, background: GREEN_LIGHT, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{f.icon}</div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: GREEN_DARK, marginBottom: 4 }}>{f.title}</h3>
                    <p style={{ fontSize: 13, color: "#5A5A5A", lineHeight: 1.5 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {/* Campus image */}
            <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 24, height: 240 }}>
              <img src={img_campus} alt="Campus grounds" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>

            {/* School Profile card */}
            <div style={{ background: GREEN_DARK, borderRadius: 12, padding: 32, color: WHITE }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: "#8EEDC0", marginBottom: 20 }}>School Profile</h3>
              {[
                ["Type", "Mixed Secondary School"],
                ["Location", "Namavundu Road, Gayaza, Wakiso"],
                ["Nearest Landmark", "Near Kasangati Town"],
                ["Campus Size", "28 Acres"],
                ["Curriculum", "National Curriculum (Uganda)"],
                ["Levels Offered", "O-Level (S1–S4) & A-Level (S5–S6)"],
                ["Foundation", "Christian"],
                ["Admissions", "Open — All Classes"],
                ["Email", "gracehighschool2000@gmail.com"],
              ].map(([label, val], i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: 14,
                }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{label}</span>
                  <span style={{ color: WHITE, textAlign: "right", maxWidth: 200 }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Motto */}
            <div style={{ background: GREEN_MAIN, borderRadius: 8, padding: "20px 24px", marginTop: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: 4 }}>School Motto</p>
              <blockquote style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontStyle: "italic", color: WHITE, fontWeight: 700 }}>"Run With a Vision"</blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROGRAMMES ===== */}
      <section id="programmes" style={{ background: OFF_WHITE, padding: "56px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />Academics
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, lineHeight: 1.2, marginBottom: 16 }}>{text("programmes_heading", "Our Programmes")}</h2>
          <p style={{ fontSize: 16, color: "#5A5A5A", lineHeight: 1.7, maxWidth: 560, marginBottom: 32 }}>
            {text("programmes_intro", "A comprehensive National Curriculum across O-Level and A-Level, complemented by vocational programmes that prepare students for life beyond school.")}
          </p>

          <div className="programmes-grid">
            {programmeItems.map((p, i) => (
              <div key={i} style={{
                background: WHITE, borderRadius: 12, overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.1)", transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ height: 160, position: "relative", overflow: "hidden" }}>
                  <img src={p.img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, rgba(10,64,32,0.3), rgba(10,64,32,0.8))` }} />
                  <div style={{ position: "absolute", bottom: 16, left: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8EEDC0", marginBottom: 4 }}>{p.tag}</div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", color: WHITE }}>{p.title}</h3>
                  </div>
                </div>
                <div style={{ padding: 24 }}>
                  <p style={{ fontSize: 14, color: "#5A5A5A", lineHeight: 1.6, marginBottom: 16 }}>{p.desc}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {p.subjects.map(s => (
                      <span key={s} style={{ fontSize: 12, fontWeight: 500, background: GREEN_LIGHT, color: GREEN_DARK, padding: "4px 12px", borderRadius: 100 }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== NEWS & EVENTS ===== */}
      <section id="news" style={{ background: WHITE, padding: "56px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />News & Events
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, marginBottom: 12 }}>What's Happening at Grace</h2>
          <p style={{ fontSize: 16, color: "#5A5A5A", lineHeight: 1.7, maxWidth: 560, marginBottom: 40 }}>Stay up to date with the latest school news, announcements, and upcoming events.</p>

          <div className="news-grid">
            {/* Main news card */}
            <div style={{ background: GREEN_DARK, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer", transition: "transform 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
              <div style={{ height: 220, overflow: "hidden", position: "relative" }}>
                <img src={img_assembly2} alt="Students at Grace High School" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent, rgba(10,64,32,0.8))" }} />
              </div>
              <div style={{ padding: 24, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8EEDC0", marginBottom: 8 }}>Admissions</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", color: WHITE, marginBottom: 10, lineHeight: 1.3 }}>Admissions Open for All Classes — 2025/2026 Academic Year</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>Grace High School is proud to announce that admissions are now open for all classes from S1 to S6. We welcome students ready to run with a vision and embrace academic excellence and Christian values.</p>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 16 }}>📅 2025 · Grace High School, Gayaza</div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { img: img_assembly3,  cat: "Fellowship",  title: "Inter-School Christian Fellowship", desc: "Annual Gayaza Zone fellowship event hosted at our campus chapel." },
                { img: img_trophy,     cat: "Sports",      title: "Sports Day & Prize Giving",         desc: "Annual sports competitions and awards ceremony for outstanding students." },
                { img: img_exam,       cat: "Academics",   title: "End of Term Exams",                 desc: "All candidates prepare for term-end assessments. Timetable from the office." },
                { img: img_sewing,     cat: "Vocational",  title: "Vocational Skills Exhibition",      desc: "Students showcase their practical skills and entrepreneurial projects." },
              ].map((item, i) => (
                <div key={i} style={{
                  background: OFF_WHITE, borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer",
                  display: "flex", gap: 0, alignItems: "stretch", overflow: "hidden",
                  transition: "border-color 0.2s, transform 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN_MAIN; e.currentTarget.style.transform = "translateX(3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateX(0)"; }}
                >
                  <div style={{ width: 80, flexShrink: 0, overflow: "hidden" }}>
                    <img src={item.img} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: GREEN_MAIN, marginBottom: 3 }}>{item.cat}</div>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: GREEN_DARK, marginBottom: 4, lineHeight: 1.3 }}>{item.title}</h4>
                    <p style={{ fontSize: 12, color: "#5A5A5A", lineHeight: 1.45 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming events */}
          <div style={{ marginTop: 40 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: GREEN_DARK, marginBottom: 20 }}>Upcoming Events</h3>
            <div className="events-grid">
              {[
                { day: "14", month: "July 2025",  title: "New Term Begins",    desc: "Term III — All students report" },
                { day: "22", month: "Aug 2025",   title: "Sports Day",         desc: "Inter-house competitions" },
                { day: "05", month: "Sep 2025",   title: "Parents' Day",       desc: "Open day for parents & guardians" },
                { day: "20", month: "Nov 2025",   title: "End of Year Exams",  desc: "Final assessments — all classes" },
              ].map((ev, i) => (
                <div key={i} style={{
                  background: OFF_WHITE, borderRadius: 8, padding: 16,
                  border: "1px solid rgba(0,0,0,0.08)", textAlign: "center",
                  transition: "transform 0.2s, border-color 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = GREEN_MAIN; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
                >
                  <div style={{ background: GREEN_DARK, borderRadius: 6, padding: 8, marginBottom: 10 }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, color: "#8EEDC0", display: "block", lineHeight: 1 }}>{ev.day}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>{ev.month}</span>
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: GREEN_DARK, marginBottom: 4 }}>{ev.title}</h4>
                  <p style={{ fontSize: 12, color: "#5A5A5A" }}>{ev.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== UPDATES / PARENT NOTICEBOARD ===== */}
      <section id="updates" style={{ background: GREEN_LIGHT, padding: "56px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />Updates for Parents
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, marginBottom: 12 }}>School Updates &amp; Announcements</h2>
          <p style={{ fontSize: 16, color: "#4A5A50", lineHeight: 1.7, maxWidth: 620, marginBottom: 40 }}>
            This is our official noticeboard for parents and guardians. Check here regularly for the latest information on school programmes, fees, term dates, and important announcements.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { date: "02 Jun 2026", cat: "Programmes", tag: "PROGRAMME", title: "Term II Co-Curricular Programme Released", body: "The full schedule for Music, Dance & Drama, sports, and the vocational skills exhibition is now available. Parents are encouraged to support their children's participation." },
              { date: "28 May 2026", cat: "Fees", tag: "FEES", title: "Term II Fees Payment Reminder", body: "Kindly clear all outstanding school fees before the mid-term break. Bank details and payment plans are available at the bursar's office." },
              { date: "20 May 2026", cat: "Academics", tag: "ACADEMICS", title: "Mid-Term Examinations Timetable", body: "Mid-term assessments for all classes (S1–S6) will run during the third week. The detailed timetable has been shared with class teachers." },
              { date: "12 May 2026", cat: "Events", tag: "EVENT", title: "Parents' Visitation Day — Save the Date", body: "Our next Visitation Day is scheduled for the first Saturday of next month. Come meet your child's teachers and tour the campus." },
              { date: "05 May 2026", cat: "General", tag: "GENERAL", title: "New Library Resources & Science Equipment", body: "Thanks to your continued support, the school has acquired new textbooks and laboratory equipment to enrich our students' learning experience." },
            ].map((u, i) => (
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
            ))}
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
        </div>
      </section>

      {/* ===== CAMPUS GALLERY ===== */}
      <section id="campus" style={{ background: OFF_WHITE, padding: "56px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />Campus Life
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, marginBottom: 12 }}>Life at Grace High School</h2>
          <p style={{ fontSize: 16, color: "#5A5A5A", lineHeight: 1.7, maxWidth: 560, marginBottom: 24 }}>Our 28-acre campus near Kasangati, Gayaza provides a serene, green environment ideal for learning, worship, and growth.</p>

          {/* Filter buttons */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { key: "all",          label: "All Photos" },
              { key: "campus",       label: "🏫 Campus" },
              { key: "academics",    label: "📚 Academics" },
              { key: "vocational",   label: "🔧 Vocational" },
              { key: "events",       label: "🎉 Events" },
              { key: "achievements", label: "🏆 Achievements" },
            ].map(btn => (
              <button key={btn.key} onClick={() => setGalFilter(btn.key)} style={{
                padding: "8px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                cursor: "pointer",
                background: galleryFilter === btn.key ? GREEN_DARK : "transparent",
                color: galleryFilter === btn.key ? WHITE : "#5A5A5A",
                border: `1.5px solid ${galleryFilter === btn.key ? GREEN_DARK : "rgba(0,0,0,0.1)"}`,
                transition: "all 0.2s",
              }}>{btn.label}</button>
            ))}
          </div>

          {/* Sliding photo carousel — moves continuously, pauses on hover */}
          <div className="marquee">
            <div className="marquee-track" style={{ animationDuration: `${Math.max(filtered.length * 5, 24)}s` }}>
              {[...filtered, ...filtered].map((item, i) => (
                <div key={i} className="marquee-card" onClick={() => setLightbox(item.src)}>
                  <img src={item.src} alt={item.label} />
                  <div className="gallery-caption">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== VIDEOS ===== */}
      <section id="videos" style={{ background: OFF_WHITE, padding: "56px 5%" }}>
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
      <section id="resources" style={{ background: WHITE, padding: "56px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />Student Resources
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, marginBottom: 12 }}>Past Papers &amp; Holiday Work</h2>
          <p style={{ fontSize: 16, color: "#5A5A5A", lineHeight: 1.7, maxWidth: 640, marginBottom: 40 }}>
            Download past examination papers and holiday assignments shared by the school. Click any item to download it to your device.
          </p>

          {resLoading ? (
            <p style={{ color: "#5A5A5A" }}>Loading resources…</p>
          ) : (
            ([
              { key: "past_paper" as const, label: "Past Papers", icon: "📄" },
              { key: "holiday_work" as const, label: "Holiday Work", icon: "📝" },
            ]).map(group => {
              const items = resources.filter(r => r.category === group.key);
              return (
                <div key={group.key} style={{ marginBottom: 44 }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: GREEN_DARK, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{group.icon}</span>{group.label}
                  </h3>
                  {items.length === 0 ? (
                    <p style={{ fontSize: 14, color: "#8A8A8A", fontStyle: "italic" }}>No {group.label.toLowerCase()} have been uploaded yet. Please check back soon.</p>
                  ) : (
                    <div className="resources-grid">
                      {items.map(r => (
                        <a
                          key={r.id}
                          href={`${API}/storage${r.objectPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "block", background: OFF_WHITE, borderRadius: 12, padding: 20,
                            border: "1px solid rgba(0,0,0,0.08)", textDecoration: "none",
                            transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(10,64,32,0.12)"; e.currentTarget.style.borderColor = GREEN_MAIN; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: GREEN_MAIN }}>{r.subject}</span>
                            <span style={{ fontSize: 11, color: "#8A8A8A", whiteSpace: "nowrap" }}>{r.level}</span>
                          </div>
                          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: GREEN_DARK, lineHeight: 1.3, marginBottom: 12 }}>{r.title}</h4>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: GREEN_MAIN }}>⬇ Download</span>
                            <span style={{ fontSize: 11, color: "#A0A0A0" }}>{[r.term, formatSize(r.fileSize)].filter(Boolean).join(" · ")}</span>
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
      <section id="staff" style={{ background: WHITE, padding: "56px 5%" }}>
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

          {/* Staff group photo */}
          <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 40, position: "relative" }}>
            <img
              src={img_staff}
              alt="Grace High School Staff"
              style={{ width: "100%", height: 420, objectFit: "cover", objectPosition: "center top", display: "block" }}
            />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: `linear-gradient(transparent, rgba(10,64,32,0.88))`,
              padding: "48px 32px 28px",
              display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
            }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: WHITE, marginBottom: 4 }}>
                  Our Teaching Team
                </h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
                  Qualified, passionate educators — Gayaza campus
                </p>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
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

          {/* Department highlights */}
          <div className="staff-depts">
            {[
              { icon: "🔬", dept: "Sciences",     desc: "Biology, Chemistry, Physics — hands-on lab teaching" },
              { icon: "📐", dept: "Mathematics",  desc: "Pure Maths, Applied Maths and Statistics" },
              { icon: "📖", dept: "Humanities",   desc: "English, History, Geography, CRE, SST" },
              { icon: "💼", dept: "Business & ICT", desc: "Entrepreneurship, Economics, Computer Studies" },
            ].map((d, i) => (
              <div key={i} style={{
                padding: "22px 20px", background: OFF_WHITE, borderRadius: 10,
                borderTop: `3px solid ${GREEN_MAIN}`, transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <span style={{ fontSize: 28, display: "block", marginBottom: 10 }}>{d.icon}</span>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: GREEN_DARK, marginBottom: 6 }}>{d.dept}</h4>
                <p style={{ fontSize: 13, color: "#5A5A5A", lineHeight: 1.55 }}>{d.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 28, background: GREEN_LIGHT, borderRadius: 10, padding: "18px 24px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 22 }}>📌</span>
            <p style={{ fontSize: 14, color: GREEN_DARK, lineHeight: 1.6 }}>
              To view the full staff list or enquire about specific departments, contact the school directly at{" "}
              <strong>gracehighschool2000@gmail.com</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section style={{ background: OFF_WHITE, padding: "56px 5%", overflow: "hidden" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />Testimonials
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, marginBottom: 40 }}>What Our Community Says</h2>

          <div style={{ overflow: "hidden" }}>
            <div ref={trackRef} className="testimonials-track">
              {testimonialItems.map((t, i) => (
                <div key={i} className="testimonial-card" style={{
                  background: WHITE, borderRadius: 12, padding: 28,
                  border: "1px solid rgba(0,0,0,0.08)",
                }}>
                  <div style={{ fontSize: 48, color: GREEN_LIGHT, fontFamily: "Georgia, serif", lineHeight: 1, marginBottom: 8 }}>"</div>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: "#1A1A1A", marginBottom: 20, fontStyle: "italic" }}>{t.text}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%",
                      background: GREEN_DARK, display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, color: "#8EEDC0", fontSize: 15, flexShrink: 0,
                    }}>{t.init}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#5CAF50", marginBottom: 2 }}>★★★★★</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: GREEN_DARK }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: "#5A5A5A" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
            <button onClick={() => setTestiIdx(Math.max(0, testitIdx - 1))} style={{
              width: 40, height: 40, borderRadius: "50%", border: "1.5px solid rgba(0,0,0,0.1)",
              background: WHITE, cursor: "pointer", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = GREEN_DARK; e.currentTarget.style.color = WHITE; }}
            onMouseLeave={e => { e.currentTarget.style.background = WHITE; e.currentTarget.style.color = "#1A1A1A"; }}
            >←</button>
            <button onClick={() => setTestiIdx(Math.min(testimonialItems.length - 1, testitIdx + 1))} style={{
              width: 40, height: 40, borderRadius: "50%", border: "1.5px solid rgba(0,0,0,0.1)",
              background: WHITE, cursor: "pointer", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = GREEN_DARK; e.currentTarget.style.color = WHITE; }}
            onMouseLeave={e => { e.currentTarget.style.background = WHITE; e.currentTarget.style.color = "#1A1A1A"; }}
            >→</button>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 12 }}>
              {testimonialItems.map((_, i) => (
                <div key={i} onClick={() => setTestiIdx(i)} style={{
                  width: i === testitIdx ? 20 : 8,
                  height: 8, borderRadius: 4,
                  background: i === testitIdx ? GREEN_MAIN : "rgba(0,0,0,0.15)",
                  cursor: "pointer", transition: "all 0.2s",
                }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== ADMISSIONS ===== */}
      <section id="admissions" style={{ background: GREEN_DARK, padding: "56px 5%" }}>
        <div className="admissions-grid">
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8EEDC0", display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />Admissions
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: WHITE, marginBottom: 12 }}>{text("admissions_heading", "Join the Grace Family")}</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 36 }}>{text("admissions_intro", "Admissions are currently open for all classes — S1 through S6. We welcome students and families who share our commitment to faith, excellence, and vision.")}</p>

            {/* Admission steps */}
            <div style={{ display: "grid", gap: 14 }}>
              {admissionItems.map(s => (
                <div key={s.step} style={{
                  display: "flex", gap: 16, alignItems: "flex-start", padding: "18px 20px",
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

            {/* Boarding image */}
            <div style={{ borderRadius: 10, overflow: "hidden", marginTop: 28, height: 180 }}>
              <img src={img_dorm} alt="Dormitory" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>

          {/* Contact form */}
          <div style={{ background: WHITE, borderRadius: 12, padding: 32 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", color: GREEN_DARK, marginBottom: 24 }}>Enquire / Apply Now</h3>
            {formSent ? (
              <div style={{ background: GREEN_LIGHT, border: `1px solid ${GREEN_MAIN}`, borderRadius: 8, padding: 20, textAlign: "center", fontSize: 14, color: GREEN_MAIN, fontWeight: 500 }}>
                ✅ Thank you! We'll be in touch within 1–2 business days.
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); setFormSent(true); }}>
                <div className="form-name-row">
                  {[["First Name","text"],["Surname","text"]].map(([lbl, type]) => (
                    <div key={lbl} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5A5A", letterSpacing: "0.05em", textTransform: "uppercase" }}>{lbl}</label>
                      <input required type={type} placeholder={lbl} style={{
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
                  ["Phone / WhatsApp", "tel",   "E.g. +256 700 000000"],
                  ["Email Address",    "email", "yourname@example.com"],
                ].map(([lbl, type, ph]) => (
                  <div key={lbl} style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5A5A", letterSpacing: "0.05em", textTransform: "uppercase" }}>{lbl}</label>
                    <input type={type} placeholder={ph as string} style={{
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
                  <select required style={{
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
                  <textarea rows={3} placeholder="Any questions for us?" style={{
                    padding: "11px 14px", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: 6,
                    fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#1A1A1A",
                    background: OFF_WHITE, outline: "none", resize: "vertical",
                  }}
                  onFocus={e => (e.target.style.borderColor = GREEN_MAIN)}
                  onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                  />
                </div>
                <button type="submit" style={{
                  width: "100%", background: GREEN_MAIN, color: WHITE,
                  padding: 14, border: "none", borderRadius: 6, fontWeight: 700, fontSize: 15,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = GREEN_DARK)}
                onMouseLeave={e => (e.currentTarget.style.background = GREEN_MAIN)}
                >Submit Enquiry</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ===== AFFILIATIONS ===== */}
      <section style={{ background: WHITE, padding: "56px 5%", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
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
      <section id="contact" style={{ background: OFF_WHITE, padding: "56px 5%" }}>
        <div className="contact-grid">
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ width: 34, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, display: "block", borderRadius: 2 }} />Contact Us
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, marginBottom: 12 }}>Get in Touch</h2>
            <p style={{ fontSize: 16, color: "#5A5A5A", lineHeight: 1.7, maxWidth: 480, marginBottom: 36 }}>
              We are always open. Whether you are a prospective family, a student, or a partner — reach out to us and we will respond promptly.
            </p>
            <div style={{ display: "grid", gap: 16 }}>
              {[
                { icon: "📍", label: "Address",    val: "Namavundu Road, Gayaza, Wakiso District, Uganda" },
                { icon: "📧", label: "Email",      val: "gracehighschool2000@gmail.com" },
                { icon: "📍", label: "Landmark",   val: "Near Kasangati Town, Gayaza Zone" },
                { icon: "🕐", label: "Hours",      val: "Always Open — Mon to Sat, 7am – 6pm" },
              ].map((c, i) => (
                <div key={i} style={{
                  display: "flex", gap: 14, alignItems: "flex-start",
                  padding: "18px 20px", background: WHITE, borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.08)",
                }}>
                  <div style={{
                    width: 40, height: 40, flexShrink: 0, background: GREEN_LIGHT,
                    borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: GREEN_MAIN, marginBottom: 3 }}>{c.label}</div>
                    <div style={{ fontSize: 14, color: "#1A1A1A" }}>{c.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {/* Map-like campus photo */}
            <div style={{ borderRadius: 12, overflow: "hidden", height: 260, marginBottom: 20 }}>
              <img src={img_campus} alt="Campus grounds" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ background: GREEN_DARK, borderRadius: 12, padding: 24, color: WHITE }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#8EEDC0", marginBottom: 14 }}>Find Us on Campus</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 16 }}>
                Grace High School is located near Kasangati Town along Namavundu Road, Gayaza, in Wakiso District. Our 28-acre campus is easily accessible from Kampala via Gayaza Road.
              </p>
              <a href="mailto:gracehighschool2000@gmail.com" style={{
                display: "inline-block", background: "#4CAF82", color: GREEN_DARK,
                padding: "11px 24px", borderRadius: 6, fontWeight: 700, fontSize: 14,
                textDecoration: "none",
              }}>Email Us Now</a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: GREEN_DARK, borderTop: "1px solid rgba(255,255,255,0.08)", padding: "48px 5% 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: WHITE, padding: 3, boxShadow: "0 0 0 2px rgba(76,175,130,0.4)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}><img src={schoolLogo} alt="Grace High School Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
                <div style={{ color: WHITE }}>
                  <strong style={{ display: "block", fontSize: 13, fontWeight: 600 }}>Grace High School</strong>
                  <span style={{ fontSize: 11, color: "#8EEDC0" }}>Gayaza, Uganda</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                A Christian-founded mixed secondary school on a 28-acre campus in Gayaza, producing leaders of tomorrow.
              </p>
            </div>
            {[
              { title: "Quick Links", links: ["About Us","Programmes","News & Events","Campus Gallery","Admissions","Contact"] },
              { title: "Academics",   links: ["Ordinary Level (S1–S4)","Advanced Level (S5–S6)","Vocational Skills","Extracurricular","Results & Achievements"] },
              { title: "Connect",     links: ["gracehighschool2000@gmail.com","Namavundu Road, Gayaza","Wakiso District, Uganda","Near Kasangati Town","Always Open 🟢"] },
            ].map((col, i) => (
              <div key={i}>
                <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8EEDC0", marginBottom: 16 }}>{col.title}</h4>
                <ul style={{ listStyle: "none", display: "grid", gap: 8 }}>
                  {col.links.map(link => (
                    <li key={link}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", cursor: "pointer", transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#8EEDC0")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                      >{link}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>© {new Date().getFullYear()} Grace High School – Gayaza. All rights reserved.</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>"Run With a Vision" — Isaiah 40:31</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

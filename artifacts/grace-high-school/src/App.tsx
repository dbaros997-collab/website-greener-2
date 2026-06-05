import { useState, useEffect, useRef } from "react";

import schoolLogo from "@assets/school_logo_transparent.png";
import img_computerlab from "@assets/481077779_1149890966830658_5041740680217479426_n_1780399993019.jpg";
import img_library from "@assets/481080206_1149891370163951_6952293395059892096_n_1780400223690.jpg";
import img_staff from "@assets/480812359_1141749094311512_4566229955265803529_n_1780400736314.jpg";
import img_assembly1 from "@assets/483102123_1154996392986782_6972322137511794977_n_1780398909145.jpg";
import img_campus_hero from "@assets/IMG_9926_1780652934166.jpg";
import img_alevel from "@assets/3@_(7)_1780653886082.JPG";
import img_science from "@assets/IMG_0144_-_Copy_1780654332068.jpg";
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
import img_campus from "@assets/481963454_1149996663486755_4958988250341272359_n_1780398909154.jpg";
import img_food from "@assets/481964449_1149999646819790_6834026191577424925_n_1780398909154.jpg";

const GREEN_DARK  = "#0A4020";
const GREEN_MAIN  = "#1A6B3C";
const GREEN_MID   = "#237A48";
const GREEN_LIGHT = "#E8F5EE";
const WHITE       = "#FFFFFF";
const OFF_WHITE   = "#F5FAF7";

export default function App() {
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [lightbox, setLightbox]       = useState<string | null>(null);
  const [testitIdx, setTestiIdx]      = useState(0);
  const [galleryFilter, setGalFilter] = useState("all");
  const [formSent, setFormSent]       = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
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
    { src: img_alevel,    label: "A-Level Students — S5 & S6 Class", cat: "campus", wide: true },
    { src: img_campus_hero, label: "Campus Grounds — 28-Acre Campus, Gayaza", cat: "campus", wide: true },
    { src: img_assembly1, label: "School Assembly — Students Gathered", cat: "events", wide: true },
    { src: img_lab,       label: "Chemistry Lab — Practical Session",   cat: "academics" },
    { src: img_sewing,    label: "Vocational Skills — Tailoring Class", cat: "vocational" },
    { src: img_exam,      label: "Examinations — Silent Study Hall",    cat: "academics" },
    { src: img_welding,   label: "Vocational Skills — Metal Welding",   cat: "vocational", wide: true },
    { src: img_campus,    label: "Campus Grounds — 28 Acres of Green",  cat: "campus" },
    { src: img_trophy,    label: "Award Ceremony — Excellence Recognised", cat: "achievements", wide: true },
    { src: img_dorm,      label: "Dormitory — Boarding Facilities",     cat: "campus" },
    { src: img_waterfilter,label:"Science Outreach — Water Filter Demo",cat: "academics" },
    { src: img_conference, label:"Renewable Energy Conference 2023",    cat: "achievements" },
    { src: img_garden,    label: "Agriculture — Students in the Farm",  cat: "vocational" },
    { src: img_food,      label: "Dining — Wholesome School Meals",     cat: "campus" },
    { src: img_assembly3, label: "Inter-School Event — Gayaza Zone",   cat: "events", wide: true },
    { src: img_excursion, label: "School Trip — Semuliki Hot Springs",  cat: "events" },
    { src: img_media,     label: "Spark TV Feature — Extra-Curricular",cat: "achievements" },
  ];

  const filtered = galleryFilter === "all"
    ? galleryItems
    : galleryItems.filter(g => g.cat === galleryFilter);

  const testimonials = [
    { text: "Grace High School gave me more than grades — it gave me faith, discipline, and purpose. My UACE results opened doors I never imagined.", name: "Katumwa Hannington", role: "UACE 2023 — 20 Points", init: "KH" },
    { text: "The teachers here go beyond the syllabus. They invest in you as a person, not just a student. I feel ready for university and for life.", name: "Ainebyoona Miriam", role: "S6 Graduate, 2024", init: "AM" },
    { text: "As a parent, I have watched my son transform — academically and morally. The Christian foundation at Grace is real, not just on paper.", name: "Mr. Byaruhanga", role: "Parent of S4 Student", init: "BB" },
    { text: "The vocational skills programme taught me tailoring alongside my A-Levels. I already have income while I wait for university admission.", name: "Namutebi Rose", role: "A-Level Graduate, 2024", init: "NR" },
  ];

  const navBg = scrolled
    ? `rgba(10,64,32,0.98)`
    : `rgba(10,64,32,0.95)`;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: OFF_WHITE, color: "#1A1A1A", overflowX: "hidden" }}>

      {/* ===== LIGHTBOX ===== */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Full size" />
        </div>
      )}

      {/* ===== NAV ===== */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: navBg, backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `0 5%`, height: scrolled ? "58px" : "68px",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        transition: "height 0.3s, background 0.3s",
      }}>
        <a href="#" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: WHITE, padding: 3,
            boxShadow: "0 0 0 2px rgba(76,175,130,0.5)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}><img src={schoolLogo} alt="Grace High School Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
          <div style={{ color: WHITE }}>
            <strong style={{ display: "block", fontSize: 14, fontWeight: 600, letterSpacing: "0.03em" }}>Grace High School</strong>
            <span style={{ fontSize: 11, color: "#8EEDC0", letterSpacing: "0.08em", textTransform: "uppercase" }}>Gayaza, Uganda</span>
          </div>
        </a>

        {/* Desktop nav */}
        <ul style={{ display: "flex", gap: "1.6rem", listStyle: "none", alignItems: "center" }}
            className="hidden md:flex">
          {["about","programmes","news","campus","admissions","contact"].map(id => (
            <li key={id}>
              <button onClick={() => scrollTo(id)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 500,
                letterSpacing: "0.02em", textTransform: "capitalize",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#8EEDC0")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
              >{id.charAt(0).toUpperCase() + id.slice(1)}</button>
            </li>
          ))}
          <li>
            <button onClick={() => scrollTo("admissions")} style={{
              background: "#4CAF82", color: GREEN_DARK,
              padding: "8px 20px", borderRadius: 4, fontWeight: 600,
              border: "none", cursor: "pointer", fontSize: 14,
            }}>Apply Now</button>
          </li>
        </ul>

        {/* Hamburger */}
        <button
          className="flex md:hidden flex-col gap-1.5 p-1.5 bg-transparent border-0 cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {[0,1,2].map(i => (
            <span key={i} style={{ width: 24, height: 2, background: "white", borderRadius: 2, display: "block" }} />
          ))}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: "fixed", top: 68, left: 0, right: 0, zIndex: 999,
          background: GREEN_DARK, padding: "20px 5% 28px",
          borderBottom: `2px solid #4CAF82`,
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          {["about","programmes","news","campus","admissions","contact"].map(id => (
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
        minHeight: "100vh", background: GREEN_DARK,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden", padding: "100px 5% 60px",
      }}>
        {/* Background image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${img_campus_hero})`,
          backgroundSize: "cover", backgroundPosition: "center top",
          opacity: 0.72,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(circle at 20% 50%, rgba(26,107,60,0.25) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(76,175,130,0.1) 0%, transparent 40%)`,
        }} />

        <div className="hero-grid">

          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(76,175,130,0.15)", border: "1px solid rgba(76,175,130,0.4)",
              borderRadius: 100, padding: "6px 16px",
              fontSize: 12, fontWeight: 600, color: "#8EEDC0",
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 24,
            }}>✦ Gayaza, Wakiso District — Uganda</div>

            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2.4rem, 4vw, 3.6rem)",
              color: WHITE, lineHeight: 1.15, marginBottom: 20,
            }}>
              Run With a{" "}
              <em style={{ fontStyle: "italic", color: "#8EEDC0" }}>Vision</em>
              <br />at Grace High School
            </h1>

            <p style={{ fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.75)", marginBottom: 36, maxWidth: 480 }}>
              A Christian-founded mixed secondary school on a 28-acre campus in Gayaza — producing morally upright, academically excellent, Christ-like leaders of tomorrow.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button onClick={() => scrollTo("admissions")} style={{
                background: "#4CAF82", color: GREEN_DARK,
                padding: "13px 28px", borderRadius: 4, fontWeight: 600, fontSize: 15,
                border: "none", cursor: "pointer", transition: "background 0.2s, transform 0.1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#2ECC71"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#4CAF82"; e.currentTarget.style.transform = "translateY(0)"; }}
              >Apply Now</button>

              <button onClick={() => scrollTo("about")} style={{
                background: "transparent", color: WHITE,
                border: "1.5px solid rgba(255,255,255,0.4)",
                padding: "13px 28px", borderRadius: 4, fontWeight: 500, fontSize: 15,
                cursor: "pointer", transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#4CAF82"; e.currentTarget.style.color = "#8EEDC0"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.color = WHITE; }}
              >Learn More</button>
            </div>
          </div>

          {/* Hero crest — free-standing, no circle */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="hero-crest" style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
              animation: "crest-float 6s ease-in-out infinite",
            }}>
              {/* Glow backdrop */}
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", inset: -24,
                  background: "radial-gradient(circle, rgba(76,175,130,0.25) 0%, transparent 70%)",
                  borderRadius: "50%",
                }} />
                <img
                  src={schoolLogo}
                  alt="Grace High School Crest"
                  style={{
                    width: 340, height: 340,
                    objectFit: "contain",
                    filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 28px rgba(142,237,192,0.5)) brightness(1.05)",
                    position: "relative",
                  }}
                  className="hero-crest"
                />
              </div>
              {/* School name under crest */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 6,
                }}>
                  <span style={{ width: 32, height: 1, background: "rgba(142,237,192,0.5)", display: "block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8EEDC0" }}>Est. 2000</span>
                  <span style={{ width: 32, height: 1, background: "rgba(142,237,192,0.5)", display: "block" }} />
                </div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: WHITE, letterSpacing: "0.06em", textTransform: "uppercase" }}>Grace High School</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 3 }}>Gayaza · Wakiso District · Uganda</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TICKER ===== */}
      <div style={{ background: GREEN_MAIN, overflow: "hidden", padding: "9px 0", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-block", animation: "ticker-scroll 35s linear infinite" }}>
          {["Admissions Open for 2025/2026 — All Classes S1–S6",
            "UACE 2023 — Katumwa Hannington scores 20 Points — Glory Be to God!",
            "Grace High School featured on Spark TV for Extra-Curricular Excellence",
            "Students represent at National Renewable Energy Conference 2023",
            "New Term III begins 14 July 2025 — All students report"
          ].map((msg, i) => (
            <span key={i} style={{ fontSize: 13, fontWeight: 500, color: WHITE, padding: "0 48px", letterSpacing: "0.02em" }}>
              📢 {msg}
            </span>
          ))}
        </div>
      </div>

      {/* ===== STATS BAR ===== */}
      <div style={{ background: GREEN_MAIN, padding: "20px 5%", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="stats-grid">
          {[
            { num: "28", label: "Acre Campus" },
            { num: "S1–S6", label: "All Levels" },
            { num: "UCE", label: "& UACE" },
            { num: "100%", label: "Christian Values" },
            { num: "∞", label: "Opportunities" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: WHITE, display: "block" }}>{s.num}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== ABOUT ===== */}
      <section id="about" style={{ background: WHITE, padding: "80px 5%" }}>
        <div className="about-grid">
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ display: "block", width: 28, height: 2, background: GREEN_MAIN }} />
              About Us
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, lineHeight: 1.2, marginBottom: 16 }}>
              A School Built on Faith, Vision &amp; Excellence
            </h2>
            <p style={{ fontSize: 16, color: "#5A5A5A", lineHeight: 1.7, maxWidth: 560, marginBottom: 28 }}>
              Grace High School – Gayaza is a Christian-founded school focused on producing students who are morally upright and Christ-like leaders of tomorrow.
            </p>

            {/* Mission card */}
            <div style={{ background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_MID} 100%)`, borderRadius: 10, padding: "20px 24px", marginBottom: 28, borderLeft: `4px solid #4CAF82` }}>
              <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8EEDC0", marginBottom: 8 }}>Our Mission</p>
              <p style={{ fontSize: 15, color: WHITE, lineHeight: 1.7, fontStyle: "italic" }}>"Producing students who are morally upright and Christ-like leaders of tomorrow."</p>
              <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>🎓 Tutor / Teacher Services</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>📍 Gayaza-Kasangati, Uganda</span>
                <span style={{ fontSize: 12, color: "#4CAF82", fontWeight: 600 }}>🟢 Always Open</span>
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
                ["Hours", "Always Open 🟢"],
                ["Zone", "Gayaza Zone Schools"],
              ].map(([label, val], i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: 14,
                }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{label}</span>
                  <span style={{ color: label === "Hours" ? "#4CAF82" : WHITE, textAlign: "right", maxWidth: 200 }}>{val}</span>
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
      <section id="programmes" style={{ background: OFF_WHITE, padding: "80px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 28, height: 2, background: GREEN_MAIN, display: "block" }} />Academics
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, lineHeight: 1.2, marginBottom: 16 }}>Our Programmes</h2>
          <p style={{ fontSize: 16, color: "#5A5A5A", lineHeight: 1.7, maxWidth: 560, marginBottom: 48 }}>
            A comprehensive National Curriculum across O-Level and A-Level, complemented by vocational programmes that prepare students for life beyond school.
          </p>

          <div className="programmes-grid">
            {[
              {
                tag: "S1 – S4", title: "Ordinary Level",
                img: img_exam,
                desc: "Four years of broad foundational education leading to the Uganda Certificate of Education (UCE), setting students up for A-Level and beyond.",
                subjects: ["Mathematics","Sciences","English","History","Geography","CRE","SST","Languages"],
              },
              {
                tag: "S5 – S6", title: "Advanced Level",
                img: img_alevel,
                desc: "Two-year advanced programme leading to the Uganda Advanced Certificate of Education (UACE), preparing students for university entrance.",
                subjects: ["Sciences","Arts","Business","ICT","Agriculture","Economics"],
              },
              {
                tag: "Extracurricular", title: "Vocational Skills",
                img: img_sewing,
                desc: "Practical skills training alongside academics, equipping students with capabilities that create real-world opportunities.",
                subjects: ["Entrepreneurship","Life Skills","Sports","Arts & Crafts","Leadership","Welding"],
              },
            ].map((p, i) => (
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
      <section id="news" style={{ background: WHITE, padding: "80px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 28, height: 2, background: GREEN_MAIN, display: "block" }} />News & Events
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

      {/* ===== ACHIEVEMENTS ===== */}
      <section style={{ background: `linear-gradient(135deg, ${GREEN_DARK} 0%, #0E5028 60%, ${GREEN_MID} 100%)`, padding: "80px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8EEDC0", display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 28, height: 2, background: "#8EEDC0", display: "block" }} />Our Achievements
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: WHITE, marginBottom: 12 }}>Excellence in Academics &amp; Beyond</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: 560, marginBottom: 48 }}>
            Our students consistently excel in national examinations, competitions, and national platforms — proving that Grace High School truly produces leaders.
          </p>

          <div className="achievements-outer">
            {/* UACE card */}
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(76,175,130,0.3)", borderRadius: 12, overflow: "hidden" }}>
              <img src={img_uace} alt="UACE 2023 results" style={{ width: "100%", height: 240, objectFit: "cover" }} />
              <div style={{ padding: "20px 24px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8EEDC0", marginBottom: 8 }}>🎓 UACE 2023 — Top Performer</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: WHITE, marginBottom: 8 }}>Katumwa Hannington — 20 Points</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>MTC-A · GEO-A · ENT-A · ICT-4 · GEP-4 · <em style={{ color: "#8EEDC0" }}>Glory Be to God</em></p>
              </div>
            </div>

            <div style={{ display: "grid", gap: 20 }}>
              {[
                { img: img_trophy,    tag: "🏆 Award",            title: "Trophy & Certificate of Excellence", desc: "Students and staff celebrating an award win on the Grace High School campus." },
                { img: img_conference,tag: "🌍 National Conference",title: "Renewable Energy Conference 2023",  desc: "Grace High School student delegates represented at Speke Resort, Kampala." },
                { img: img_media,     tag: "📺 Media Feature",    title: "Featured on Spark TV",              desc: "Grace High School Extra-Curricular Activities covered by national television." },
              ].map((a, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(76,175,130,0.25)", borderRadius: 12, overflow: "hidden", display: "flex" }}>
                  <img src={a.img} alt={a.title} style={{ width: 120, objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8EEDC0", marginBottom: 6 }}>{a.tag}</div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: WHITE, marginBottom: 6 }}>{a.title}</h4>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CAMPUS GALLERY ===== */}
      <section id="campus" style={{ background: OFF_WHITE, padding: "80px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 28, height: 2, background: GREEN_MAIN, display: "block" }} />Campus Life
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

          {/* Gallery grid */}
          <div className="gallery-grid">
            {filtered.map((item, i) => (
              <div key={i} className={`gallery-item${item.wide ? " wide" : ""}`} onClick={() => setLightbox(item.src)}>
                <img src={item.src} alt={item.label} />
                <div className="gallery-caption">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SCHOOL VALUES ===== */}
      <section style={{ background: GREEN_DARK, padding: "80px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8EEDC0", display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 28, height: 2, background: "#8EEDC0", display: "block" }} />Our Values
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: WHITE, marginBottom: 12 }}>What We Stand For</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: 560, marginBottom: 48 }}>Our values guide every aspect of life at Grace High School — from the classroom to the chapel, from the sports field to the community.</p>

          <div className="values-grid">
            {[
              { icon: "✝️", title: "Faith",          desc: "Grounded in Christian teaching, we nurture a deep, personal faith in every student." },
              { icon: "🎓", title: "Excellence",     desc: "We push every student to reach their full academic and personal potential." },
              { icon: "🤝", title: "Integrity",      desc: "Honesty, respect, and moral uprightness are non-negotiable at Grace." },
              { icon: "🌱", title: "Growth",         desc: "Continuous improvement — spiritually, intellectually, and as a community." },
            ].map((v, i) => (
              <div key={i} style={{
                padding: "28px 20px", border: "1px solid rgba(76,175,130,0.2)",
                borderRadius: 10, transition: "background 0.2s, border-color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(76,175,130,0.1)"; e.currentTarget.style.borderColor = "rgba(76,175,130,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(76,175,130,0.2)"; }}
              >
                <span style={{ fontSize: 28, marginBottom: 14, display: "block" }}>{v.icon}</span>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#8EEDC0", marginBottom: 8 }}>{v.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STAFF ===== */}
      <section id="staff" style={{ background: WHITE, padding: "80px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 28, height: 2, background: GREEN_MAIN, display: "block" }} />Our Team
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
      <section style={{ background: OFF_WHITE, padding: "80px 5%", overflow: "hidden" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 28, height: 2, background: GREEN_MAIN, display: "block" }} />Testimonials
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: GREEN_DARK, marginBottom: 40 }}>What Our Community Says</h2>

          <div style={{ overflow: "hidden" }}>
            <div ref={trackRef} className="testimonials-track">
              {testimonials.map((t, i) => (
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
            <button onClick={() => setTestiIdx(Math.min(testimonials.length - 1, testitIdx + 1))} style={{
              width: 40, height: 40, borderRadius: "50%", border: "1.5px solid rgba(0,0,0,0.1)",
              background: WHITE, cursor: "pointer", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = GREEN_DARK; e.currentTarget.style.color = WHITE; }}
            onMouseLeave={e => { e.currentTarget.style.background = WHITE; e.currentTarget.style.color = "#1A1A1A"; }}
            >→</button>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 12 }}>
              {testimonials.map((_, i) => (
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
      <section id="admissions" style={{ background: GREEN_DARK, padding: "80px 5%" }}>
        <div className="admissions-grid">
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8EEDC0", display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ width: 28, height: 2, background: "#8EEDC0", display: "block" }} />Admissions
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: WHITE, marginBottom: 12 }}>Join the Grace Family</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 36 }}>Admissions are currently open for all classes — S1 through S6. We welcome students and families who share our commitment to faith, excellence, and vision.</p>

            {/* Admission steps */}
            <div style={{ display: "grid", gap: 14 }}>
              {[
                { step: 1, title: "Contact the School",   desc: "Call or email us to express interest and get an admissions form." },
                { step: 2, title: "Visit Our Campus",     desc: "Schedule a tour of our 28-acre campus in Gayaza, Wakiso District." },
                { step: 3, title: "Submit Application",   desc: "Complete the form with academic records and personal information." },
                { step: 4, title: "Placement Assessment", desc: "Students may sit a brief assessment to identify the right class." },
                { step: 5, title: "Confirm Enrollment",   desc: "Receive your admission letter, pay fees, and report on opening day." },
              ].map(s => (
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

      {/* ===== CONTACT ===== */}
      <section id="contact" style={{ background: OFF_WHITE, padding: "80px 5%" }}>
        <div className="contact-grid">
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN_MAIN, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ width: 28, height: 2, background: GREEN_MAIN, display: "block" }} />Contact Us
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

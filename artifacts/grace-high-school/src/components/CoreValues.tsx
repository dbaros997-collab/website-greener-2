import type { ReactNode } from "react";
import imgCampus from "@assets/optimized/campus-hero.webp";

const GREEN_DARK = "#0A4020";
const GREEN_MAIN = "#1A6B3C";
const WHITE = "#FFFFFF";
const OFF_WHITE = "#F5FAF7";

interface CoreValue {
  title: string;
  icon: ReactNode;
}

/** Core values adapted from Gayaza High School's published list. */
const CORE_VALUES: CoreValue[] = [
  {
    title: "Godliness",
    // Praying hands
    icon: (
      <>
        <path d="M12 2v2" />
        <path d="M6.5 8.5c0-2 1.5-3.5 3.5-3.5S13.5 6.5 13.5 8.5V14" />
        <path d="M17.5 8.5c0-2-1.5-3.5-3.5-3.5" />
        <path d="M10.5 14v4a1.5 1.5 0 0 0 3 0v-4" />
        <path d="M8 14h8" />
        <path d="M9 18h6" />
        <path d="M10.5 8.5V12" />
        <path d="M13.5 8.5V12" />
      </>
    ),
  },
  {
    title: "Respect",
    // Handshake
    icon: (
      <>
        <path d="m11 17 2 2a1 1 0 1 0 3-3l-3-3" />
        <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
        <path d="m21 3 1 11h-2" />
        <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
        <path d="M3 4h8" />
      </>
    ),
  },
  {
    title: "Integrity",
    // Scale / balance
    icon: (
      <>
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M7 21h10" />
        <path d="M12 3v18" />
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
      </>
    ),
  },
  {
    title: "Time Management",
    // Watch
    icon: (
      <>
        <circle cx="12" cy="12" r="7" />
        <path d="M12 9v4l2.5 1.5" />
        <path d="M16.2 4.2 18 2" />
        <path d="m7.8 4.2-1.8-2.2" />
        <path d="M9 20h6" />
      </>
    ),
  },
  {
    title: "Excellence",
    // Graduation cap
    icon: (
      <>
        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.084a1 1 0 0 0 0 1.838l8.57 3.908a2 2 0 0 0 1.66 0z" />
        <path d="M22 10v6" />
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      </>
    ),
  },
  {
    title: "Perseverance",
    // Chain link
    icon: (
      <>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    ),
  },
];

interface CoreValuesProps {
  onExplore?: () => void;
}

export default function CoreValues({ onExplore }: CoreValuesProps) {
  return (
    <section
      id="values"
      className="reveal"
      style={{ background: OFF_WHITE, padding: "56px 5%" }}
    >
      <div className="values-layout">
        <div className="values-panel">
          <img
            src={imgCampus}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="values-panel-img"
          />
          <div className="values-panel-overlay" />
          <div className="values-panel-content">
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                color: WHITE,
                fontWeight: 700,
                margin: "0 0 16px",
                lineHeight: 1.2,
              }}
            >
              Our School
            </h2>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                color: "rgba(255,255,255,0.92)",
                lineHeight: 1.7,
                margin: "0 0 28px",
                maxWidth: 340,
              }}
            >
              Explore our Christian foundation and warm learning community. A
              place where every student is guided toward academic excellence and
              Christ-like character.
            </p>
            <button
              type="button"
              onClick={onExplore}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "transparent",
                color: WHITE,
                border: "1.5px solid rgba(255,255,255,0.85)",
                borderRadius: 2,
                padding: "12px 22px",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = WHITE;
                e.currentTarget.style.color = GREEN_DARK;
                e.currentTarget.style.borderColor = WHITE;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = WHITE;
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.85)";
              }}
            >
              Explore
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <div className="values-list-wrap">
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.7rem, 2.8vw, 2.2rem)",
              color: GREEN_MAIN,
              fontWeight: 700,
              margin: "0 0 28px",
              lineHeight: 1.2,
            }}
          >
            Our Core Values
          </h2>
          <ul className="values-list">
            {CORE_VALUES.map((value) => (
              <li key={value.title} className="values-list-item">
                <span className="values-list-icon" aria-hidden="true">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {value.icon}
                  </svg>
                </span>
                <span className="values-list-title">{value.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

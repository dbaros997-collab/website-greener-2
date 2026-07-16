import type { ReactNode } from "react";

const GREEN_DARK = "#0A4020";
const GREEN_MAIN = "#1A6B3C";
const WHITE = "#FFFFFF";
const OFF_WHITE = "#F5FAF7";
const GOLD = "#C9A24B";
const GOLD_LIGHT = "#E6C66E";

export interface CoreValue {
  title: string;
  description: string;
  icon: ReactNode;
}

/** Core values adapted from Gayaza High School's published list. */
export const CORE_VALUES: CoreValue[] = [
  {
    title: "Godliness",
    description: "To lead a life according to Christian values.",
    icon: (
      <>
        <path d="M12 2v20" />
        <path d="M5 6h14" />
        <path d="M5 6v8a7 7 0 0 0 14 0V6" />
      </>
    ),
  },
  {
    title: "Respect",
    description:
      "To have respect for self, others, property, and the environment.",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    title: "Integrity",
    description: "To practice honesty in every word and action.",
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
  {
    title: "Time Management",
    description: "To plan for and use time efficiently and effectively.",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
  },
  {
    title: "Excellence",
    description: "To shine in all that we do.",
    icon: (
      <>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </>
    ),
  },
  {
    title: "Perseverance",
    description:
      "To have determination, diligence, and endurance in all aspects of life.",
    icon: (
      <>
        <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
      </>
    ),
  },
];

interface CoreValuesProps {
  values?: CoreValue[];
}

export default function CoreValues({ values = CORE_VALUES }: CoreValuesProps) {
  return (
    <section
      id="values"
      className="reveal"
      style={{ background: OFF_WHITE, padding: "64px 5%" }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: GREEN_MAIN,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                width: 24,
                height: 2,
                background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
                display: "block",
                borderRadius: 2,
              }}
            />
            Our Foundation
            <span
              style={{
                width: 24,
                height: 2,
                background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD})`,
                display: "block",
                borderRadius: 2,
              }}
            />
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
              color: GREEN_DARK,
              lineHeight: 1.2,
              marginBottom: 14,
            }}
          >
            Our Core Values
          </h2>
          <p style={{ fontSize: 16, color: "#4A6655", lineHeight: 1.7 }}>
            The principles that shape character, guide daily life, and prepare
            every student to lead with faith and purpose.
          </p>
        </div>

        <div className="values-grid">
          {values.map((value) => (
            <div
              key={value.title}
              style={{
                background: WHITE,
                border: "1px solid rgba(10,64,32,0.07)",
                borderRadius: 16,
                padding: "30px 24px",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(10,64,32,0.07)",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow =
                  "0 18px 40px rgba(10,64,32,0.14)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(10,64,32,0.07)";
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  margin: "0 auto 18px",
                  borderRadius: 18,
                  background: `linear-gradient(135deg, ${GREEN_MAIN}, ${GREEN_DARK})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: WHITE,
                  boxShadow: "0 8px 18px rgba(26,107,60,0.32)",
                }}
              >
                <svg
                  width="27"
                  height="27"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {value.icon}
                </svg>
              </div>
              <h3
                style={{
                  fontSize: 16.5,
                  fontWeight: 700,
                  color: GREEN_DARK,
                  marginBottom: 8,
                }}
              >
                {value.title}
              </h3>
              <p style={{ fontSize: 13.5, color: "#5A6B60", lineHeight: 1.6 }}>
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

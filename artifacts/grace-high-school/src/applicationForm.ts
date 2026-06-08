import { jsPDF } from "jspdf";

type Level = "S1" | "S5";

const GREEN: [number, number, number] = [10, 64, 32];
const GOLD: [number, number, number] = [201, 162, 75];
const GREY: [number, number, number] = [90, 90, 90];

const SCHOOL_NAME = "GRACE HIGH SCHOOL";
const SCHOOL_TAGLINE = "Run With a Vision";
const SCHOOL_LOCATION = "Namavundu Road, Gayaza, Wakiso District (near Kasangati), Uganda";
const SCHOOL_EMAIL = "gracehighschoolgayaza@gmail.com";

export function generateApplicationForm(level: Level) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = 0;

  // ===== Header band =====
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageW, 32, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 32, pageW, 1.4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(SCHOOL_NAME, pageW / 2, 14, { align: "center" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(230, 198, 110);
  doc.text(`"${SCHOOL_TAGLINE}"`, pageW / 2, 21, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(220, 230, 224);
  doc.text(SCHOOL_LOCATION, pageW / 2, 27, { align: "center" });

  y = 44;

  // ===== Title =====
  const levelLabel = level === "S1" ? "Senior One (S1)" : "Senior Five (S5)";
  doc.setTextColor(...GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("STUDENT APPLICATION FORM", pageW / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(11);
  doc.setTextColor(...GOLD);
  doc.text(`Entry: ${levelLabel}  —  2025/2026 Academic Year`, pageW / 2, y, { align: "center" });
  y += 5;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  // ===== Helpers =====
  const lineH = 9;

  const sectionHeader = (label: string) => {
    doc.setFillColor(...GREEN);
    doc.rect(margin, y - 4, contentW, 6.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(label.toUpperCase(), margin + 2.5, y);
    y += 8;
  };

  const drawUnderline = (x: number, yy: number, w: number) => {
    doc.setDrawColor(170, 170, 170);
    doc.setLineWidth(0.25);
    doc.line(x, yy, x + w, yy);
  };

  // A row of one or more labelled fields that share a line.
  const fieldRow = (fields: { label: string; flex?: number }[]) => {
    const gap = 6;
    const totalFlex = fields.reduce((s, f) => s + (f.flex ?? 1), 0);
    const usableW = contentW - gap * (fields.length - 1);
    let x = margin;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GREY);
    fields.forEach((f) => {
      const w = (usableW * (f.flex ?? 1)) / totalFlex;
      doc.text(f.label, x, y - 1.5);
      drawUnderline(x, y + 2.5, w);
      x += w + gap;
    });
    y += lineH;
  };

  // ===== Section: Student Details =====
  sectionHeader("1. Student's Personal Details");
  fieldRow([{ label: "Surname" }, { label: "First / Other Names", flex: 1.4 }]);
  fieldRow([{ label: "Date of Birth" }, { label: "Gender" }, { label: "Nationality" }]);
  fieldRow([{ label: "Religion / Denomination" }, { label: "Home District" }]);
  fieldRow([{ label: "Residential Address", flex: 1 }]);
  y += 2;

  // ===== Section: Previous School =====
  sectionHeader(
    level === "S1"
      ? "2. Previous School & PLE Performance"
      : "2. Previous School & UCE Performance"
  );
  fieldRow([{ label: "Name of Previous School", flex: 1.6 }, { label: "Year Completed" }]);
  if (level === "S1") {
    fieldRow([{ label: "PLE Index Number" }, { label: "PLE Aggregate (4 best)" }, { label: "Division" }]);
  } else {
    fieldRow([{ label: "UCE Index Number" }, { label: "Year of UCE" }, { label: "No. of Distinctions/Credits" }]);
  }
  y += 2;

  // ===== Section: Subject choices (S5 only) =====
  if (level === "S5") {
    sectionHeader("3. Preferred A-Level Subject Combination");
    fieldRow([{ label: "1st Choice Combination" }, { label: "2nd Choice Combination" }]);
    fieldRow([{ label: "Subsidiary 1" }, { label: "Subsidiary 2" }, { label: "ICT / Sub-Math" }]);
    y += 2;
  }

  // ===== Section: Parent / Guardian =====
  sectionHeader(`${level === "S5" ? "4" : "3"}. Parent / Guardian Details`);
  fieldRow([{ label: "Full Name of Parent / Guardian", flex: 1.6 }, { label: "Relationship" }]);
  fieldRow([{ label: "Telephone / WhatsApp" }, { label: "Email Address", flex: 1.3 }]);
  fieldRow([{ label: "Occupation" }, { label: "Address", flex: 1.3 }]);
  y += 2;

  // ===== Section: Boarding option =====
  sectionHeader(`${level === "S5" ? "5" : "4"}. Boarding Option`);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text("Tick one:", margin, y);
  doc.rect(margin + 18, y - 3, 3.5, 3.5);
  doc.text("Boarder", margin + 23, y);
  doc.rect(margin + 48, y - 3, 3.5, 3.5);
  doc.text("Day Scholar", margin + 53, y);
  y += lineH;

  // ===== Declaration =====
  sectionHeader(`${level === "S5" ? "6" : "5"}. Declaration`);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  const decl =
    "I confirm that the information provided above is true and correct. If admitted, I/my child agrees to abide by the rules, regulations and Christian values of Grace High School.";
  const declLines = doc.splitTextToSize(decl, contentW);
  doc.text(declLines, margin, y);
  y += declLines.length * 4.5 + 6;
  fieldRow([{ label: "Signature of Parent / Guardian" }, { label: "Date" }]);
  y += 2;

  // ===== For Office Use =====
  doc.setFillColor(232, 245, 238);
  const boxTop = y - 4;
  sectionHeader("For Official Use Only");
  fieldRow([{ label: "Admission No." }, { label: "Class / Stream" }, { label: "Date Admitted" }]);
  fieldRow([{ label: "Received By" }, { label: "Approved By (Head Teacher)", flex: 1.3 }]);
  void boxTop;

  // ===== Footer =====
  const footY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(margin, footY - 4, pageW - margin, footY - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREEN);
  doc.text(
    `Return the completed form to the school office.  Enquiries: ${SCHOOL_EMAIL}`,
    pageW / 2,
    footY,
    { align: "center" }
  );

  doc.save(`Grace-High-School-Application-Form-${level}.pdf`);
}

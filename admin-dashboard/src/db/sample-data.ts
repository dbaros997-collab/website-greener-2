import type { AnnouncementInput, EventInput, GalleryInput, StaffInput } from "@/lib/schemas";

const OFFICE = "gracehighschoolgayaza@gmail.com";

export const gallerySeed: GalleryInput[] = [
  {
    title: "Prize-giving ribbon ceremony",
    description:
      "Students receive ribbons on the Gayaza campus after a term of academic and co-curricular effort. Featured for the landing page.",
    category: "ceremonies",
    mediaType: "image",
    mediaUrl: "/seed/gallery-ribbon.webp",
    takenOn: "2026-03-20",
    featured: true,
    status: "published",
  },
  {
    title: "Afternoon in the library",
    description:
      "Quiet reading on the 28-acre campus. The library supports Ordinary and Advanced Level study from Senior One to Senior Six.",
    category: "academics",
    mediaType: "image",
    mediaUrl: "/seed/gallery-library.webp",
    takenOn: "2026-05-12",
    featured: true,
    status: "published",
  },
  {
    title: "Students on the green",
    description: "Campus life between lessons at Grace High School Gayaza, Gayaza-Kasangati, Wakiso.",
    category: "campus_life",
    mediaType: "image",
    mediaUrl: "/seed/gallery-girls.webp",
    takenOn: "2026-06-02",
    featured: true,
    status: "published",
  },
  {
    title: "Gayaza campus hike",
    description: "A supervised hike from the Namavundu Road campus, part of the co-curricular programme.",
    category: "campus_life",
    mediaType: "image",
    mediaUrl: "/seed/gallery-hike.webp",
    takenOn: "2026-04-18",
    featured: false,
    status: "published",
  },
  {
    title: "Community fellowship afternoon",
    description: "Students gather for a campus fellowship and shared meal after a week of lessons.",
    category: "events",
    mediaType: "image",
    mediaUrl: "/seed/gallery-roast.webp",
    takenOn: "2026-08-09",
    featured: false,
    status: "published",
  },
  {
    title: "Grace High School — featured film",
    description:
      "The school film used on the public site. Attach a video file or keep the YouTube link for the landing page.",
    category: "events",
    mediaType: "video",
    mediaUrl: "https://www.youtube.com/watch?v=c6dBmvv4BLQ",
    takenOn: "2026-01-15",
    featured: true,
    status: "published",
  },
  {
    title: "Inter-house field day 2025",
    description: "Archived coverage from the previous house athletics meeting. Kept for the sports archive.",
    category: "sports",
    mediaType: "image",
    mediaUrl: "/seed/gallery-hike.webp",
    takenOn: "2025-10-11",
    featured: false,
    status: "archived",
  },
  {
    title: "Science prep before visitors",
    description: "Hidden from the public gallery while the department reviews the photograph.",
    category: "academics",
    mediaType: "image",
    mediaUrl: "/seed/gallery-library.webp",
    takenOn: "2026-09-03",
    featured: false,
    status: "hidden",
  },
];

export const announcementSeed: AnnouncementInput[] = [
  {
    title: "Term III fees clearance before examinations",
    body: `Please clear **Term III school fees** before the end-of-term examinations.

- Bank slips can be presented at the bursar's office on the Gayaza campus
- Payment plans already agreed should be honoured before 14 November 2026
- Questions go to the school office at gracehighschoolgayaza@gmail.com

_Grace High School Gayaza — Namavundu Road, Gayaza-Kasangati._`,
    priority: "urgent",
    status: "published",
    publishAt: "2026-11-01T06:00:00.000Z",
  },
  {
    title: "End-of-term examination timetable, S1–S6",
    body: `Mid-term and end-of-term assessments for **all classes (S1–S6)** run from 16 November.

## What to bring
- A complete set of stationery
- The school identity card
- A revised subject list from the class teacher

The detailed rooming list is with Directors of Studies and class teachers.`,
    priority: "general",
    status: "published",
    publishAt: "2026-10-28T06:00:00.000Z",
  },
  {
    title: "Parents' visitation day — save the date",
    body: `Our next visitation day is **Saturday 5 December 2026** on the Gayaza campus.

Parents and guardians can meet subject teachers, walk the academic block, and speak with the careers desk. Day and boarding families are both welcome.`,
    priority: "general",
    status: "published",
    publishAt: "2026-11-02T06:00:00.000Z",
  },
  {
    title: "Term III newsletter",
    body: `The Term III newsletter collects examination guidance, reporting dates for Term I 2027, and a short note from the Head Teacher's office.

This notice is scheduled. It stays off the live feed until the publish date.`,
    priority: "newsletter",
    status: "published",
    publishAt: "2026-11-20T06:00:00.000Z",
  },
  {
    title: "Carol service order of service",
    body: `Draft copy for the end-of-term carol service. The chaplaincy will confirm hymns and the student readers before this is published.`,
    priority: "general",
    status: "draft",
    publishAt: "2026-12-01T06:00:00.000Z",
  },
  {
    title: "Term II co-curricular programme",
    body: `The Term II schedule for Music, Dance and Drama, sport, and the vocational skills exhibition has closed. This notice is kept in the archive for parents who still need the record.`,
    priority: "newsletter",
    status: "archived",
    publishAt: "2026-06-02T06:00:00.000Z",
  },
];

export const eventSeed: EventInput[] = [
  {
    title: "Candidates' briefing",
    description: "Briefing for UCE and UACE candidates on conduct, stationery, and reporting time.",
    eventType: "exams",
    venue: "Main Hall, Gayaza campus",
    startsAt: "2026-10-09T05:00:00.000Z",
    endsAt: "2026-10-09T08:00:00.000Z",
    audiences: ["students", "parents"],
    status: "completed",
  },
  {
    title: "End of Term III examinations",
    description: "Examinations for Senior One through Senior Six. Students report to the academic block each morning.",
    eventType: "exams",
    venue: "Examination rooms, academic block",
    startsAt: "2026-11-16T05:00:00.000Z",
    endsAt: "2026-11-27T13:00:00.000Z",
    audiences: ["students", "parents"],
    status: "scheduled",
  },
  {
    title: "Term III ends",
    description: "Students depart after clearance with class teachers, the bursar, and boarding staff.",
    eventType: "term_end",
    venue: "Front court, Namavundu Road campus",
    startsAt: "2026-12-04T06:00:00.000Z",
    endsAt: "2026-12-04T12:00:00.000Z",
    audiences: ["parents", "students"],
    status: "scheduled",
  },
  {
    title: "Parents' visitation day",
    description: "Meet teachers, tour the campus, and speak with the careers desk.",
    eventType: "open_day",
    venue: "Main Hall and academic block",
    startsAt: "2026-12-05T06:00:00.000Z",
    endsAt: "2026-12-05T12:00:00.000Z",
    audiences: ["parents", "students", "public"],
    status: "scheduled",
  },
  {
    title: "Term I 2027 reporting",
    description: "All students report for the new academic year. Admissions remain open for S1–S6.",
    eventType: "term_start",
    venue: "Gayaza campus",
    startsAt: "2027-02-02T05:00:00.000Z",
    endsAt: "2027-02-02T15:00:00.000Z",
    audiences: ["parents", "students"],
    status: "scheduled",
  },
  {
    title: "Sports Day",
    description: "Inter-house athletics on the school field. Families and guests are welcome.",
    eventType: "sports_day",
    venue: "Sports field, Gayaza campus",
    startsAt: "2027-02-20T05:00:00.000Z",
    endsAt: "2027-02-20T13:00:00.000Z",
    audiences: ["students", "parents", "public"],
    status: "scheduled",
  },
  {
    title: "Open Day",
    description: "A public open morning for families considering Senior One or Senior Five entry.",
    eventType: "open_day",
    venue: "Chapel grounds and Main Hall",
    startsAt: "2027-03-14T05:00:00.000Z",
    endsAt: "2027-03-14T12:00:00.000Z",
    audiences: ["public", "parents"],
    status: "scheduled",
  },
  {
    title: "Inter-school debate friendly",
    description: "Cancelled after the visiting school asked to move the fixture to Term I.",
    eventType: "other",
    venue: "Main Hall, Gayaza campus",
    startsAt: "2026-11-21T08:00:00.000Z",
    endsAt: "2026-11-21T11:00:00.000Z",
    audiences: ["students", "public"],
    status: "cancelled",
  },
];

export const staffSeed: StaffInput[] = [
  {
    name: "Head Teacher's Office",
    title: "Head Teacher",
    department: "Administration",
    bio: "Grace High School Gayaza is a Christian-founded mixed secondary school on a 28-acre campus in Gayaza. The Head Teacher's office welcomes families who share the school's commitment to faith, excellence, and moral leadership.",
    photoUrl: "",
    email: OFFICE,
    phone: "",
    staffGroup: "administration",
    visible: true,
  },
  {
    name: "Namuyomba Viola",
    title: "Director of Studies",
    department: "Academics",
    bio: "Director of Studies at Grace High School Gayaza, leading the academic programme from Senior One through Senior Six, including UCE and UACE.",
    photoUrl: "/seed/viola.webp",
    email: "",
    phone: "",
    staffGroup: "teaching",
    visible: true,
  },
  {
    name: "Mugerwa Denis",
    title: "Dean of Students",
    department: "Student Affairs",
    bio: "Dean of Students, responsible for student welfare, discipline, and daily campus life at Gayaza.",
    photoUrl: "/seed/dean-students.webp",
    email: "",
    phone: "",
    staffGroup: "teaching",
    visible: true,
  },
  {
    name: "Nakabiito Linda",
    title: "Careers Mistress",
    department: "Guidance & Careers",
    bio: "Careers Mistress, guiding students on subject combinations, tertiary pathways, and vocational skills alongside A-Level study.",
    photoUrl: "/seed/careers-mistress.webp",
    email: "",
    phone: "",
    staffGroup: "teaching",
    visible: true,
  },
  {
    name: "Bursar's Office",
    title: "Bursar",
    department: "Finance",
    bio: "School fees, payment plans, and clearance are handled at the bursar's office. Parents should bring the bank slip when paying on campus.",
    photoUrl: "",
    email: OFFICE,
    phone: "",
    staffGroup: "administration",
    visible: true,
  },
];

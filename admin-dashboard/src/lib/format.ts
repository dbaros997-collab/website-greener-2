const KAMPALA = "Africa/Kampala";

export function formatDate(iso: string) {
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00+03:00`);
  return new Intl.DateTimeFormat("en-UG", {
    timeZone: KAMPALA,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-UG", {
    timeZone: KAMPALA,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-UG", {
    timeZone: KAMPALA,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function formatMonth(iso: string) {
  return new Intl.DateTimeFormat("en-UG", {
    timeZone: KAMPALA,
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function toDateTimeInput(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: KAMPALA,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function fromDateTimeInput(value: string) {
  return new Date(`${value}:00+03:00`).toISOString();
}

export function formatRelative(iso: string, now = Date.now()) {
  const delta = Math.round((now - new Date(iso).getTime()) / 1000);
  if (delta < 15) return "just now";
  if (delta < 60) return `${delta} seconds ago`;
  const minutes = Math.round(delta / 60);
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return days === 1 ? "yesterday" : `${days} days ago`;
  return formatDate(iso);
}

export function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "G";
}

export function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    if (parsed.hostname.endsWith("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2] ?? null;
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

export function mediaPoster(mediaType: string, mediaUrl: string) {
  if (mediaType === "image") return mediaUrl;
  const id = youtubeId(mediaUrl);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

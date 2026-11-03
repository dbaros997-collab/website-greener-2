import {
  AUDIENCE_LABELS,
  EVENT_TYPE_LABELS,
  GALLERY_CATEGORY_LABELS,
  PRIORITY_LABELS,
  STAFF_GROUP_LABELS,
} from "@/lib/constants";
import { formatDate, formatDateTime, initials, mediaPoster } from "@/lib/format";
import { loadPublicFeed } from "@/lib/public-content";
import { renderRichText } from "@/lib/rich-text";

export const metadata = { title: "Landing feed" };
export const dynamic = "force-dynamic";

export default async function PreviewPage() {
  const feed = await loadPublicFeed();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700 dark:text-gold-300">Public feed</p>
        <h1 className="mt-1 font-serif text-3xl text-forest-900 dark:text-white sm:text-4xl">What the website can publish</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70 dark:text-emerald-100/70">
          Featured pictures, live notices, upcoming events, and visible staff for {feed.school}. The machine-readable copy is at{" "}
          <a className="font-semibold underline" href="/api/public/content?raw=1">/api/public/content?raw=1</a>.
        </p>
      </header>

      <section>
        <h2 className="font-serif text-2xl text-forest-900 dark:text-white">Landing page</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {feed.landingGallery.map((item) => {
            const poster = mediaPoster(item.mediaType, item.mediaUrl);
            const category = item.category as keyof typeof GALLERY_CATEGORY_LABELS;
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-forest-900/10 bg-white dark:border-white/10 dark:bg-[#102117]">
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={poster} alt="" className="h-48 w-full object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-forest-900 text-sm text-gold-300">Video</div>
                )}
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700 dark:text-gold-300">
                    {GALLERY_CATEGORY_LABELS[category] ?? item.category} · {formatDate(item.takenOn)}
                  </p>
                  <h3 className="mt-1 font-serif text-xl text-forest-900 dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-ink/70 dark:text-emerald-100/70">{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl text-forest-900 dark:text-white">Live notices</h2>
        {feed.announcements.map((item) => {
          const priority = item.priority as keyof typeof PRIORITY_LABELS;
          return (
            <article key={item.id} className="rounded-2xl border border-forest-900/10 bg-white p-5 dark:border-white/10 dark:bg-[#102117]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700 dark:text-gold-300">
                {PRIORITY_LABELS[priority] ?? item.priority} · {formatDateTime(item.publishAt)}
              </p>
              <h3 className="mt-1 font-serif text-2xl text-forest-900 dark:text-white">{item.title}</h3>
              <div
                className="mt-3 flex max-w-3xl flex-col gap-2 text-sm leading-6 [&_a]:underline [&_h3]:font-serif [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: renderRichText(item.body) }}
              />
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl text-forest-900 dark:text-white">Upcoming events</h2>
        {feed.upcomingEvents.map((item) => {
          const kind = item.eventType as keyof typeof EVENT_TYPE_LABELS;
          return (
            <article key={item.id} className="rounded-2xl border border-forest-900/10 bg-white p-5 dark:border-white/10 dark:bg-[#102117]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700 dark:text-gold-300">
                {EVENT_TYPE_LABELS[kind] ?? item.eventType}
                {" · "}
                {item.audiences.map((tag) => AUDIENCE_LABELS[tag as keyof typeof AUDIENCE_LABELS] ?? tag).join(", ")}
              </p>
              <h3 className="mt-1 font-serif text-2xl text-forest-900 dark:text-white">{item.title}</h3>
              <p className="mt-1 text-sm text-ink/70 dark:text-emerald-100/70">{item.description}</p>
              <p className="mt-2 text-sm">{item.venue}</p>
              <p className="text-xs text-ink/50">{formatDateTime(item.startsAt)} – {formatDateTime(item.endsAt)}</p>
            </article>
          );
        })}
      </section>

      <section>
        <h2 className="font-serif text-2xl text-forest-900 dark:text-white">Directory</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {feed.staff.map((item) => {
            const group = item.staffGroup as keyof typeof STAFF_GROUP_LABELS;
            return (
              <article key={item.id} className="flex gap-4 rounded-2xl border border-forest-900/10 bg-white p-4 dark:border-white/10 dark:bg-[#102117]">
                {item.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photoUrl} alt="" className="h-24 w-20 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-24 w-20 items-center justify-center rounded-xl bg-forest-900 font-serif text-xl text-gold-300">
                    {initials(item.name)}
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700 dark:text-gold-300">
                    {STAFF_GROUP_LABELS[group] ?? item.staffGroup} · {item.department}
                  </p>
                  <h3 className="font-serif text-xl text-forest-900 dark:text-white">{item.name}</h3>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-ink/70 dark:text-emerald-100/70">{item.bio}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

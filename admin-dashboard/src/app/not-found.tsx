import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-forest-900/10 bg-white p-8 dark:border-white/10 dark:bg-[#102117]">
      <h1 className="font-serif text-3xl text-forest-900 dark:text-white">That page is not on the desk</h1>
      <p className="mt-2 text-sm text-ink/70 dark:text-emerald-100/70">Return to the overview to keep working on the Gayaza library.</p>
      <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-forest-800 underline dark:text-gold-300">
        Back to overview
      </Link>
    </div>
  );
}

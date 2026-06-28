import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-white">
      {/* Decorative background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
      >
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-100 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-green-50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-1.5 text-sm font-medium text-green-800 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Connecting Canada &amp; USA with Pakistan
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-green-900 sm:text-5xl lg:text-6xl lg:leading-[1.1]">
            Give with confidence.{" "}
            <span className="text-green-700">Help with dignity.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
            Apki Amanat connects verified donors with verified recipients in
            Pakistan. No cash handoffs — fulfill real needs directly through
            trusted pharmacies, stores, and schools.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/cases"
              className="inline-flex w-full items-center justify-center rounded-xl bg-green-700 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-green-700/25 transition-all hover:bg-green-800 hover:shadow-green-700/30 sm:w-auto"
            >
              I Want to Help
            </Link>
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-xl border-2 border-green-700 bg-white px-8 py-3.5 text-base font-semibold text-green-700 transition-all hover:bg-green-50 sm:w-auto"
            >
              I Need Help
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <CheckIcon />
              Verified donors &amp; recipients
            </span>
            <span className="flex items-center gap-2">
              <CheckIcon />
              In-kind only — no cash
            </span>
            <span className="flex items-center gap-2">
              <CheckIcon />
              Partner vendor network
            </span>
          </div>
        </div>

        {/* Category pills */}
        <div
          id="browse-cases"
          className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 scroll-mt-24"
        >
          {[
            { label: "Medicine", icon: "💊" },
            { label: "Food", icon: "🍚" },
            { label: "School Fees", icon: "📚" },
            { label: "Wedding", icon: "💍" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-center gap-2 rounded-xl border border-green-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-shadow hover:shadow-md"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 text-green-600"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-10 w-10 text-green-700"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" className="stroke-green-200" strokeWidth="2" />
      <path
        d="M8 12.5l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DonationConfirmationPage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-green-50 via-white to-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
        >
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-100 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-green-50 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-lg flex-col items-center px-4 py-20 sm:px-6 sm:py-28">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckIcon />
          </div>

          <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
            Thank You for Your Generosity
          </h1>

          <p className="mt-4 text-center text-base leading-relaxed text-gray-600">
            Your donation is being processed. The recipient will be notified
            once the need is fulfilled.
          </p>

          <Link
            href="/cases"
            className="mt-8 inline-flex rounded-xl bg-green-700 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-green-700/25 transition-colors hover:bg-green-800"
          >
            Back to Cases
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

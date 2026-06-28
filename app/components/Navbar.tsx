import Link from "next/link";

function LogoIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" className="fill-green-700" />
      <path
        d="M16 8c-1.5 2.5-4 4.5-4 7.5a4 4 0 108 0c0-3-2.5-5-4-7.5z"
        className="fill-white"
      />
      <path
        d="M10 22c2 2 4.5 3 6 3s4-1 6-3"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-green-100/80 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <LogoIcon />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-green-900">
              Apki Amanat
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-green-600">
              Your Trust
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-green-700"
          >
            How It Works
          </Link>
          <Link
            href="/cases"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-green-700"
          >
            Browse Cases
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-green-700 sm:px-4"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-green-700/20 transition-colors hover:bg-green-800 sm:px-4"
          >
            Sign Up
          </Link>
        </div>
      </nav>
    </header>
  );
}

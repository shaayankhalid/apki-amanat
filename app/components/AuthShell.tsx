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

export default function AuthShell({
  children,
  title,
  subtitle,
  wide = false,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-green-50 via-white to-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
      >
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-100 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-green-50 blur-3xl" />
      </div>

      <div
        className={`relative mx-auto flex min-h-full flex-col px-4 py-10 sm:px-6 sm:py-16 ${wide ? "max-w-4xl" : "max-w-lg"}`}
      >
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 transition-opacity hover:opacity-80"
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

        <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-lg shadow-green-900/5 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

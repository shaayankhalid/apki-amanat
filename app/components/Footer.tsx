import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-green-100 bg-green-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold text-green-900">
                Apki Amanat
              </span>
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-green-600">
                آپ کی امانت · Your Trust
              </p>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-600">
              Connecting verified donors abroad with verified recipients in
              Pakistan — fulfilling needs directly, with dignity.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-green-900">Platform</h3>
            <ul className="mt-4 space-y-3">
              {[
                { label: "How It Works", href: "#how-it-works" },
                { label: "Browse Cases", href: "/cases" },
                { label: "Sign Up", href: "/signup" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 transition-colors hover:text-green-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-green-900">Support</h3>
            <ul className="mt-4 space-y-3">
              {["Help Center", "Contact Us", "Verification Process"].map(
                (item) => (
                  <li key={item}>
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-green-900">Legal</h3>
            <ul className="mt-4 space-y-3">
              {["Privacy Policy", "Terms of Service", "Trust & Safety"].map(
                (item) => (
                  <li key={item}>
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-green-200 pt-8 sm:flex-row">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Apki Amanat. All rights reserved.
          </p>
          <p className="text-sm text-gray-500">
            Made with care for communities in Pakistan, Canada &amp; the USA.
          </p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getAuthErrorMessage } from "@/lib/auth-errors";

type VerificationStatus = "pending" | "verified";
type CaseStatus = "Pending" | "Verified" | "Rejected" | "Funded" | "Closed";

type Profile = {
  full_name: string;
  role: "donor" | "recipient" | "vendor";
  verification_status?: VerificationStatus;
};

type DonationRow = {
  id: any;
  amount_pkr: any;
  created_at: any;
  cases: { title: string } | null;
};

type Donation = {
  id: string;
  caseTitle: string;
  amount: number;
  date: string;
};

type CaseRow = {
  id: string;
  title: string;
  category: string;
  amount_pkr: number;
  location: string;
  status: CaseStatus;
  created_at: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPkr(amount: number) {
  return `Rs. ${amount.toLocaleString()}`;
}

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

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const verified = status === "verified";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        verified
          ? "bg-green-100 text-green-800"
          : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          verified ? "bg-green-600" : "bg-amber-500"
        }`}
      />
      {verified ? "Verified Donor" : "Pending Verification"}
    </span>
  );
}

function RecipientVerificationBadge({ status }: { status: VerificationStatus }) {
  const verified = status === "verified";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        verified
          ? "bg-green-100 text-green-800"
          : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          verified ? "bg-green-600" : "bg-amber-500"
        }`}
      />
      {verified ? "Verified" : "Pending"}
    </span>
  );
}

function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const styles: Record<CaseStatus, string> = {
    Pending: "bg-amber-50 text-amber-800 ring-amber-200",
    Verified: "bg-green-100 text-green-800 ring-green-200",
    Rejected: "bg-red-50 text-red-800 ring-red-200",
    Funded: "bg-blue-50 text-blue-800 ring-blue-200",
    Closed: "bg-gray-100 text-gray-600 ring-gray-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-green-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DonorDashboard({
  name,
  verificationStatus,
  donations,
}: {
  name: string;
  verificationStatus: VerificationStatus;
  donations: Donation[];
}) {
  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
  const peopleHelped = donations.length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-lg shadow-green-900/5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-green-600">Welcome back</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
              {name}
            </h1>
          </div>
          <VerificationBadge status={verificationStatus} />
        </div>

        <Link
          href="/cases"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-green-700 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-green-700/25 transition-all hover:bg-green-800 sm:w-auto"
        >
          Browse Cases
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-green-100 bg-green-50/50 p-6">
          <p className="text-sm font-medium text-green-600">Total Donated</p>
          <p className="mt-1 text-3xl font-bold text-green-900">
            {formatPkr(totalDonated)}
          </p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-green-50/50 p-6">
          <p className="text-sm font-medium text-green-600">People Helped</p>
          <p className="mt-1 text-3xl font-bold text-green-900">
            {peopleHelped}
          </p>
        </div>
      </div>

      <SectionCard title="My Donations">
        {donations.length === 0 ? (
          <p className="text-sm text-gray-500">No donations yet</p>
        ) : (
          <ul className="divide-y divide-green-100">
            {donations.map((donation) => (
              <li
                key={donation.id}
                className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-green-900">
                    {donation.caseTitle}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {donation.date}
                  </p>
                </div>
                <p className="text-base font-semibold text-green-700">
                  {formatPkr(donation.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function RecipientDashboard({
  name,
  verificationStatus,
  cases,
}: {
  name: string;
  verificationStatus: VerificationStatus;
  cases: CaseRow[];
}) {
  const hasPendingCase = cases.some((c) => c.status === "Pending");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-lg shadow-green-900/5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-green-600">Welcome back</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
              {name}
            </h1>
          </div>
          <RecipientVerificationBadge status={verificationStatus} />
        </div>

        <Link
          href="/submit-case"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-green-700 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-green-700/25 transition-all hover:bg-green-800 sm:w-auto"
        >
          Submit a New Case
        </Link>
      </div>

      {hasPendingCase && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Our team will review your case within 48 hours.
        </div>
      )}

      <SectionCard title="My Cases">
        {cases.length === 0 ? (
          <p className="text-sm text-gray-500">
            You haven&apos;t submitted any cases yet. Click above to submit your
            first case.
          </p>
        ) : (
          <ul className="divide-y divide-green-100">
            {cases.map((caseItem) => (
              <li key={caseItem.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-green-900">{caseItem.title}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>{caseItem.category}</span>
                      <span>{formatPkr(Number(caseItem.amount_pkr))}</span>
                      <span>{caseItem.location}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Submitted {formatDate(caseItem.created_at)}
                    </p>
                  </div>
                  <CaseStatusBadge status={caseItem.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-green-50 via-white to-white">
          <p className="text-sm font-medium text-green-700">Loading…</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("submitted") === "case") {
      setSuccessMessage(
        "Your case has been submitted successfully! Our team will review it within 48 hours.",
      );
      router.replace("/dashboard", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role, verification_status")
        .eq("id", user.id)
        .single();

      let resolvedProfile: Profile | null = null;

      if (profileError) {
        const { data: fallbackProfile, error: fallbackError } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();

        if (fallbackError) {
          setError(getAuthErrorMessage(fallbackError));
        } else {
          resolvedProfile = {
            ...fallbackProfile,
            verification_status: "pending",
          };
        }
      } else {
        resolvedProfile = {
          ...profileData,
          verification_status:
            profileData.verification_status === "verified"
              ? "verified"
              : "pending",
        };
      }

      setProfile(resolvedProfile);

      if (resolvedProfile?.role === "vendor") {
        router.replace("/vendor");
        return;
      }

      if (resolvedProfile?.role === "recipient") {
        const { data: casesData, error: casesError } = await supabase
          .from("cases")
          .select("id, title, category, amount_pkr, location, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (casesError) {
          setError(casesError.message);
        } else {
          setCases((casesData as CaseRow[]) ?? []);
        }
      }

      if (resolvedProfile?.role === "donor") {
        const { data: donationsData, error: donationsError } = await supabase
          .from("donations")
          .select("id, amount_pkr, created_at, cases(title)")
          .eq("donor_id", user.id)
          .order("created_at", { ascending: false });

        if (donationsError) {
          setDonations([]);
        } else {
          setDonations(
            ((donationsData as any[]) ?? []).map((row) => ({
              id: row.id,
              caseTitle: row.cases?.title ?? "Untitled case",
              amount: Number(row.amount_pkr),
              date: formatDate(row.created_at),
            })),
          );
        }
      }

      setLoading(false);
    }

    loadUser();
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(getAuthErrorMessage(logoutError));
      setLoggingOut(false);
      return;
    }

    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-green-50 via-white to-white">
        <p className="text-sm font-medium text-green-700">Loading…</p>
      </div>
    );
  }

  const displayName = profile?.full_name || "there";
  const verificationStatus = profile?.verification_status ?? "pending";

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-green-50 via-white to-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
      >
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-100 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-green-50 blur-3xl" />
      </div>

      <header className="relative border-b border-green-100/80 bg-white/90 backdrop-blur-md">
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

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </nav>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        {successMessage && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {successMessage}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {profile?.role === "donor" && (
          <DonorDashboard
            name={displayName}
            verificationStatus={verificationStatus}
            donations={donations}
          />
        )}

        {profile?.role === "recipient" && (
          <RecipientDashboard
            name={displayName}
            verificationStatus={verificationStatus}
            cases={cases}
          />
        )}

        {!profile?.role && !error && (
          <div className="rounded-2xl border border-green-100 bg-white p-8 text-center shadow-lg shadow-green-900/5">
            <h1 className="text-2xl font-bold text-green-900">
              Welcome to Apki Amanat
            </h1>
            <p className="mt-2 text-gray-600">
              Your profile is being set up. Please check back shortly.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

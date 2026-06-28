"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ADMIN_EMAIL } from "@/lib/admin";
import CaseDetailPanel from "@/app/components/admin/CaseDetailPanel";

type Tab = "cases" | "users";
type CaseFilter = "All" | "Pending" | "Verified" | "Rejected";
type CaseStatus = "Pending" | "Verified" | "Rejected" | "Funded" | "Closed";
type UserVerificationStatus = "pending" | "verified" | "suspended";

type AdminCase = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  amount_pkr: number;
  location: string;
  status: CaseStatus;
  created_at: string;
  submitterName: string;
};

type AdminUser = {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  country: string;
  verification_status: UserVerificationStatus;
  created_at: string;
  vendor?: {
    business_name: string;
    business_type: string;
    business_address: string;
    city: string;
    status: string;
  } | null;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPkr(amount: number) {
  return `Rs. ${Number(amount).toLocaleString()}`;
}

function LogoIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8" aria-hidden="true">
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

function CaseStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-800 ring-amber-200",
    Verified: "bg-green-100 text-green-800 ring-green-200",
    Rejected: "bg-red-50 text-red-800 ring-red-200",
    Funded: "bg-blue-50 text-blue-800 ring-blue-200",
    Closed: "bg-gray-100 text-gray-600 ring-gray-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${styles[status] ?? "bg-gray-100 text-gray-600 ring-gray-200"}`}
    >
      {status}
    </span>
  );
}

function UserStatusBadge({ status }: { status: UserVerificationStatus }) {
  const styles: Record<UserVerificationStatus, string> = {
    pending: "bg-amber-50 text-amber-800 ring-amber-200",
    verified: "bg-green-100 text-green-800 ring-green-200",
    suspended: "bg-red-50 text-red-800 ring-red-200",
  };

  const labels: Record<UserVerificationStatus, string> = {
    pending: "Pending",
    verified: "Verified",
    suspended: "Suspended",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

const CASE_FILTERS: CaseFilter[] = ["All", "Pending", "Verified", "Rejected"];

export default function AdminPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("cases");
  const [caseFilter, setCaseFilter] = useState<CaseFilter>("All");
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<AdminCase | null>(null);

  const fetchCases = useCallback(async () => {
    setLoadingCases(true);
    setError("");

    const { data: casesData, error: casesError } = await supabase
      .from("cases")
      .select("id, user_id, title, category, amount_pkr, location, status, created_at")
      .order("created_at", { ascending: false });

    if (casesError) {
      setError(casesError.message);
      setLoadingCases(false);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name");

    if (profilesError) {
      setError(profilesError.message);
      setLoadingCases(false);
      return;
    }

    const nameById = new Map(
      (profilesData ?? []).map((p) => [p.id, p.full_name]),
    );

    setCases(
      (casesData ?? []).map((c) => ({
        ...c,
        status: c.status as CaseStatus,
        submitterName: nameById.get(c.user_id) ?? "Unknown",
      })),
    );
    setLoadingCases(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError("");

    const { data, error: usersError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, country, verification_status, created_at")
      .order("created_at", { ascending: false });

    if (usersError) {
      setError(usersError.message);
      setLoadingUsers(false);
      return;
    }

    const { data: vendorsData } = await supabase
      .from("vendors")
      .select("profile_id, business_name, business_type, business_address, city, status");

    const vendorByProfile = new Map(
      (vendorsData ?? []).map((v) => [v.profile_id, v]),
    );

    setUsers(
      (data ?? []).map((u) => ({
        ...u,
        verification_status: (u.verification_status ?? "pending") as UserVerificationStatus,
        vendor: vendorByProfile.get(u.id) ?? null,
      })),
    );
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        router.replace("/dashboard");
        return;
      }

      setAuthChecking(false);
      await fetchCases();
      await fetchUsers();
    }

    checkAccess();
  }, [router, fetchCases, fetchUsers]);

  async function updateCaseStatus(caseId: string, status: "Verified" | "Rejected") {
    setActionLoading(caseId);
    setError("");

    const { error: updateError } = await supabase
      .from("cases")
      .update({ status })
      .eq("id", caseId);

    if (updateError) {
      setError(updateError.message);
      setActionLoading(null);
      return false;
    }

    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status } : c)),
    );
    setSelectedCase((prev) =>
      prev?.id === caseId ? { ...prev, status } : prev,
    );
    setActionLoading(null);
    return true;
  }

  async function updateUserStatus(
    userId: string,
    verification_status: "verified" | "suspended",
    userRole?: string,
  ) {
    setActionLoading(userId);
    setError("");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ verification_status })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setActionLoading(null);
      return;
    }

    if (userRole === "vendor") {
      const { error: vendorError } = await supabase
        .from("vendors")
        .update({ status: verification_status })
        .eq("profile_id", userId);

      if (vendorError) {
        setError(vendorError.message);
        setActionLoading(null);
        return;
      }
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              verification_status,
              vendor: u.vendor
                ? { ...u.vendor, status: verification_status }
                : u.vendor,
            }
          : u,
      ),
    );
    setActionLoading(null);
  }

  const filteredCases =
    caseFilter === "All"
      ? cases
      : cases.filter((c) => c.status === caseFilter);

  if (authChecking) {
    return (
      <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-green-50 via-white to-white">
        <p className="text-sm font-medium text-green-700">Loading…</p>
      </div>
    );
  }

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
                Admin
              </span>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
          >
            Back to Dashboard
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Review and verify cases and users.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mb-6 flex gap-1 rounded-xl border border-green-100 bg-white p-1 shadow-sm">
          {(["cases", "users"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "bg-green-700 text-white shadow-sm"
                  : "text-gray-600 hover:bg-green-50 hover:text-green-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "cases" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {CASE_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setCaseFilter(filter)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    caseFilter === filter
                      ? "bg-green-700 text-white"
                      : "border border-green-200 bg-white text-gray-600 hover:border-green-300 hover:text-green-800"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {loadingCases ? (
              <p className="text-sm text-gray-500">Loading cases…</p>
            ) : filteredCases.length === 0 ? (
              <div className="rounded-2xl border border-green-100 bg-white p-8 text-center shadow-sm">
                <p className="text-sm text-gray-500">No cases found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCases.map((caseItem) => (
                  <button
                    key={caseItem.id}
                    type="button"
                    onClick={() => setSelectedCase(caseItem)}
                    className="w-full rounded-2xl border border-green-100 bg-white p-5 text-left shadow-sm transition-all hover:border-green-200 hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-green-600">
                            {caseItem.submitterName}
                          </p>
                          <CaseStatusBadge status={caseItem.status} />
                        </div>
                        <h2 className="text-lg font-semibold text-green-900">
                          {caseItem.title}
                        </h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                          <span>{caseItem.category}</span>
                          <span>{formatPkr(caseItem.amount_pkr)}</span>
                          <span>{caseItem.location}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Submitted {formatDate(caseItem.created_at)}
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-medium text-green-700">
                        View details →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            {loadingUsers ? (
              <p className="text-sm text-gray-500">Loading users…</p>
            ) : users.length === 0 ? (
              <div className="rounded-2xl border border-green-100 bg-white p-8 text-center shadow-sm">
                <p className="text-sm text-gray-500">No users found.</p>
              </div>
            ) : (
              users.map((user) => (
                <article
                  key={user.id}
                  className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-green-900">
                          {user.full_name}
                        </h2>
                        <UserStatusBadge status={user.verification_status} />
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>{user.email ?? "No email on file"}</p>
                        <p className="capitalize">
                          {user.role} · {user.country}
                        </p>
                        {user.role === "vendor" && user.vendor && (
                          <div className="mt-2 rounded-lg border border-green-100 bg-green-50/40 p-3 text-sm">
                            <p className="font-medium text-green-900">
                              {user.vendor.business_name}
                            </p>
                            <p>{user.vendor.business_type}</p>
                            <p>{user.vendor.business_address}</p>
                            <p>{user.vendor.city}, Pakistan</p>
                            <p className="mt-1 text-xs capitalize text-gray-500">
                              Vendor status: {user.vendor.status}
                            </p>
                          </div>
                        )}
                        <p className="text-gray-500">
                          Joined {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={actionLoading === user.id}
                        onClick={() =>
                          updateUserStatus(user.id, "verified", user.role)
                        }
                        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:opacity-60"
                      >
                        Verify
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === user.id}
                        onClick={() =>
                          updateUserStatus(user.id, "suspended", user.role)
                        }
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                      >
                        Suspend
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </main>

      {selectedCase && (
        <CaseDetailPanel
          caseId={selectedCase.id}
          submitterName={selectedCase.submitterName}
          onClose={() => setSelectedCase(null)}
          onStatusChange={updateCaseStatus}
          actionLoading={actionLoading === selectedCase.id}
        />
      )}
    </div>
  );
}

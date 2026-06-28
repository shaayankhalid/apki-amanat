"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { supabase } from "@/lib/supabase";

type CategoryFilter =
  | "All"
  | "Medicine"
  | "Food"
  | "School Fees"
  | "Wedding Expenses";

type CaseItem = {
  id: string;
  title: string;
  category: string;
  location: string;
  amount_pkr: number;
  amountFunded: number;
};

const CATEGORY_FILTERS: CategoryFilter[] = [
  "All",
  "Medicine",
  "Food",
  "School Fees",
  "Wedding Expenses",
];

const CATEGORY_ICONS: Record<string, string> = {
  Medicine: "💊",
  Food: "🍚",
  "School Fees": "📚",
  "Wedding Expenses": "💍",
  Other: "📋",
};

function formatPkr(amount: number) {
  return `Rs. ${Number(amount).toLocaleString()}`;
}

function FundingProgress({
  funded,
  goal,
}: {
  funded: number;
  goal: number;
}) {
  const percent = goal > 0 ? Math.min(100, Math.round((funded / goal) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-green-700">
          {formatPkr(funded)} raised
        </span>
        <span className="text-gray-500">{percent}% of {formatPkr(goal)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-green-100">
        <div
          className="h-full rounded-full bg-green-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");

  useEffect(() => {
    async function fetchCases() {
      setLoading(true);
      setError("");

      const { data: casesData, error: casesError } = await supabase
        .from("cases")
        .select("id, title, category, location, amount_pkr")
        .eq("status", "Verified")
        .order("created_at", { ascending: false });

      if (casesError) {
        setError(casesError.message);
        setLoading(false);
        return;
      }

      const caseRows = casesData ?? [];
      const caseIds = caseRows.map((c) => c.id);

      const fundedByCase = new Map<string, number>();

      if (caseIds.length > 0) {
        const { data: donationsData } = await supabase
          .from("donations")
          .select("case_id, amount_pkr")
          .in("case_id", caseIds);

        for (const donation of donationsData ?? []) {
          const current = fundedByCase.get(donation.case_id) ?? 0;
          fundedByCase.set(
            donation.case_id,
            current + Number(donation.amount_pkr),
          );
        }
      }

      setCases(
        caseRows.map((c) => ({
          id: c.id,
          title: c.title,
          category: c.category,
          location: c.location,
          amount_pkr: Number(c.amount_pkr),
          amountFunded: fundedByCase.get(c.id) ?? 0,
        })),
      );
      setLoading(false);
    }

    fetchCases();
  }, []);

  const filteredCases = useMemo(
    () =>
      categoryFilter === "All"
        ? cases
        : cases.filter((c) => c.category === categoryFilter),
    [cases, categoryFilter],
  );

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

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-green-900 sm:text-4xl">
              Browse Verified Cases
            </h1>
            <p className="mt-3 text-gray-600">
              Real needs from verified recipients in Pakistan — fulfill them
              directly with dignity.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {CATEGORY_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setCategoryFilter(filter)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  categoryFilter === filter
                    ? "bg-green-700 text-white shadow-sm"
                    : "border border-green-200 bg-white text-gray-600 hover:border-green-300 hover:text-green-800"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {error && (
            <div
              role="alert"
              className="mx-auto mt-8 max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {loading ? (
            <p className="mt-12 text-center text-sm text-gray-500">
              Loading cases…
            </p>
          ) : filteredCases.length === 0 ? (
            <div className="mx-auto mt-12 max-w-md rounded-2xl border border-green-100 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
                💚
              </div>
              <h2 className="mt-4 text-lg font-semibold text-green-900">
                No verified cases yet
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {categoryFilter === "All"
                  ? "There are no verified cases available right now. Check back soon — new needs are reviewed and posted regularly."
                  : `No verified cases in "${categoryFilter}" right now. Try another category or check back later.`}
              </p>
              <Link
                href="/dashboard"
                className="mt-6 inline-flex rounded-xl bg-green-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  href={`/cases/${caseItem.id}`}
                  className="group flex flex-col rounded-2xl border border-green-100 bg-white p-6 shadow-sm transition-all hover:border-green-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-lg transition-colors group-hover:bg-green-100"
                      aria-hidden="true"
                    >
                      {CATEGORY_ICONS[caseItem.category] ?? "📋"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                        {caseItem.category}
                      </p>
                      <h2 className="mt-0.5 text-lg font-semibold leading-snug text-green-900">
                        {caseItem.title}
                      </h2>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-600">
                    📍 {caseItem.location}
                  </p>

                  <p className="mt-2 text-base font-semibold text-green-800">
                    {formatPkr(caseItem.amount_pkr)} needed
                  </p>

                  <div className="mt-4">
                    <FundingProgress
                      funded={caseItem.amountFunded}
                      goal={caseItem.amount_pkr}
                    />
                  </div>

                  <span className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-green-700/20 transition-colors group-hover:bg-green-800">
                    View Case
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

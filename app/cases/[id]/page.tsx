"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { supabase } from "@/lib/supabase";

type CaseDetails = {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  amount_pkr: number;
  created_at: string;
  amountFunded: number;
};

function formatPkr(amount: number) {
  return `Rs. ${Number(amount).toLocaleString()}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
      <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
      Verified Case
    </span>
  );
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
      <div className="h-2.5 overflow-hidden rounded-full bg-green-100">
        <div
          className="h-full rounded-full bg-green-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;

  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCase() {
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select(
          "id, title, category, description, location, amount_pkr, created_at, status",
        )
        .eq("id", caseId)
        .single();

      if (caseError || !caseData || caseData.status !== "Verified") {
        setError("This case is not available.");
        setLoading(false);
        return;
      }

      const { data: donationsData } = await supabase
        .from("donations")
        .select("amount_pkr")
        .eq("case_id", caseId);

      const amountFunded = (donationsData ?? []).reduce(
        (sum, d) => sum + Number(d.amount_pkr),
        0,
      );

      setCaseDetails({
        id: caseData.id,
        title: caseData.title,
        category: caseData.category,
        description: caseData.description,
        location: caseData.location,
        amount_pkr: Number(caseData.amount_pkr),
        created_at: caseData.created_at,
        amountFunded,
      });
      setLoading(false);
    }

    loadCase();
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 via-white to-white">
        <p className="text-sm font-medium text-green-700">Loading case…</p>
      </div>
    );
  }

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

        <div className="relative mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            href="/cases"
            className="text-sm font-medium text-green-700 transition-colors hover:text-green-800"
          >
            ← Back to Cases
          </Link>

          {error || !caseDetails ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
              <p className="text-sm text-red-700">{error || "Case not found."}</p>
            </div>
          ) : (
            <article className="mt-6 space-y-6">
              <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                      {caseDetails.category}
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
                      {caseDetails.title}
                    </h1>
                  </div>
                  <VerifiedBadge />
                </div>

                <p className="mt-5 text-sm leading-relaxed text-gray-600">
                  {caseDetails.description}
                </p>

                <div className="mt-6 space-y-3 border-t border-green-100 pt-6">
                  <p className="text-sm text-gray-600">
                    📍 {caseDetails.location}
                  </p>
                  <p className="text-sm text-gray-600">
                    A verified recipient in {caseDetails.location.split(",")[0].trim()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Submitted {formatDate(caseDetails.created_at)}
                  </p>
                </div>

                <div className="mt-6">
                  <p className="text-lg font-bold text-green-800">
                    {formatPkr(caseDetails.amount_pkr)} needed
                  </p>
                  <div className="mt-3">
                    <FundingProgress
                      funded={caseDetails.amountFunded}
                      goal={caseDetails.amount_pkr}
                    />
                  </div>
                </div>
              </div>

              <Link
                href={`/cases/${caseDetails.id}/vendors`}
                className="flex w-full items-center justify-center rounded-xl bg-green-700 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-green-700/25 transition-colors hover:bg-green-800"
              >
                I Want to Help
              </Link>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

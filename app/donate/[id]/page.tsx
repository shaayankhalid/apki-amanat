"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/send-email-client";

type CaseDetails = {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  amount_pkr: number;
  amountFunded: number;
  recipientId: string;
};

type Vendor = {
  id: string;
  business_name: string;
  business_type: string;
  city: string;
  status: string;
};

function formatPkr(amount: number) {
  return `Rs. ${Number(amount).toLocaleString()}`;
}

function businessTypesForCategory(category: string): string[] | null {
  switch (category) {
    case "Medicine":
      return ["Pharmacy"];
    case "Food":
      return ["Grocery Store"];
    case "School Fees":
      return ["School"];
    default:
      return null;
  }
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

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
      <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
      Verified
    </span>
  );
}

function VendorCard({
  vendor,
  selected,
  onSelect,
}: {
  vendor: Vendor;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
        selected
          ? "border-green-700 bg-green-50 shadow-md shadow-green-700/10"
          : "border-green-100 bg-white hover:border-green-300 hover:bg-green-50/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-green-900">{vendor.business_name}</p>
          <p className="mt-0.5 text-sm text-gray-600">{vendor.business_type}</p>
          <p className="mt-1 text-sm text-gray-500">{vendor.city}, Pakistan</p>
        </div>
        <VerifiedBadge />
      </div>
    </button>
  );
}

const inputClassName =
  "w-full rounded-lg border border-green-100 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20";

export default function DonatePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [amount, setAmount] = useState("");
  const [pledgeAccepted, setPledgeAccepted] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const donateAmount = Number(amount);
  const showVendorSection =
    pledgeAccepted && donateAmount > 0 && !!caseDetails;

  useEffect(() => {
    async function loadPage() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, verification_status")
        .eq("id", user.id)
        .single();

      if (
        profileError ||
        profile?.role !== "donor" ||
        profile?.verification_status !== "verified"
      ) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select(
          "id, title, category, description, location, amount_pkr, status, user_id",
        )
        .eq("id", caseId)
        .single();

      if (caseError || !caseData || caseData.status !== "Verified") {
        setError(caseError?.message ?? "This case is not available for donations.");
        setAuthChecking(false);
        setLoading(false);
        return;
      }

      const { data: donationsData } = await supabase
        .from("donations")
        .select("amount_pkr, status")
        .eq("case_id", caseId);

      const amountFunded = (donationsData ?? [])
        .filter((d) => d.status !== "pending")
        .reduce((sum, d) => sum + Number(d.amount_pkr), 0);

      const goal = Number(caseData.amount_pkr);
      const remaining = Math.max(0, goal - amountFunded);

      setCaseDetails({
        id: caseData.id,
        title: caseData.title,
        category: caseData.category,
        description: caseData.description,
        location: caseData.location,
        amount_pkr: goal,
        amountFunded,
        recipientId: caseData.user_id,
      });
      setAmount(String(remaining > 0 ? remaining : goal));
      setAuthChecking(false);
      setLoading(false);
    }

    loadPage();
  }, [caseId, router]);

  useEffect(() => {
    if (!showVendorSection || !caseDetails) {
      setVendors([]);
      setSelectedVendorId(null);
      return;
    }

    let cancelled = false;

    async function loadVendors() {
      setVendorsLoading(true);

      const types = businessTypesForCategory(caseDetails.category);
      let query = supabase
        .from("vendors")
        .select("id, business_name, business_type, city, status")
        .eq("status", "verified")
        .order("business_name");

      if (types) {
        query = query.in("business_type", types);
      }

      const { data, error: vendorsError } = await query;

      if (cancelled) return;

      if (vendorsError) {
        setError(vendorsError.message);
        setVendors([]);
      } else {
        setVendors(data ?? []);
      }

      setSelectedVendorId(null);
      setVendorsLoading(false);
    }

    loadVendors();

    return () => {
      cancelled = true;
    };
  }, [showVendorSection, caseDetails]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!userId || !caseDetails) return;

    if (!donateAmount || donateAmount <= 0) {
      setError("Please enter a valid donation amount.");
      return;
    }

    const remaining = Math.max(0, caseDetails.amount_pkr - caseDetails.amountFunded);
    if (donateAmount > remaining) {
      setError(`Amount cannot exceed the remaining ${formatPkr(remaining)} needed.`);
      return;
    }

    if (!pledgeAccepted) {
      setError("Please accept the non-discrimination pledge to continue.");
      return;
    }

    if (!selectedVendorId) {
      setError("Please select a vendor to fulfill this donation.");
      return;
    }

    setSubmitting(true);

    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        donor_id: userId,
        case_id: caseDetails.id,
        amount_pkr: donateAmount,
        vendor_id: selectedVendorId,
        status: "pending",
      })
      .select("id")
      .single();

    if (donationError) {
      setError(donationError.message || "Unable to save your donation. Please try again.");
      setSubmitting(false);
      return;
    }

    const { error: orderError } = await supabase.from("vendor_orders").insert({
      vendor_id: selectedVendorId,
      donor_id: userId,
      recipient_id: caseDetails.recipientId,
      case_id: caseDetails.id,
      donation_id: donation.id,
      category: caseDetails.category,
      items_needed: caseDetails.description,
      amount_pkr: donateAmount,
      status: "pending",
    });

    if (orderError) {
      await supabase.from("donations").delete().eq("id", donation.id);
      setError(
        orderError.message ||
          "Unable to assign your donation to the vendor. Please try again.",
      );
      setSubmitting(false);
      return;
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const { data: donorProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    const donorEmail = donorProfile?.email ?? authUser?.email;
    if (donorEmail) {
      sendEmail({
        type: "donation-confirmation",
        to: donorEmail,
        donorName: donorProfile?.full_name,
        caseTitle: caseDetails.title,
        amountPkr: donateAmount,
      });
    }

    router.push(`/donate/${caseId}/confirmation`);
  }

  if (authChecking || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 via-white to-white">
        <p className="text-sm font-medium text-green-700">Loading…</p>
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

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
            Complete Your Donation
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Review the case details and confirm your contribution.
          </p>

          {error && !caseDetails && (
            <div
              role="alert"
              className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {caseDetails && (
            <div className="mt-8 space-y-6">
              <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                  {caseDetails.category}
                </p>
                <h2 className="mt-1 text-xl font-bold text-green-900">
                  {caseDetails.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {caseDetails.description}
                </p>
                <p className="mt-3 text-sm text-gray-600">
                  📍 {caseDetails.location}
                </p>
                <p className="mt-2 text-base font-semibold text-green-800">
                  {formatPkr(caseDetails.amount_pkr)} needed
                </p>
                <div className="mt-4">
                  <FundingProgress
                    funded={caseDetails.amountFunded}
                    goal={caseDetails.amount_pkr}
                  />
                </div>
              </section>

              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm sm:p-8"
              >
                <div>
                  <label
                    htmlFor="amount"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Amount to Donate (PKR)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-green-100 bg-green-50/50 p-4">
                  <input
                    type="checkbox"
                    checked={pledgeAccepted}
                    onChange={(e) => setPledgeAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-green-300 text-green-700 focus:ring-green-600"
                  />
                  <span className="text-sm leading-relaxed text-gray-700">
                    I pledge to treat all recipients with respect and without
                    discrimination based on religion, ethnicity, gender, or
                    background.
                  </span>
                </label>

                {showVendorSection && (
                  <section className="mt-6 space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-green-900">
                        Select a Vendor
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Choose a verified partner to fulfill this{" "}
                        {caseDetails.category.toLowerCase()} need.
                      </p>
                    </div>

                    {vendorsLoading ? (
                      <p className="text-sm text-gray-500">Loading vendors…</p>
                    ) : vendors.length === 0 ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        No verified vendors are available for this category yet.
                        Please check back later.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {vendors.map((vendor) => (
                          <VendorCard
                            key={vendor.id}
                            vendor={vendor}
                            selected={selectedVendorId === vendor.id}
                            onSelect={() => setSelectedVendorId(vendor.id)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {typeof error === "string" && error.length > 0 && caseDetails && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    (showVendorSection &&
                      (vendorsLoading || vendors.length === 0 || !selectedVendorId))
                  }
                  className="mt-6 w-full rounded-xl bg-green-700 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-green-700/25 transition-all hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Processing…" : "Confirm & Proceed to Payment"}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

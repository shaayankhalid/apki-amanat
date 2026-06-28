"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { supabase } from "@/lib/supabase";
import {
  businessTypesForCategory,
  citiesMatch,
  countProductsByVendor,
  sortVendorsByRecipientCity,
} from "@/lib/case-vendors";

type CaseInfo = {
  id: string;
  title: string;
  category: string;
  location: string;
};

type VendorOption = {
  id: string;
  business_name: string;
  business_type: string;
  city: string;
  productCount: number;
  nearRecipient: boolean;
};

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
      <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
      Verified
    </span>
  );
}

export default function CaseVendorsPage() {
  const params = useParams();
  const caseId = params.id as string;

  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVendors() {
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("id, title, category, location, status")
        .eq("id", caseId)
        .single();

      if (caseError || !caseData || caseData.status !== "Verified") {
        setError("This case is not available.");
        setLoading(false);
        return;
      }

      setCaseInfo({
        id: caseData.id,
        title: caseData.title,
        category: caseData.category,
        location: caseData.location,
      });

      const types = businessTypesForCategory(caseData.category);
      let query = supabase
        .from("vendors")
        .select("id, business_name, business_type, city")
        .eq("status", "verified");

      if (types) {
        query = query.in("business_type", types);
      }

      const { data: vendorsData, error: vendorsError } = await query;

      if (vendorsError) {
        setError(vendorsError.message);
        setLoading(false);
        return;
      }

      const vendorRows = vendorsData ?? [];
      const vendorIds = vendorRows.map((v) => v.id);

      let productCounts = new Map<string, number>();

      if (vendorIds.length > 0) {
        const { data: productsData } = await supabase
          .from("products")
          .select("vendor_id")
          .in("vendor_id", vendorIds)
          .eq("in_stock", true);

        productCounts = countProductsByVendor(productsData ?? []);
      }

      const mapped = sortVendorsByRecipientCity(
        vendorRows.map((v) => ({
          id: v.id,
          business_name: v.business_name,
          business_type: v.business_type,
          city: v.city,
          productCount: productCounts.get(v.id) ?? 0,
          nearRecipient: citiesMatch(v.city, caseData.location),
        })),
        caseData.location,
      );

      setVendors(mapped);
      setLoading(false);
    }

    loadVendors();
  }, [caseId]);

  const nearVendors = useMemo(
    () => vendors.filter((v) => v.nearRecipient),
    [vendors],
  );
  const otherVendors = useMemo(
    () => vendors.filter((v) => !v.nearRecipient),
    [vendors],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 via-white to-white">
        <p className="text-sm font-medium text-green-700">Loading vendors…</p>
      </div>
    );
  }

  function renderVendorCard(vendor: VendorOption) {
    return (
      <Link
        key={vendor.id}
        href={`/vendor/${vendor.id}?case=${caseId}`}
        className="block rounded-2xl border border-green-100 bg-white p-5 shadow-sm transition-all hover:border-green-300 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-green-900">
              {vendor.business_name}
            </h2>
            <p className="mt-0.5 text-sm text-gray-600">{vendor.business_type}</p>
            <p className="mt-1 text-sm text-gray-500">{vendor.city}, Pakistan</p>
          </div>
          <VerifiedBadge />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {vendor.nearRecipient && (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
              📍 Near recipient
            </span>
          )}
          <span className="text-xs font-medium text-gray-500">
            {vendor.productCount} product{vendor.productCount === 1 ? "" : "s"}
          </span>
        </div>
      </Link>
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

        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            href={`/cases/${caseId}`}
            className="text-sm font-medium text-green-700 transition-colors hover:text-green-800"
          >
            ← Back to Case
          </Link>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
            Choose a vendor to fulfill this need
          </h1>

          {caseInfo && (
            <p className="mt-2 text-sm text-gray-600">
              {caseInfo.title} · {caseInfo.category} in{" "}
              {caseInfo.location.split(",")[0].trim()}
            </p>
          )}

          {error && (
            <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!error && vendors.length === 0 && (
            <div className="mt-8 rounded-2xl border border-green-100 bg-white p-10 text-center shadow-sm">
              <p className="text-sm text-gray-600">
                No verified vendors are available for this category yet. Please
                check back soon.
              </p>
            </div>
          )}

          {nearVendors.length > 0 && (
            <section className="mt-8 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-green-700">
                Near recipient
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {nearVendors.map(renderVendorCard)}
              </div>
            </section>
          )}

          {otherVendors.length > 0 && (
            <section className={`space-y-4 ${nearVendors.length > 0 ? "mt-10" : "mt-8"}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-green-700">
                {nearVendors.length > 0 ? "Other cities" : "Available vendors"}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {otherVendors.map(renderVendorCard)}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

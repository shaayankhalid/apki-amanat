"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/send-email-client";
import { loadStoredReceipt } from "@/lib/store-cart";

type ReceiptItem = {
  name: string;
  quantity: number;
  price_pkr: number;
  line_total_pkr?: number;
};

type ReceiptDetails = {
  id: string;
  items: ReceiptItem[];
  total_pkr: number;
  created_at: string;
  caseTitle: string;
  vendorName: string;
  donorName: string;
  recipientEmail: string | null;
  recipientName: string;
  fromFallback?: boolean;
};

type StoredReceiptPayload = {
  receipt_id?: string;
  donor_name?: string;
  vendor_name?: string;
  case_title?: string;
  recipient_name?: string;
  recipient_email?: string | null;
  total?: number;
  date?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price_pkr?: number;
    pricePkr?: number;
    line_total_pkr?: number;
  }>;
};

function receiptFromSession(
  stored: StoredReceiptPayload,
  receiptId: string,
): ReceiptDetails {
  const items = (stored.items ?? []).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price_pkr: Number(item.price_pkr ?? item.pricePkr ?? 0),
    line_total_pkr: item.line_total_pkr,
  }));

  return {
    id: stored.receipt_id ?? receiptId,
    items,
    total_pkr: Number(stored.total ?? 0),
    created_at: stored.date ?? new Date().toISOString(),
    caseTitle: stored.case_title ?? "Verified case",
    vendorName: stored.vendor_name ?? "Vendor",
    donorName: stored.donor_name ?? "Donor",
    recipientEmail: stored.recipient_email ?? null,
    recipientName: stored.recipient_name ?? "Recipient",
    fromFallback: true,
  };
}

function formatPkr(amount: number) {
  return `Rs. ${Number(amount).toLocaleString()}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-green-700" aria-hidden="true">
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

function CheckoutSuccessContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = params.id as string;
  const receiptId = searchParams.get("receiptId");

  const [receipt, setReceipt] = useState<ReceiptDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReceipt() {
      if (!receiptId) {
        router.replace(`/vendor/${vendorId}`);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error: receiptError } = await supabase
        .from("receipts")
        .select(
          `
            id, items, total_pkr, created_at,
            donor:profiles!receipts_donor_id_fkey(full_name),
            recipient:profiles!receipts_recipient_id_fkey(full_name, email),
            vendors(business_name),
            cases(title)
          `,
        )
        .eq("id", receiptId)
        .single();

      if (receiptError || !data) {
        const stored = loadStoredReceipt(receiptId) as StoredReceiptPayload | null;
        if (stored?.items?.length) {
          setReceipt(receiptFromSession(stored, receiptId));
          setLoading(false);
          return;
        }

        setError("Receipt not found.");
        setLoading(false);
        return;
      }

      setReceipt({
        id: data.id,
        items: (data.items as ReceiptItem[]) ?? [],
        total_pkr: Number(data.total_pkr),
        created_at: data.created_at,
        caseTitle: data.cases?.title ?? "Verified case",
        vendorName: data.vendors?.business_name ?? "Vendor",
        donorName: data.donor?.full_name ?? "Donor",
        recipientEmail: data.recipient?.email ?? null,
        recipientName: data.recipient?.full_name ?? "Recipient",
      });
      setLoading(false);
    }

    loadReceipt();
  }, [receiptId, vendorId, router]);

  async function handleShareWithRecipient() {
    if (!receipt?.recipientEmail) {
      setShareMessage("Recipient email is not available.");
      return;
    }

    setSharing(true);
    setShareMessage("");

    await sendEmail({
      type: "store-receipt-recipient",
      to: receipt.recipientEmail,
      recipientName: receipt.recipientName,
      donorName: receipt.donorName,
      vendorName: receipt.vendorName,
      caseTitle: receipt.caseTitle,
      items: receipt.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        pricePkr: item.price_pkr,
      })),
      totalPkr: receipt.total_pkr,
    });

    setSharing(false);
    setShareMessage("Receipt sent to the recipient.");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 via-white to-white">
        <p className="text-sm font-medium text-green-700">Loading receipt…</p>
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
          {error || !receipt ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
              <p className="text-sm text-red-700">{error || "Receipt not found."}</p>
              <Link
                href={`/vendor/${vendorId}`}
                className="mt-4 inline-block text-sm font-semibold text-green-700 hover:text-green-800"
              >
                ← Back to Store
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <CheckIcon />
                </div>
                <h1 className="mt-6 text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
                  Order Confirmed
                </h1>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600">
                  Your payment is held by Apki Amanat until the recipient collects
                  their items from {receipt.vendorName}.
                </p>
                {receipt.fromFallback && (
                  <p className="mt-2 max-w-md text-xs text-amber-700">
                    Showing your saved order summary — full receipt details may
                    sync shortly.
                  </p>
                )}
              </div>

              <section className="mt-8 rounded-2xl border border-green-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                      Receipt
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-green-900">
                      #{receipt.id.slice(0, 8).toUpperCase()}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(receipt.created_at)}</p>
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-green-600">
                      Donor
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-green-900">
                      {receipt.donorName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-green-600">
                      Vendor
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-green-900">
                      {receipt.vendorName}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-green-600">
                      Case
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-green-900">
                      {receipt.caseTitle}
                    </dd>
                  </div>
                </dl>

                <ul className="mt-6 space-y-3 border-t border-green-100 pt-6">
                  {receipt.items.map((item, index) => (
                    <li
                      key={`${item.name}-${index}`}
                      className="flex items-start justify-between gap-4 text-sm"
                    >
                      <div>
                        <p className="font-medium text-green-900">{item.name}</p>
                        <p className="text-gray-500">
                          {item.quantity} × {formatPkr(item.price_pkr)}
                        </p>
                      </div>
                      <p className="font-semibold text-green-800">
                        {formatPkr(item.line_total_pkr ?? item.price_pkr * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between border-t border-green-100 pt-4 text-base font-bold text-green-900">
                  <span>Total</span>
                  <span>{formatPkr(receipt.total_pkr)}</span>
                </div>
              </section>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleShareWithRecipient}
                  disabled={sharing || !receipt.recipientEmail}
                  className="flex-1 rounded-xl border border-green-200 bg-white px-6 py-3 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sharing ? "Sending…" : "Share with Recipient"}
                </button>
                <Link
                  href="/cases"
                  className="flex-1 rounded-xl bg-green-700 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-green-700/25 transition-colors hover:bg-green-800"
                >
                  Browse More Cases
                </Link>
              </div>

              {shareMessage && (
                <p className="mt-4 text-center text-sm text-green-700">{shareMessage}</p>
              )}

              {!receipt.recipientEmail && (
                <p className="mt-4 text-center text-sm text-gray-500">
                  Recipient email is not on file, so sharing is unavailable.
                </p>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 via-white to-white">
          <p className="text-sm font-medium text-green-700">Loading receipt…</p>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/send-email-client";
import {
  buildReceiptPayload,
  clearStoreCart,
  formatCartItemsSummary,
  loadStoreCart,
  saveStoredReceipt,
} from "@/lib/store-cart";

type CartItem = {
  productId: string;
  name: string;
  pricePkr: number;
  quantity: number;
};

type SelectedCase = {
  id: string;
  title: string;
  category: string;
  location: string;
  user_id: string;
};

type VendorInfo = {
  id: string;
  business_name: string;
  profile_id: string;
};

function formatPkr(amount: number) {
  return `Rs. ${Number(amount).toLocaleString()}`;
}

export default function VendorCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = params.id as string;
  const caseId = searchParams.get("case");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [selectedCase, setSelectedCase] = useState<SelectedCase | null>(null);
  const [pledgeAccepted, setPledgeAccepted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.pricePkr * item.quantity, 0),
    [cart],
  );

  useEffect(() => {
    async function initCheckout() {
      if (!caseId) {
        router.replace(`/vendor/${vendorId}`);
        return;
      }

      const savedCart = loadStoreCart(vendorId) as CartItem[] | null;
      if (!savedCart?.length) {
        router.replace(`/vendor/${vendorId}?case=${caseId}`);
        return;
      }
      setCart(savedCart);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace(
          `/login?redirect=/vendor/${vendorId}/checkout?case=${caseId}`,
        );
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, verification_status, full_name, email")
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
      setDonorName(profile.full_name ?? "");
      setDonorEmail(profile.email ?? user.email ?? null);

      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("id, business_name, profile_id, status")
        .eq("id", vendorId)
        .single();

      if (vendorError || !vendorData || vendorData.status !== "verified") {
        setError("This store is not available.");
        setLoading(false);
        return;
      }

      setVendor(vendorData);

      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("id, title, category, location, user_id, status")
        .eq("id", caseId)
        .single();

      if (caseError || !caseData || caseData.status !== "Verified") {
        setError("The selected case is no longer available.");
        setLoading(false);
        return;
      }

      setSelectedCase(caseData);
      setLoading(false);
    }

    initCheckout();
  }, [vendorId, caseId, router]);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!userId || !vendor || !selectedCase || !cart.length) return;

    if (!pledgeAccepted) {
      setError("Please accept the non-discrimination pledge to continue.");
      return;
    }

    setSubmitting(true);

    const receiptItems = cart.map((item) => ({
      product_id: item.productId,
      name: item.name,
      quantity: item.quantity,
      price_pkr: item.pricePkr,
      line_total_pkr: item.pricePkr * item.quantity,
    }));

    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        donor_id: userId,
        case_id: selectedCase.id,
        vendor_id: vendor.id,
        amount_pkr: cartTotal,
        status: "pending",
      })
      .select("id")
      .single();

    if (donationError) {
      setError(donationError.message || "Unable to save your donation.");
      setSubmitting(false);
      return;
    }

    const { data: vendorOrder, error: orderError } = await supabase
      .from("vendor_orders")
      .insert({
        vendor_id: vendor.id,
        donor_id: userId,
        recipient_id: selectedCase.user_id,
        case_id: selectedCase.id,
        donation_id: donation.id,
        category: selectedCase.category,
        items_needed: formatCartItemsSummary(cart),
        amount_pkr: cartTotal,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError) {
      await supabase.from("donations").delete().eq("id", donation.id);
      setError(orderError.message || "Unable to create your vendor order.");
      setSubmitting(false);
      return;
    }

    const orderDate = new Date().toISOString();

    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", selectedCase.user_id)
      .single();

    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        donation_id: donation.id,
        vendor_order_id: vendorOrder.id,
        donor_id: userId,
        recipient_id: selectedCase.user_id,
        vendor_id: vendor.id,
        items: receiptItems,
        total_pkr: cartTotal,
        status: "pending",
      })
      .select("id")
      .single();

    if (receiptError) {
      await supabase.from("vendor_orders").delete().eq("id", vendorOrder.id);
      await supabase.from("donations").delete().eq("id", donation.id);
      setError(receiptError.message || "Unable to save your receipt.");
      setSubmitting(false);
      return;
    }

    const receiptJson = buildReceiptPayload({
      receiptId: receipt.id,
      donorName,
      vendorName: vendor.business_name,
      items: receiptItems,
      total: cartTotal,
      caseTitle: selectedCase.title,
      date: orderDate,
      recipientName: recipientProfile?.full_name ?? null,
      recipientEmail: recipientProfile?.email ?? null,
    });

    const { data: vendorProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", vendor.profile_id)
      .single();

    if (donorEmail) {
      sendEmail({
        type: "store-order-donor",
        to: donorEmail,
        donorName,
        vendorName: vendor.business_name,
        caseTitle: selectedCase.title,
        items: cart,
        totalPkr: cartTotal,
        receiptId: receipt.id,
      });
    }

    if (vendorProfile?.email) {
      sendEmail({
        type: "store-order-vendor",
        to: vendorProfile.email,
        vendorName: vendor.business_name,
        donorName,
        caseTitle: selectedCase.title,
        items: cart,
        totalPkr: cartTotal,
      });
    }

    clearStoreCart(vendorId);
    saveStoredReceipt(receipt.id, receiptJson);

    router.push(
      `/vendor/${vendorId}/checkout/success?receiptId=${receipt.id}&case=${selectedCase.id}`,
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 via-white to-white">
        <p className="text-sm font-medium text-green-700">Loading checkout…</p>
      </div>
    );
  }

  const backHref = caseId
    ? `/vendor/${vendorId}?case=${caseId}`
    : `/vendor/${vendorId}`;

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
            href={backHref}
            className="text-sm font-medium text-green-700 transition-colors hover:text-green-800"
          >
            ← Back to Store
          </Link>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
            Checkout
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Review your order before confirming.
          </p>

          {error && !vendor && (
            <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {vendor && selectedCase && (
            <form onSubmit={handleConfirm} className="mt-8 space-y-6">
              <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-semibold text-green-900">
                  Helping
                </h2>
                <p className="mt-2 text-sm font-medium text-green-900">
                  {selectedCase.title}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedCase.category} in{" "}
                  {selectedCase.location.split(",")[0].trim()}
                </p>
              </section>

              <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-semibold text-green-900">
                  Order Summary
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {vendor.business_name}
                </p>

                <ul className="mt-4 space-y-3">
                  {cart.map((item) => (
                    <li
                      key={item.productId}
                      className="flex items-start justify-between gap-4 text-sm"
                    >
                      <div>
                        <p className="font-medium text-green-900">{item.name}</p>
                        <p className="text-gray-500">
                          {item.quantity} × {formatPkr(item.pricePkr)}
                        </p>
                      </div>
                      <p className="font-semibold text-green-800">
                        {formatPkr(item.pricePkr * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between border-t border-green-100 pt-4 text-base font-bold text-green-900">
                  <span>Total</span>
                  <span>{formatPkr(cartTotal)}</span>
                </div>
              </section>

              <p className="rounded-lg border border-green-100 bg-green-50/60 px-4 py-3 text-sm leading-relaxed text-gray-700">
                Your payment will be held by Apki Amanat until the recipient
                collects their items.
              </p>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-green-100 bg-green-50/50 p-4">
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

              {typeof error === "string" && error.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-green-700 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-green-700/25 transition-all hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Confirming…" : "Confirm Order"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

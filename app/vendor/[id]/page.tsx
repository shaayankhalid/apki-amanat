"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ProductImage from "@/app/components/ProductImage";
import { supabase } from "@/lib/supabase";
import { saveStoreCart } from "@/lib/store-cart";

type CaseBanner = {
  id: string;
  title: string;
  category: string;
  location: string;
};

type VendorInfo = {
  id: string;
  business_name: string;
  business_type: string;
  city: string;
  status: string;
};

type StoreProduct = {
  id: string;
  name: string;
  description: string;
  price_pkr: number;
  category: string;
  image_url: string | null;
};

type CartItem = {
  productId: string;
  name: string;
  pricePkr: number;
  quantity: number;
};

function formatPkr(amount: number) {
  return `Rs. ${Number(amount).toLocaleString()}`;
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
      <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
      Verified Vendor
    </span>
  );
}

const inputClassName =
  "w-full rounded-lg border border-green-100 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20";

export default function VendorStorePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = params.id as string;
  const caseId = searchParams.get("case");

  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [caseBanner, setCaseBanner] = useState<CaseBanner | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStore() {
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("id, business_name, business_type, city, status")
        .eq("id", vendorId)
        .single();

      if (vendorError || !vendorData) {
        setError("Store not found.");
        setLoading(false);
        return;
      }

      if (vendorData.status !== "verified") {
        setError("This store is not available yet.");
        setLoading(false);
        return;
      }

      setVendor(vendorData);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, description, price_pkr, category, image_url")
        .eq("vendor_id", vendorId)
        .eq("in_stock", true)
        .order("name");

      if (productsError) {
        setError(productsError.message);
        setLoading(false);
        return;
      }

      setProducts(
        (productsData ?? []).map((p) => ({
          ...p,
          price_pkr: Number(p.price_pkr),
        })),
      );
      setLoading(false);
    }

    loadStore();
  }, [vendorId]);

  useEffect(() => {
    async function loadCaseBanner() {
      if (!caseId) {
        setCaseBanner(null);
        return;
      }

      const { data } = await supabase
        .from("cases")
        .select("id, title, category, location, status")
        .eq("id", caseId)
        .single();

      if (data?.status === "Verified") {
        setCaseBanner(data);
      } else {
        setCaseBanner(null);
      }
    }

    loadCaseBanner();
  }, [caseId]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p) => p.name.toLowerCase().includes(query));
  }, [products, search]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.pricePkr * item.quantity, 0),
    [cart],
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  function addToCart(product: StoreProduct) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          pricePkr: product.price_pkr,
          quantity: 1,
        },
      ];
    });
    setCartOpen(true);
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  function proceedToCheckout() {
    saveStoreCart(vendorId, cart);
    const checkoutUrl = caseId
      ? `/vendor/${vendorId}/checkout?case=${caseId}`
      : `/vendor/${vendorId}/checkout`;
    router.push(checkoutUrl);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 via-white to-white">
        <p className="text-sm font-medium text-green-700">Loading store…</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-green-50 via-white to-white pb-28 lg:pb-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
        >
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-100 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-green-50 blur-3xl" />
        </div>

        <div
          className={`relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 ${
            cartCount > 0 ? "lg:pr-[26rem]" : ""
          }`}
        >
          {error || !vendor ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
              <p className="text-sm text-red-700">{error || "Store not found."}</p>
              <Link
                href="/cases"
                className="mt-4 inline-block text-sm font-semibold text-green-700 hover:text-green-800"
              >
                ← Back to Cases
              </Link>
            </div>
          ) : (
            <>
              {caseBanner && (
                <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                    You are shopping to help
                  </p>
                  <p className="mt-1 text-sm font-medium text-green-900">
                    {caseBanner.title} — {caseBanner.category} in{" "}
                    {caseBanner.location.split(",")[0].trim()}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Vendor Store</p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
                      {vendor.business_name}
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                      {vendor.business_type} · {vendor.city}, Pakistan
                    </p>
                  </div>
                  <VerifiedBadge />
                </div>
              </div>

              <div className="mt-8">
                <label htmlFor="search" className="sr-only">
                  Search products
                </label>
                <input
                  id="search"
                  type="search"
                  placeholder="Search products by name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={inputClassName}
                />
              </div>

              {filteredProducts.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-green-100 bg-white p-10 text-center shadow-sm">
                  <p className="text-sm text-gray-600">
                    {products.length === 0
                      ? "No products in stock right now. Check back soon."
                      : "No products match your search."}
                  </p>
                </div>
              ) : (
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <article
                      key={product.id}
                      className="flex flex-col rounded-2xl border border-green-100 bg-white p-5 shadow-sm"
                    >
                      <ProductImage
                        name={product.name}
                        category={product.category}
                        imageUrl={product.image_url}
                        className="h-44 w-full"
                      />
                      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-green-600">
                        {product.category}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-green-900">
                        {product.name}
                      </h2>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                        {product.description || "No description provided."}
                      </p>
                      <p className="mt-4 text-base font-bold text-green-800">
                        {formatPkr(product.price_pkr)}
                      </p>
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="mt-4 w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
                      >
                        Add to Cart
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {cartCount > 0 && (
          <>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-green-700/30 transition-colors hover:bg-green-800 lg:hidden"
            >
              Cart ({cartCount}) · {formatPkr(cartTotal)}
            </button>

            <aside
              className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-green-100 bg-white shadow-xl transition-transform duration-300 lg:translate-x-0 ${
                cartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
              }`}
            >
              <div className="flex items-center justify-between border-b border-green-100 px-5 py-4">
                <h2 className="text-lg font-bold text-green-900">Your Cart</h2>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-green-50 lg:hidden"
                  aria-label="Close cart"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {cart.length === 0 ? (
                  <p className="text-sm text-gray-500">Your cart is empty.</p>
                ) : (
                  <ul className="space-y-4">
                    {cart.map((item) => (
                      <li
                        key={item.productId}
                        className="rounded-xl border border-green-100 bg-green-50/30 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-green-900">{item.name}</p>
                            <p className="mt-0.5 text-sm text-green-800">
                              {formatPkr(item.pricePkr)} each
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 bg-white text-green-800 hover:bg-green-50"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="min-w-[2rem] text-center text-sm font-semibold text-green-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 bg-white text-green-800 hover:bg-green-50"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-green-800">
                            {formatPkr(item.pricePkr * item.quantity)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-green-100 px-5 py-4">
                <div className="flex items-center justify-between text-base font-bold text-green-900">
                  <span>Total</span>
                  <span>{formatPkr(cartTotal)}</span>
                </div>
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={proceedToCheckout}
                  className="mt-4 w-full rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-700/25 transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Proceed to Checkout
                </button>
              </div>
            </aside>

            {cartOpen && (
              <button
                type="button"
                aria-label="Close cart overlay"
                className="fixed inset-0 z-40 bg-green-900/20 backdrop-blur-sm lg:hidden"
                onClick={() => setCartOpen(false)}
              />
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductImage from "@/app/components/ProductImage";
import { supabase } from "@/lib/supabase";
import {
  uploadProductImage,
  validateProductImage,
} from "@/lib/product-images";

type OrderTab = "pending" | "completed" | "products";
type VerificationStatus = "pending" | "verified" | "suspended";
type ProductCategory = "Medicine" | "Food" | "Grocery" | "Stationery" | "Other";

const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Medicine",
  "Food",
  "Grocery",
  "Stationery",
  "Other",
];

type VendorRecord = {
  id: string;
  business_name: string;
  business_type: string;
  business_address: string;
  city: string;
  status: VerificationStatus;
};

type OrderRow = {
  id: string;
  category: string;
  items_needed: string;
  amount_pkr: number;
  status: string;
  assigned_at: string;
  recipient_id: string | null;
  case_id: string | null;
  donor: { full_name: string } | null;
  recipient: { full_name: string } | null;
  cases: { title: string; description: string; location: string } | null;
};

type VendorOrder = {
  id: string;
  recipientFirstName: string;
  category: string;
  itemsNeeded: string;
  amountPkr: number;
  assignedAt: string;
  status: string;
  caseTitle: string;
  caseDescription: string;
  caseLocation: string;
};

type Product = {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price_pkr: number;
  category: ProductCategory;
  in_stock: boolean;
  image_url: string | null;
};

const inputClassName =
  "w-full rounded-lg border border-green-100 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20";

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

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "Recipient";
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

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const verified = status === "verified";
  const suspended = status === "suspended";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        verified
          ? "bg-green-100 text-green-800"
          : suspended
            ? "bg-red-50 text-red-800 ring-1 ring-red-200"
            : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          verified ? "bg-green-600" : suspended ? "bg-red-500" : "bg-amber-500"
        }`}
      />
      {verified ? "Verified Vendor" : suspended ? "Suspended" : "Pending Verification"}
    </span>
  );
}

function ProductModal({
  product,
  saving,
  onClose,
  onSave,
}: {
  product: Product | null;
  saving: boolean;
  onClose: () => void;
  onSave: (
    values: {
      name: string;
      description: string;
      price_pkr: number;
      category: ProductCategory;
      in_stock: boolean;
    },
    imageFile: File | null,
  ) => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price_pkr) : "");
  const [category, setCategory] = useState<ProductCategory>(
    product?.category ?? "Medicine",
  );
  const [inStock, setInStock] = useState(product?.in_stock ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    product?.image_url ?? null,
  );
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreviewUrl(product?.image_url ?? null);
  }, [imageFile, product?.image_url]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleImageChange(fileList: FileList | null) {
    setImageError("");
    if (!fileList?.length) {
      setImageFile(null);
      return;
    }

    const file = fileList[0];
    const validationError = validateProductImage(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }

    setImageFile(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pricePkr = Number(price);
    if (!name.trim() || !pricePkr || pricePkr <= 0) return;
    onSave(
      {
        name: name.trim(),
        description: description.trim(),
        price_pkr: pricePkr,
        category,
        in_stock: inStock,
      },
      imageFile,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-green-900/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-green-100 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-green-900">
            {product ? "Edit Product" : "Add Product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-green-50 hover:text-green-800"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Product Image
            </label>
            <div className="overflow-hidden rounded-xl border border-green-100">
              <ProductImage
                name={name || "Product"}
                category={category}
                imageUrl={previewUrl}
                className="h-44 w-full"
              />
            </div>
            <input
              id="productImage"
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => handleImageChange(e.target.files)}
              className="mt-2 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-green-800"
            />
            <p className="mt-1 text-xs text-gray-500">JPG or PNG, max 2 MB</p>
            {imageError && (
              <p className="mt-1 text-xs text-red-600">{imageError}</p>
            )}
          </div>

          <div>
            <label htmlFor="productName" className="mb-1.5 block text-sm font-medium text-gray-700">
              Product Name
            </label>
            <input
              id="productName"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
              placeholder="Product name"
            />
          </div>

          <div>
            <label htmlFor="productDescription" className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="productDescription"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClassName}
              placeholder="Describe this product"
            />
          </div>

          <div>
            <label htmlFor="productPrice" className="mb-1.5 block text-sm font-medium text-gray-700">
              Price (PKR)
            </label>
            <input
              id="productPrice"
              type="number"
              required
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClassName}
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="productCategory" className="mb-1.5 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="productCategory"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className={inputClassName}
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-green-100 bg-green-50/50 px-4 py-3">
            <span className="text-sm font-medium text-gray-700">In Stock</span>
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="h-4 w-4 rounded border-green-300 text-green-700 focus:ring-green-600"
            />
          </label>

          <button
            type="submit"
            disabled={saving || !!imageError}
            className="w-full rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-700/25 transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : product ? "Save Changes" : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
}

function OrderDetailModal({
  order,
  onClose,
}: {
  order: VendorOrder;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-green-900/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-green-100 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-green-900">Order Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-green-50 hover:text-green-800"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-gray-500">Recipient</dt>
            <dd className="font-medium text-green-900">{order.recipientFirstName}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Category</dt>
            <dd className="text-green-900">{order.category}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Items needed</dt>
            <dd className="text-green-900">{order.itemsNeeded}</dd>
          </div>
          {order.caseDescription && (
            <div>
              <dt className="text-gray-500">Description</dt>
              <dd className="leading-relaxed text-gray-600">{order.caseDescription}</dd>
            </div>
          )}
          {order.caseLocation && (
            <div>
              <dt className="text-gray-500">Location</dt>
              <dd className="text-green-900">{order.caseLocation}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500">Amount</dt>
            <dd className="font-semibold text-green-800">{formatPkr(order.amountPkr)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Assigned</dt>
            <dd className="text-green-900">{formatDate(order.assignedAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default function VendorDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<VendorRecord | null>(null);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<OrderTab>("pending");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSaving, setProductSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchData = useCallback(async () => {
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "vendor") {
      router.replace("/dashboard");
      return;
    }

    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("id, business_name, business_type, business_address, city, status")
      .eq("profile_id", user.id)
      .single();

    if (vendorError || !vendorData) {
      setError(vendorError?.message ?? "Vendor profile not found.");
      setLoading(false);
      return;
    }

    setVendor({
      ...vendorData,
      status: (vendorData.status ?? "pending") as VerificationStatus,
    });

    const { data: ordersData, error: ordersError } = await supabase
      .from("vendor_orders")
      .select(
        "id, category, items_needed, amount_pkr, status, assigned_at, recipient_id, case_id, donor:profiles!donor_id(full_name), recipient:profiles!recipient_id(full_name), cases(title, description, location)",
      )
      .eq("vendor_id", vendorData.id)
      .order("assigned_at", { ascending: false });

    if (ordersError) {
      setError(ordersError.message);
      setLoading(false);
      return;
    }

    setOrders(
      ((ordersData as OrderRow[]) ?? []).map((row) => ({
        id: row.id,
        recipientFirstName: row.recipient?.full_name
          ? firstName(row.recipient.full_name)
          : "Recipient",
        category: row.category,
        itemsNeeded: row.items_needed,
        amountPkr: Number(row.amount_pkr),
        assignedAt: row.assigned_at,
        status: row.status,
        caseTitle: row.cases?.title ?? row.items_needed,
        caseDescription: row.cases?.description ?? "",
        caseLocation: row.cases?.location ?? "",
      })),
    );

    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select(
        "id, vendor_id, name, description, price_pkr, category, in_stock, image_url",
      )
      .eq("vendor_id", vendorData.id)
      .order("created_at", { ascending: false });

    if (productsError) {
      setError(productsError.message);
      setLoading(false);
      return;
    }

    setProducts(
      (productsData ?? []).map((p) => ({
        ...p,
        price_pkr: Number(p.price_pkr),
        category: p.category as ProductCategory,
      })),
    );
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function markFulfilled(orderId: string) {
    setActionLoading(orderId);
    setError("");

    const { error: updateError } = await supabase
      .from("vendor_orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      setError(updateError.message);
      setActionLoading(null);
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "completed" } : o,
      ),
    );
    setActionLoading(null);
  }

  async function toggleProductStock(productId: string, inStock: boolean) {
    setError("");
    const { error: updateError } = await supabase
      .from("products")
      .update({ in_stock: inStock })
      .eq("id", productId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, in_stock: inStock } : p)),
    );
  }

  async function deleteProduct(productId: string) {
    setError("");
    setActionLoading(productId);

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      setError(deleteError.message);
      setActionLoading(null);
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setActionLoading(null);
  }

  async function saveProduct(
    values: {
      name: string;
      description: string;
      price_pkr: number;
      category: ProductCategory;
      in_stock: boolean;
    },
    imageFile: File | null,
  ) {
    if (!vendor) return;

    setProductSaving(true);
    setError("");

    try {
      if (editingProduct) {
        let imageUrl = editingProduct.image_url;

        if (imageFile) {
          imageUrl = await uploadProductImage(
            supabase,
            vendor.id,
            editingProduct.id,
            imageFile,
          );
        }

        const { data, error: updateError } = await supabase
          .from("products")
          .update({ ...values, image_url: imageUrl })
          .eq("id", editingProduct.id)
          .select(
            "id, vendor_id, name, description, price_pkr, category, in_stock, image_url",
          )
          .single();

        if (updateError) {
          setError(updateError.message);
          setProductSaving(false);
          return;
        }

        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...data,
                  price_pkr: Number(data.price_pkr),
                  category: data.category as ProductCategory,
                }
              : p,
          ),
        );
      } else {
        const { data, error: insertError } = await supabase
          .from("products")
          .insert({ ...values, vendor_id: vendor.id, image_url: null })
          .select(
            "id, vendor_id, name, description, price_pkr, category, in_stock, image_url",
          )
          .single();

        if (insertError) {
          setError(insertError.message);
          setProductSaving(false);
          return;
        }

        let savedProduct = {
          ...data,
          price_pkr: Number(data.price_pkr),
          category: data.category as ProductCategory,
        };

        if (imageFile) {
          const imageUrl = await uploadProductImage(
            supabase,
            vendor.id,
            data.id,
            imageFile,
          );

          const { data: updated, error: imageUpdateError } = await supabase
            .from("products")
            .update({ image_url: imageUrl })
            .eq("id", data.id)
            .select(
              "id, vendor_id, name, description, price_pkr, category, in_stock, image_url",
            )
            .single();

          if (imageUpdateError) {
            setError(
              imageUpdateError.message ||
                "Product saved but the image could not be uploaded.",
            );
            setProducts((prev) => [savedProduct, ...prev]);
            setProductSaving(false);
            setProductModalOpen(false);
            setEditingProduct(null);
            return;
          }

          savedProduct = {
            ...updated,
            price_pkr: Number(updated.price_pkr),
            category: updated.category as ProductCategory,
          };
        }

        setProducts((prev) => [savedProduct, ...prev]);
      }

      setProductSaving(false);
      setProductModalOpen(false);
      setEditingProduct(null);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload product image.";
      setError(message);
      setProductSaving(false);
    }
  }

  function openAddProduct() {
    setEditingProduct(null);
    setProductModalOpen(true);
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product);
    setProductModalOpen(true);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) =>
        activeTab === "pending" ? o.status === "pending" : o.status === "completed",
      ),
    [orders, activeTab],
  );

  if (loading) {
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
        <nav className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <LogoIcon />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight text-green-900">
                Apki Amanat
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-green-600">
                Vendor Portal
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 disabled:opacity-60"
          >
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </nav>
      </header>

      <main className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        {vendor && (
          <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-lg shadow-green-900/5 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Welcome back</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
                  {vendor.business_name}
                </h1>
              </div>
              <VerificationBadge status={vendor.status} />
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="mt-8">
          <div className="mb-4 flex gap-1 rounded-xl border border-green-100 bg-white p-1 shadow-sm">
            {(
              [
                { id: "pending" as const, label: "Pending Orders" },
                { id: "completed" as const, label: "Completed Orders" },
                { id: "products" as const, label: "My Products" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4 ${
                  activeTab === tab.id
                    ? "bg-green-700 text-white shadow-sm"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "products" ? (
            <div>
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={openAddProduct}
                  className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800"
                >
                  Add Product
                </button>
              </div>

              {products.length === 0 ? (
                <div className="rounded-2xl border border-green-100 bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
                    🛒
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-gray-600">
                    Add your first product so donors can shop from your store
                  </p>
                  <button
                    type="button"
                    onClick={openAddProduct}
                    className="mt-4 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
                  >
                    Add Product
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {products.map((product) => (
                    <article
                      key={product.id}
                      className="flex flex-col rounded-2xl border border-green-100 bg-white p-5 shadow-sm"
                    >
                      <ProductImage
                        name={product.name}
                        category={product.category}
                        imageUrl={product.image_url}
                        className="h-40 w-full"
                      />
                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                            {product.category}
                          </p>
                          <h2 className="mt-1 text-lg font-semibold text-green-900">
                            {product.name}
                          </h2>
                        </div>
                        <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-gray-600">
                          <span>In stock</span>
                          <input
                            type="checkbox"
                            checked={product.in_stock}
                            onChange={(e) =>
                              toggleProductStock(product.id, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-green-300 text-green-700 focus:ring-green-600"
                          />
                        </label>
                      </div>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                        {product.description || "No description"}
                      </p>
                      <p className="mt-3 text-base font-bold text-green-800">
                        {formatPkr(product.price_pkr)}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditProduct(product)}
                          className="flex-1 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === product.id}
                          onClick={() => deleteProduct(product.id)}
                          className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-green-100 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
                📦
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                No orders yet — you&apos;ll be notified when a donor selects your
                store
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-sm font-medium text-green-600">
                        For {order.recipientFirstName}
                      </p>
                      <h2 className="text-lg font-semibold text-green-900">
                        {order.category}
                      </h2>
                      <p className="text-sm text-gray-600">{order.itemsNeeded}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="font-semibold text-green-800">
                          {formatPkr(order.amountPkr)}
                        </span>
                        <span>Assigned {formatDate(order.assignedAt)}</span>
                      </div>
                    </div>

                    {order.status === "pending" && (
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          disabled={actionLoading === order.id}
                          onClick={() => markFulfilled(order.id)}
                          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:opacity-60"
                        >
                          Mark as Fulfilled
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
                        >
                          View Details
                        </button>
                      </div>
                    )}

                    {order.status === "completed" && (
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="shrink-0 rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {vendor && (
          <section className="mt-8 rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-green-900">My Store</h2>
              <Link
                href={`/vendor/${vendor.id}`}
                className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
              >
                View Public Store →
              </Link>
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-green-600">
                  Business name
                </dt>
                <dd className="mt-1 text-sm font-medium text-green-900">
                  {vendor.business_name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-green-600">
                  Type
                </dt>
                <dd className="mt-1 text-sm text-green-900">{vendor.business_type}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-green-600">
                  Address
                </dt>
                <dd className="mt-1 text-sm text-green-900">
                  {vendor.business_address}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-green-600">
                  City
                </dt>
                <dd className="mt-1 text-sm text-green-900">{vendor.city}</dd>
              </div>
            </dl>
          </section>
        )}
      </main>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {productModalOpen && (
        <ProductModal
          key={editingProduct?.id ?? "new"}
          product={editingProduct}
          saving={productSaving}
          onClose={() => {
            setProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={saveProduct}
        />
      )}
    </div>
  );
}

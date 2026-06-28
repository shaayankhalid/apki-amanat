"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/app/components/AuthShell";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  "Medicine",
  "Food",
  "School Fees",
  "Wedding Expenses",
  "Other",
] as const;

const DOCUMENT_SLOTS = [
  { key: "id", label: "ID Document", hint: "CNIC or government-issued ID" },
  { key: "proof", label: "Proof Document", hint: "Bill, prescription, or fee notice" },
  { key: "supporting", label: "Supporting Document", hint: "Any additional supporting file" },
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const inputClassName =
  "w-full rounded-lg border border-green-100 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default function SubmitCasePage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Medicine");
  const [description, setDescription] = useState("");
  const [amountPkr, setAmountPkr] = useState("");
  const [location, setLocation] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({
    id: null,
    proof: null,
    supporting: null,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || profile?.role !== "recipient") {
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setAuthChecking(false);
    }

    checkAccess();
  }, [router]);

  function handleFileChange(key: string, fileList: FileList | null) {
    if (!fileList?.length) {
      setFiles((prev) => ({ ...prev, [key]: null }));
      return;
    }

    const file = fileList[0];

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload PDF, JPG, or PNG files only.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Each file must be 5 MB or smaller.");
      return;
    }

    setError("");
    setFiles((prev) => ({ ...prev, [key]: file }));
  }

  async function uploadDocuments(uid: string, caseId: string) {
    const paths: string[] = [];

    for (const slot of DOCUMENT_SLOTS) {
      const file = files[slot.key];
      if (!file) continue;

      const path = `${uid}/${caseId}/${slot.key}-${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("case-documents")
        .upload(path, file);

      if (uploadError) {
        throw uploadError;
      }

      paths.push(path);
    }

    return paths;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("Submit case — user id:", user?.id ?? null);

    if (userError || !user) {
      setError(userError?.message ?? "You must be logged in to submit a case.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a case title.");
      return;
    }
    if (!description.trim()) {
      setError("Please describe your situation.");
      return;
    }
    if (!amountPkr || Number(amountPkr) <= 0) {
      setError("Please enter a valid amount in PKR.");
      return;
    }
    if (!location.trim()) {
      setError("Please enter your city in Pakistan.");
      return;
    }

    setLoading(true);

    try {
      const caseId = crypto.randomUUID();
      const documentUrls = await uploadDocuments(user.id, caseId);

      const { error: insertError } = await supabase.from("cases").insert({
        id: caseId,
        user_id: user.id,
        title: title.trim(),
        category,
        description: description.trim(),
        amount_pkr: Number(amountPkr),
        location: location.trim(),
        document_urls: documentUrls,
        status: "Pending",
      });

      if (insertError) {
        console.error("Supabase cases insert error:", insertError);
        setError(insertError.message);
        return;
      }

      router.push("/dashboard?submitted=case");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      console.error("Submit case error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (authChecking) {
    return (
      <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-green-50 via-white to-white">
        <p className="text-sm font-medium text-green-700">Loading…</p>
      </div>
    );
  }

  return (
    <AuthShell
      wide
      title="Submit a Case"
      subtitle="Tell us what you need. Our team will review your request within 48 hours."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-gray-700">
            Case Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClassName}
            placeholder='e.g. "Medicine for my mother"'
          />
        </div>

        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            className={inputClassName}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClassName} resize-y`}
            placeholder="Explain your situation and why you need help…"
          />
        </div>

        <div>
          <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-gray-700">
            Amount Needed (PKR)
          </label>
          <input
            id="amount"
            type="number"
            required
            min="1"
            step="1"
            value={amountPkr}
            onChange={(e) => setAmountPkr(e.target.value)}
            className={inputClassName}
            placeholder="5000"
          />
        </div>

        <div>
          <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            id="location"
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClassName}
            placeholder="City in Pakistan"
          />
        </div>

        <fieldset>
          <legend className="mb-3 text-sm font-medium text-gray-700">
            Document Upload{" "}
            <span className="font-normal text-gray-500">(up to 3 files)</span>
          </legend>
          <div className="space-y-3">
            {DOCUMENT_SLOTS.map((slot) => (
              <div
                key={slot.key}
                className="rounded-lg border border-dashed border-green-200 bg-green-50/30 p-4"
              >
                <label
                  htmlFor={`file-${slot.key}`}
                  className="block text-sm font-medium text-green-900"
                >
                  {slot.label}
                </label>
                <p className="mt-0.5 text-xs text-gray-500">{slot.hint}</p>
                <input
                  id={`file-${slot.key}`}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => handleFileChange(slot.key, e.target.files)}
                  className="mt-2 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-green-800"
                />
                {files[slot.key] && (
                  <p className="mt-1.5 text-xs text-green-700">
                    Selected: {files[slot.key]?.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-green-700 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-green-700/25 transition-all hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit Case"}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex flex-1 items-center justify-center rounded-xl border-2 border-green-700 bg-white px-6 py-3 text-base font-semibold text-green-700 transition-all hover:bg-green-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

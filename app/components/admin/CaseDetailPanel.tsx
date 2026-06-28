"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/send-email-client";

type CaseStatus = "Pending" | "Verified" | "Rejected" | "Funded" | "Closed";

type SubmitterProfile = {
  full_name: string;
  phone: string;
  country: string;
  email: string | null;
};

type DocumentSlot = "id" | "proof" | "supporting";

type CaseDocument = {
  slot: DocumentSlot;
  label: string;
  path: string;
  url: string | null;
  isImage: boolean;
};

export type CaseDetail = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  amount_pkr: number;
  location: string;
  status: CaseStatus;
  created_at: string;
  admin_notes: string | null;
  submitterName: string;
  submitter: SubmitterProfile | null;
  documents: CaseDocument[];
};

const DOCUMENT_SLOTS: { key: DocumentSlot; label: string }[] = [
  { key: "id", label: "ID Document" },
  { key: "proof", label: "Proof Document" },
  { key: "supporting", label: "Supporting Document" },
];

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

function detectSlot(path: string): DocumentSlot | null {
  if (path.includes("/id-")) return "id";
  if (path.includes("/proof-")) return "proof";
  if (path.includes("/supporting-")) return "supporting";
  return null;
}

function isImagePath(path: string) {
  return /\.(jpe?g|png|webp|gif)$/i.test(path);
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

type CaseDetailPanelProps = {
  caseId: string;
  submitterName: string;
  onClose: () => void;
  onStatusChange: (
    caseId: string,
    status: "Verified" | "Rejected",
  ) => Promise<boolean>;
  actionLoading: boolean;
};

export default function CaseDetailPanel({
  caseId,
  submitterName,
  onClose,
  onStatusChange,
  actionLoading,
}: CaseDetailPanelProps) {
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      setError("");

      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select(
          "id, user_id, title, category, description, amount_pkr, location, status, created_at, document_urls, admin_notes",
        )
        .eq("id", caseId)
        .single();

      if (caseError || !caseData) {
        setError(caseError?.message ?? "Unable to load case details.");
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, country, email")
        .eq("id", caseData.user_id)
        .single();

      const paths: string[] = caseData.document_urls ?? [];
      const pathsBySlot = new Map<DocumentSlot, string>();

      for (const path of paths) {
        const slot = detectSlot(path);
        if (slot && !pathsBySlot.has(slot)) {
          pathsBySlot.set(slot, path);
        }
      }

      const documents: CaseDocument[] = await Promise.all(
        DOCUMENT_SLOTS.map(async ({ key, label }) => {
          const path = pathsBySlot.get(key);
          if (!path) {
            return { slot: key, label, path: "", url: null, isImage: false };
          }

          const { data: signedData } = await supabase.storage
            .from("case-documents")
            .createSignedUrl(path, 3600);

          return {
            slot: key,
            label,
            path,
            url: signedData?.signedUrl ?? null,
            isImage: isImagePath(path),
          };
        }),
      );

      setDetail({
        id: caseData.id,
        user_id: caseData.user_id,
        title: caseData.title,
        category: caseData.category,
        description: caseData.description,
        amount_pkr: Number(caseData.amount_pkr),
        location: caseData.location,
        status: caseData.status as CaseStatus,
        created_at: caseData.created_at,
        admin_notes: caseData.admin_notes,
        submitterName: profile?.full_name ?? submitterName,
        submitter: profile,
        documents,
      });
      setAdminNotes(caseData.admin_notes ?? "");
      setLoading(false);
    }

    loadDetail();
  }, [caseId, submitterName]);

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

  async function saveAdminNotes() {
    setSavingNotes(true);
    setNotesSaved(false);
    setError("");

    const { error: updateError } = await supabase
      .from("cases")
      .update({ admin_notes: adminNotes.trim() || null })
      .eq("id", caseId);

    if (updateError) {
      setError(updateError.message);
      setSavingNotes(false);
      return;
    }

    setDetail((prev) =>
      prev ? { ...prev, admin_notes: adminNotes.trim() || null } : prev,
    );
    setNotesSaved(true);
    setSavingNotes(false);
  }

  async function handleStatusChange(status: "Verified" | "Rejected") {
    const success = await onStatusChange(caseId, status);
    if (!success) return;

    setDetail((prev) => (prev ? { ...prev, status } : prev));

    const recipientEmail = detail?.submitter?.email;
    if (recipientEmail) {
      sendEmail({
        type: status === "Verified" ? "case-verified" : "case-rejected",
        to: recipientEmail,
        caseTitle: detail?.title ?? "Your case",
        recipientName: detail?.submitter?.full_name,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-green-900/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-green-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-green-900">Case Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-green-50 hover:text-green-800"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {loading ? (
            <p className="text-sm text-gray-500">Loading case details…</p>
          ) : error && !detail ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : detail ? (
            <div className="space-y-6">
              <section>
                <div className="flex flex-wrap items-center gap-2">
                  <CaseStatusBadge status={detail.status} />
                  <span className="text-xs text-gray-500">
                    Submitted {formatDate(detail.created_at)}
                  </span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-green-900">
                  {detail.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-green-600">
                  {detail.category}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {detail.description}
                </p>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>📍 {detail.location}</p>
                  <p className="font-semibold text-green-800">
                    {formatPkr(detail.amount_pkr)} needed
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-green-100 bg-green-50/40 p-4">
                <h4 className="text-sm font-semibold text-green-900">
                  Submitter
                </h4>
                {detail.submitter ? (
                  <dl className="mt-3 space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Full name</dt>
                      <dd className="font-medium text-green-900">
                        {detail.submitter.full_name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Phone</dt>
                      <dd className="text-green-900">{detail.submitter.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Country</dt>
                      <dd className="text-green-900">{detail.submitter.country}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Email</dt>
                      <dd className="text-green-900">
                        {detail.submitter.email ?? "Not on file"}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">
                    Submitter profile not found.
                  </p>
                )}
              </section>

              <section>
                <h4 className="text-sm font-semibold text-green-900">
                  Uploaded Documents
                </h4>
                <div className="mt-3 space-y-3">
                  {detail.documents.map((doc) => (
                    <div
                      key={doc.slot}
                      className="rounded-xl border border-green-100 bg-white p-4"
                    >
                      <p className="text-sm font-medium text-green-900">
                        {doc.label}
                      </p>
                      {doc.url ? (
                        <div className="mt-2">
                          {doc.isImage ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-lg border border-green-100"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={doc.url}
                                alt={doc.label}
                                className="max-h-40 w-full object-cover transition-opacity hover:opacity-90"
                              />
                            </a>
                          ) : null}
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800"
                          >
                            Open in new tab
                            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M6 3h7v7M13 3L6 10" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </a>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-gray-400">Not uploaded</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <label
                  htmlFor="admin-notes"
                  className="text-sm font-semibold text-green-900"
                >
                  Admin Notes
                </label>
                <textarea
                  id="admin-notes"
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => {
                    setAdminNotes(e.target.value);
                    setNotesSaved(false);
                  }}
                  placeholder="Internal notes about this case…"
                  className="mt-2 w-full resize-y rounded-lg border border-green-100 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                />
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={saveAdminNotes}
                    disabled={savingNotes}
                    className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:opacity-60"
                  >
                    {savingNotes ? "Saving…" : "Save Notes"}
                  </button>
                  {notesSaved && (
                    <span className="text-sm text-green-700">Notes saved</span>
                  )}
                </div>
              </section>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          ) : null}
        </div>

        {detail?.status === "Pending" && (
          <div className="flex gap-3 border-t border-green-100 px-5 py-4">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleStatusChange("Verified")}
              className="flex-1 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:opacity-60"
            >
              Verify
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleStatusChange("Rejected")}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

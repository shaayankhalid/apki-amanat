"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/app/components/AuthShell";
import { supabase } from "@/lib/supabase";
import { getAuthErrorMessage } from "@/lib/auth-errors";

type Role = "donor" | "recipient" | "vendor" | null;

const COUNTRIES = ["Pakistan", "Canada", "USA"] as const;

const BUSINESS_TYPES = [
  "Pharmacy",
  "Grocery Store",
  "School",
  "Other",
] as const;

const ICON_STROKE = 1.75;

function RoleIconWrapper({
  selected,
  children,
}: {
  selected: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
        selected ? "bg-green-700" : "bg-green-100"
      }`}
    >
      <div
        className={`h-10 w-10 transition-colors ${
          selected ? "text-white" : "text-green-800"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function DonateIcon() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M11 25.5c-3.5-2-3.5-8.5 1-10.5s5.5 2 5.5 5.5"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M29 25.5c3.5-2 3.5-8.5-1-10.5s-5.5 2-5.5 5.5"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 27.5c2.5 2.5 9.5 2.5 12 0"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
      />
      <ellipse
        cx="20"
        cy="13.5"
        rx="3"
        ry="2"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
      />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M20 7.5c-1.2 1.6-3.2 2-3.2 3.8c0 1.2 1 2 2.2 1.5"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 7.5c1.2 1.6 3.2 2 3.2 3.8c0 1.2-1 2-2.2 1.5"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="20"
        cy="18"
        r="4"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
      />
      <path
        d="M11.5 30c0-4.5 3.8-8 8.5-8s8.5 3.5 8.5 8"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
      />
    </svg>
  );
}

function VendorIcon() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M8 17h24M10 17l2-6h16l2 6"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 17v2M15 17v2M19 17v2M23 17v2M27 17v2"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
      />
      <rect
        x="10"
        y="19"
        width="20"
        height="13"
        rx="1.5"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
      />
      <rect
        x="17"
        y="25"
        width="6"
        height="7"
        rx="0.75"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
      />
      <path
        d="M20 25v7"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
      />
    </svg>
  );
}

function RoleCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center rounded-xl border-2 p-6 text-center transition-all ${
        selected
          ? "border-green-700 bg-green-50 shadow-md shadow-green-700/10"
          : "border-green-100 bg-white hover:border-green-300 hover:bg-green-50/50"
      }`}
    >
      <RoleIconWrapper selected={selected}>{icon}</RoleIconWrapper>
      <span className="text-base font-semibold text-green-900">{title}</span>
      <span className="mt-1 text-sm text-gray-600">{description}</span>
    </button>
  );
}

const inputClassName =
  "w-full rounded-lg border border-green-100 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>("Pakistan");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] =
    useState<(typeof BUSINESS_TYPES)[number]>("Pharmacy");
  const [businessAddress, setBusinessAddress] = useState("");
  const [vendorCity, setVendorCity] = useState("");
  const [pledgeAccepted, setPledgeAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function selectRole(nextRole: Exclude<Role, null>) {
    setRole(nextRole);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!role) {
      setError("Please choose how you would like to join.");
      return;
    }
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (role === "donor" && !pledgeAccepted) {
      setError("Please accept the non-discrimination pledge to continue.");
      return;
    }
    if (role === "recipient" && !privacyAccepted) {
      setError("Please accept the privacy policy to continue.");
      return;
    }
    if (role === "vendor") {
      if (!businessName.trim()) {
        setError("Please enter your business name.");
        return;
      }
      if (!businessAddress.trim()) {
        setError("Please enter your business address.");
        return;
      }
      if (!vendorCity.trim()) {
        setError("Please enter your city in Pakistan.");
        return;
      }
    }

    const profileCountry = role === "vendor" ? "Pakistan" : country;

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            country: profileCountry,
            role,
            ...(role === "vendor" && {
              business_name: businessName.trim(),
              business_type: businessType,
              business_address: businessAddress.trim(),
              city: vendorCity.trim(),
            }),
          },
        },
      });

      if (authError) {
        setError(getAuthErrorMessage(authError));
        return;
      }

      if (!authData.user) {
        setError("Unable to create your account. Please try again.");
        return;
      }

      const userId = authData.user.id;

      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        full_name: fullName.trim(),
        email: email.trim(),
        role,
        phone: phone.trim(),
        country: profileCountry,
        verification_status: "pending",
      });

      if (profileError) {
        setError(
          getAuthErrorMessage(profileError) ||
            "Unable to save your profile. Please try again.",
        );
        return;
      }

      if (role === "vendor") {
        const { error: vendorError } = await supabase.from("vendors").insert({
          profile_id: userId,
          business_name: businessName.trim(),
          business_type: businessType,
          business_address: businessAddress.trim(),
          city: vendorCity.trim(),
          status: "pending",
        });

        if (vendorError) {
          setError(
            vendorError.message ||
              "Unable to save your vendor details. Please try again.",
          );
          return;
        }
      }

      if (!authData.session) {
        setSuccess(
          "Account created! Please check your email to confirm your account, then log in.",
        );
        return;
      }

      setSuccess("Account created successfully! Redirecting to your dashboard…");
      setTimeout(
        () => router.push(role === "vendor" ? "/vendor" : "/dashboard"),
        1500,
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      wide
      title="Create your account"
      subtitle="Join Apki Amanat and connect with our trusted community."
    >
      <div className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-medium text-green-900">
            I am joining as…
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <RoleCard
              selected={role === "donor"}
              onClick={() => selectRole("donor")}
              icon={<DonateIcon />}
              title="I Want to Donate"
              description="Help verified recipients in Pakistan"
            />
            <RoleCard
              selected={role === "recipient"}
              onClick={() => selectRole("recipient")}
              icon={<HelpIcon />}
              title="I Need Help"
              description="Request in-kind support with dignity"
            />
            <RoleCard
              selected={role === "vendor"}
              onClick={() => selectRole("vendor")}
              icon={<VendorIcon />}
              title="I am a Vendor"
              description="Register your pharmacy, store or school to fulfill donations"
            />
          </div>
        </div>

        {role && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClassName}
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClassName}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClassName}
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClassName}
                placeholder="Re-enter your password"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClassName}
                placeholder="+92 300 1234567"
              />
            </div>

            <div>
              <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-gray-700">
                Country
              </label>
              <select
                id="country"
                required
                value={role === "vendor" ? "Pakistan" : country}
                onChange={(e) => setCountry(e.target.value as (typeof COUNTRIES)[number])}
                disabled={role === "vendor"}
                className={`${inputClassName} disabled:bg-gray-50 disabled:text-gray-500`}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {role === "vendor" && (
              <>
                <div>
                  <label htmlFor="businessName" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className={inputClassName}
                    placeholder="Your business name"
                  />
                </div>

                <div>
                  <label htmlFor="businessType" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Business Type
                  </label>
                  <select
                    id="businessType"
                    required
                    value={businessType}
                    onChange={(e) =>
                      setBusinessType(e.target.value as (typeof BUSINESS_TYPES)[number])
                    }
                    className={inputClassName}
                  >
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="businessAddress" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Business Address
                  </label>
                  <input
                    id="businessAddress"
                    type="text"
                    required
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className={inputClassName}
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label htmlFor="vendorCity" className="mb-1.5 block text-sm font-medium text-gray-700">
                    City in Pakistan
                  </label>
                  <input
                    id="vendorCity"
                    type="text"
                    required
                    value={vendorCity}
                    onChange={(e) => setVendorCity(e.target.value)}
                    className={inputClassName}
                    placeholder="City"
                  />
                </div>
              </>
            )}

            {role === "donor" && (
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-green-100 bg-green-50/50 p-4">
                <input
                  type="checkbox"
                  checked={pledgeAccepted}
                  onChange={(e) => setPledgeAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-green-300 text-green-700 focus:ring-green-600"
                />
                <span className="text-sm leading-relaxed text-gray-700">
                  I pledge to treat all recipients with respect and without
                  discrimination based on religion, ethnicity, gender, or background.
                </span>
              </label>
            )}

            {role === "recipient" && (
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-green-100 bg-green-50/50 p-4">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-green-300 text-green-700 focus:ring-green-600"
                />
                <span className="text-sm leading-relaxed text-gray-700">
                  I have read and agree to the{" "}
                  <span className="font-medium text-green-700">Privacy Policy</span>.
                  I understand my personal information will be handled with care.
                </span>
              </label>
            )}

            {typeof error === 'string' && error.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full rounded-xl bg-green-700 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-green-700/25 transition-all hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-green-700 transition-colors hover:text-green-800"
          >
            Log in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

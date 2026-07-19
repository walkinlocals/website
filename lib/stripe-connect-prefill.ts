import { normalizeDateOfBirth } from "@/lib/profile";
import type Stripe from "stripe";

interface HostProfileForConnect {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  contact_email: string | null;
  phone: string | null;
  date_of_birth: string | null;
}

function parseDob(
  dateOfBirth: string | null,
): { day: number; month: number; year: number } | null {
  const normalized = normalizeDateOfBirth(dateOfBirth);
  if (!normalized) return null;
  const [year, month, day] = normalized.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { day, month, year };
}

function splitName(fullName: string | null | undefined): {
  firstName?: string;
  lastName?: string;
} {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!parts.length) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/** Stripe rejects many localhost / invalid business URLs — use description only for hosts. */
function businessProfile(): Stripe.AccountCreateParams.BusinessProfile {
  return {
    product_description: "Local Dublin host on WalkIn Locals — home visits and storytelling.",
    mcc: "7999",
  };
}

function normalizePhone(phone: string | null | undefined): string | undefined {
  const raw = phone?.trim();
  if (!raw) return undefined;
  if (/^\+\d{8,15}$/.test(raw)) return raw;
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("353") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 9) return `+353${digits.slice(1)}`;
  return undefined;
}

export function buildConnectAccountPayload(
  profile: HostProfileForConnect,
  userEmail: string | undefined,
): Stripe.AccountCreateParams {
  const fromFull = splitName(profile.full_name);
  const firstName = profile.first_name?.trim() || fromFull.firstName;
  const lastName = profile.last_name?.trim() || fromFull.lastName;
  const email = profile.contact_email?.trim() || userEmail;
  const dob = parseDob(profile.date_of_birth);
  const phone = normalizePhone(profile.phone);

  return {
    type: "express",
    country: "IE",
    email,
    business_type: "individual",
    business_profile: businessProfile(),
    individual: {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      dob: dob ?? undefined,
    },
    capabilities: {
      transfers: { requested: true },
    },
  };
}

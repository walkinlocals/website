/** Public app origin for Stripe return URLs and emails. */
export function resolveAppUrl(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      // ignore malformed env value
    }
  }

  if (request) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        return new URL(origin).origin;
      } catch {
        // ignore
      }
    }

    const referer = request.headers.get("referer");
    if (referer) {
      try {
        return new URL(referer).origin;
      } catch {
        // ignore
      }
    }
  }

  return "http://localhost:3000";
}

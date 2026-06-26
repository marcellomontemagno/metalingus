// Single source of truth for brand identity — the name, copy, and identifiers used
// across the UI and transactional emails. Client-safe: plain constants, no env reads.
export const brand = {
  /** Product name, lowercase, as shown to users. */
  name: "metalingus",
  /** One-line descriptor — landing hero + page metadata. */
  tagline: "A broker-mediated marketplace for steel bar.",
  /** Primary domain — used for example/placeholder addresses in the UI. */
  domain: "metalingus.com",
  /**
   * Default magic-link sender. `AUTH_EMAIL_FROM` overrides it at deploy time.
   * NOTE: this default domain is not metalingus.com — update once a branded
   * sending domain is verified in Resend.
   */
  emailFrom: "auth@keepalink.com",
} as const;

export interface SiteConfig {
  businessName: string;
  tradeName: string;
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  whatsappNumber: string;
  upi: {
    payeeName: string;
    vpa: string;
  };
  address: string;
  grievanceOfficer: {
    name: string;
    email: string;
  };
  gstin?: string;
  legalReviewedOn: string;
  social: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export const siteConfig: SiteConfig = {
  businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || "VTU Adda Projects",
  tradeName: process.env.NEXT_PUBLIC_TRADE_NAME || "VTU Adda",
  siteName: "VTU Adda Projects",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://projects.vtuadda.com",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contact@vtuadda.com",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  upi: {
    payeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME || "VTU Adda Projects",
    vpa: process.env.NEXT_PUBLIC_UPI_VPA || "vtuadda@upi",
  },
  address:
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ||
    "42, 3rd Cross, 5th Main, 7th Sector, HSR Layout, Bengaluru, Karnataka 560102, India",
  grievanceOfficer: {
    name: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME || "Rohan Sharma",
    email: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_EMAIL || "contact@vtuadda.com",
  },
  gstin: "",
  legalReviewedOn: "2026-10-15",
  social: {},
};

export function getSiteConfig(): SiteConfig {
  if (process.env.NODE_ENV === "production") {
    const missing: string[] = [];

    if (!siteConfig.businessName) missing.push("businessName");
    if (!siteConfig.tradeName) missing.push("tradeName");
    if (!siteConfig.siteName) missing.push("siteName");
    if (!siteConfig.siteUrl) missing.push("siteUrl");
    if (!siteConfig.supportEmail) missing.push("supportEmail");
    if (!siteConfig.whatsappNumber) missing.push("whatsappNumber");
    if (!siteConfig.upi.payeeName) missing.push("upi.payeeName");
    if (!siteConfig.upi.vpa) missing.push("upi.vpa");
    if (!siteConfig.address) missing.push("address");
    if (!siteConfig.grievanceOfficer.name) missing.push("grievanceOfficer.name");
    if (!siteConfig.grievanceOfficer.email) missing.push("grievanceOfficer.email");

    if (missing.length > 0) {
      throw new Error(
        `Production requires complete site config. Missing fields: ${missing.join(", ")}`
      );
    }
  }

  return siteConfig;
}

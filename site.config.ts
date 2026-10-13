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
  businessName: "",
  tradeName: "",
  siteName: "VTU Adda Projects",
  siteUrl: "",
  supportEmail: "",
  whatsappNumber: "",
  upi: {
    payeeName: "",
    vpa: "",
  },
  address: "",
  grievanceOfficer: {
    name: "",
    email: "",
  },
  gstin: "",
  legalReviewedOn: "",
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

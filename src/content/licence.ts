export const LICENCE_TERMS_TEXT =
  "Licensed to the named buyer for personal learning and reference. No resale, no sharing, no public upload. You must follow your college and VTU rules.";

export interface LicenceSlipData {
  buyerName: string;
  orderCode: string;
  kitTitle: string;
  date: string;
}

export function generateLicenceSlip(data: LicenceSlipData): string {
  return [
    "VTU Adda Project Hub",
    "Licence Slip",
    "",
    `Order Code: ${data.orderCode}`,
    `Buyer: ${data.buyerName}`,
    `Kit: ${data.kitTitle}`,
    `Date: ${data.date}`,
    "",
    "Terms of Use:",
    LICENCE_TERMS_TEXT,
    "",
    "VTU Adda: Academic Project Deliverables",
  ].join("\n");
}

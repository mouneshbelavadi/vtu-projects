export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Formats date according to rule: "13 Oct 2026" in Indian Standard Time (IST).
 */
export function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return "";
  }

  // Format in IST (UTC+5:30)
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const istTime = new Date(utcTime + 5.5 * 60 * 60 * 1000);

  const day = istTime.getDate();
  const month = MONTH_NAMES[istTime.getMonth()];
  const year = istTime.getFullYear();

  return `${day} ${month} ${year}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

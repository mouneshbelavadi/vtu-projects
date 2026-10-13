import { requireAdmin } from "@/server/auth";
import { getSystemSettings } from "@/server/settings";
import { SettingsForm } from "./settings-form";

export const metadata = {
  title: "Site Settings | Admin",
};

export default async function AdminSettingsPage() {
  await requireAdmin();

  const settings = await getSystemSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Site Settings</h1>
        <p className="mt-1 text-sm text-ink-2">
          Configure payment details, order expiry, and file retention policies.
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}

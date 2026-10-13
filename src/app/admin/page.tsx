import { requireAdmin } from "@/server/auth";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const authUser = await requireAdmin();

  return (
    <div className="mx-auto max-w-4xl py-12 px-4 sm:px-6">
      <div className="border border-rule bg-surface p-8">
        <h1 className="text-2xl font-serif font-semibold text-ink">Admin</h1>
        <p className="mt-2 text-sm text-ink-2">
          Signed in as: <span className="font-mono text-ink">{authUser.user.email}</span>
        </p>
      </div>
    </div>
  );
}

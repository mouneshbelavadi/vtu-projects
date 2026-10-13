import { requireAdmin } from "@/server/auth";
import { AdminSidebar } from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await requireAdmin();

  return (
    <div className="mx-auto max-w-container px-4 sm:px-6 py-6">
      <div className="flex flex-col md:flex-row border border-rule bg-surface min-h-[600px]">
        <AdminSidebar adminEmail={authUser.user.email || ""} />
        <main className="flex-1 p-6 md:p-8 bg-surface overflow-x-auto" id="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}

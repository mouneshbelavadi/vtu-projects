import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import type { AuditLog } from "@/types/database";

export const metadata = {
  title: "Audit Log | Admin",
};

interface AuditLogPageProps {
  searchParams: Promise<{
    action?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 25;

export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
  await requireAdmin();

  const { action, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);

  const adminClient = createAdminClient();

  // Get distinct actions for filtering
  const { data: distinctActionsRes } = await adminClient
    .from("audit_log")
    .select("action")
    .limit(100);

  const distinctActions = Array.from(
    new Set((distinctActionsRes || []).map((r) => r.action))
  ).sort();

  // Build query
  let query = adminClient
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (action && action.trim()) {
    query = query.eq("action", action.trim());
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: logs, count } = await query.range(from, to);
  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function formatIST(isoString: string): string {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Audit Log</h1>
          <p className="mt-1 text-sm text-ink-2">
            Read-only chronological trail of administrative modifications.
          </p>
        </div>

        {/* Action filter */}
        <form method="GET" className="flex items-center gap-2">
          <label htmlFor="action-filter" className="text-xs font-mono text-ink-3 uppercase">
            Filter:
          </label>
          <select
            id="action-filter"
            name="action"
            defaultValue={action || ""}
            className="h-9 px-3 rounded-md border border-rule bg-surface text-sm text-ink focus:outline-accent"
          >
            <option value="">All actions</option>
            {distinctActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-9 px-3 text-xs font-medium rounded-md border border-rule hover:bg-paper"
          >
            Apply
          </button>
        </form>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Time (IST)</TableHead>
              <TableHead className="w-[140px]">Action</TableHead>
              <TableHead className="w-[120px]">Entity</TableHead>
              <TableHead className="w-[120px]">Entity ID</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!logs || logs.length === 0) ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-ink-3">
                  No audit log entries recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: AuditLog) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs whitespace-nowrap text-ink-2">
                    {formatIST(log.created_at)}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium text-ink">
                    {log.action}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-ink-2">
                    {log.entity}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-ink-3 truncate max-w-[120px]" title={log.entity_id || ""}>
                    {log.entity_id || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-ink-2 max-w-[300px] truncate" title={log.details ? JSON.stringify(log.details) : ""}>
                    {log.details ? JSON.stringify(log.details) : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={(p) =>
              `/admin/audit?page=${p}${action ? `&action=${encodeURIComponent(action)}` : ""}`
            }
          />
        </div>
      )}
    </div>
  );
}

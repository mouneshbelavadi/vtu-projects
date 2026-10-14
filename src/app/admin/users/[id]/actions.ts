"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { exportUserData, anonymiseAccount } from "@/server/account/data-tools";

export async function exportUserDataAdminAction(targetUserId: string) {
  await requireAdmin();
  const data = await exportUserData(targetUserId);
  return { success: true, data };
}

export async function anonymiseUserAdminAction(input: {
  targetUserId: string;
  totpCode: string;
  confirmationText: string;
}) {
  const admin = await requireAdmin();

  const result = await anonymiseAccount({
    targetUserId: input.targetUserId,
    adminUserId: admin.user.id,
    totpCode: input.totpCode,
    confirmationText: input.confirmationText,
  });

  if (result.success) {
    revalidatePath(`/admin/users/${input.targetUserId}`);
    revalidatePath("/admin/tickets");
  }

  return result;
}

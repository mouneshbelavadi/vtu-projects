import { NextResponse } from "next/server";
import { getUserOrNull } from "@/server/auth";
import { exportUserData } from "@/server/account/data-tools";

export async function GET() {
  const authUser = await getUserOrNull();
  if (!authUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const data = await exportUserData(authUser.user.id);

  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="vtuadda-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

import { getUserOrNull } from "@/server/auth";
import { generateOrderLicenceSlip } from "@/server/orders/downloads";
import { AppError } from "@/server/errors";

async function handleLicenceDownload(orderId: string) {
  const authUser = await getUserOrNull();
  if (!authUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await generateOrderLicenceSlip({
      orderId,
      userId: authUser.user.id,
    });

    return new Response(result.content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return new Response(err.message, { status: err.statusCode });
    }
    return new Response("Failed to generate licence slip", { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleLicenceDownload(id);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleLicenceDownload(id);
}

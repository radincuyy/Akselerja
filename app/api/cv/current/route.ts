import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { downloadBlobToBuffer, isBlobConfigured } from "@/lib/blob-store";
import { getProfileAsync } from "@/lib/profile-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfileAsync(session.user.id);
  const cv = profile?.cv;
  if (!cv?.blobName || !isBlobConfigured()) {
    return NextResponse.json(
      { error: "CV belum tersedia untuk dilihat." },
      { status: 404 },
    );
  }

  try {
    const { buffer, contentType, contentLength } =
      await downloadBlobToBuffer(cv.blobName);
    const filename = cv.filename.replace(/"/g, "");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": cv.contentType ?? contentType ?? "application/pdf",
        "Content-Length": String(contentLength ?? buffer.byteLength),
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[cv] view url failed:", err);
    return NextResponse.json(
      { error: "Gagal membuka CV. Coba lagi sebentar." },
      { status: 500 },
    );
  }
}

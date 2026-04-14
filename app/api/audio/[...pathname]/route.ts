import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Secure proxy route for private blobs.
 * Only authenticated Recruiters and Admins can access this route.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ pathname: string[] }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { pathname } = await params;
  const blobPath = pathname.join("/");
  
  // Reconstruct the full Vercel Blob URL using the path
  // Since we store the full URL in the DB, the 'pathname' here 
  // might just be the part after the base URL.
  // We can also accept the full URL as a search param or similar.
  
  const searchParams = new URL(request.url).searchParams;
  const fullUrl = searchParams.get("url");

  if (!fullUrl) {
    return new NextResponse("Missing URL parameter", { status: 400 });
  }

  try {
    const result = await get(fullUrl, {
      access: "private",
    });

    if (!result || result.statusCode !== 200) {
      return new NextResponse("File not found or not modified", { status: result ? result.statusCode : 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Length": result.blob.size.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Blob proxy error:", error);
    return new NextResponse("File not found", { status: 404 });
  }
}

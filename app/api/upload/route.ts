import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { is_upload_kind, UPLOAD_RULES } from "@/app/(site)/lib/upload_rules";
import { get_admin } from "@/app/server/admin_auth";
import { STORAGE_DRIVER } from "@/app/server/storage";
import { within_limit } from "@/app/server/rate_limit";

/**
 * Issues short-lived Vercel Blob tokens so the browser uploads straight to storage
 * (serverless request bodies are capped at 4.5 MB, far below 8 photos).
 * The token only allows the content types, size and folder of the requested upload kind.
 */
export async function POST(request: Request): Promise<NextResponse> {
    if (STORAGE_DRIVER !== "vercel-blob") return NextResponse.json({ error: "Storage is not configured" }, { status: 503 });

    const body = (await request.json()) as HandleUploadBody;

    try {
        const result = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname, client_payload) => {
                if (!is_upload_kind(client_payload)) throw new Error("Unknown upload kind");
                if (!(await within_limit("upload"))) throw new Error("Too many uploads, try again later");

                const rule = UPLOAD_RULES[client_payload];
                if (!pathname.startsWith(`${rule.prefix}/`) || pathname.includes("..")) throw new Error("Invalid upload path");
                if (rule.admin_only && !(await get_admin())) throw new Error("Not allowed");

                return {
                    allowedContentTypes: rule.content_types,
                    maximumSizeInBytes: rule.max_bytes,
                    addRandomSuffix: true,
                    validUntil: Date.now() + 10 * 60_000,
                };
            },
        });

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
}

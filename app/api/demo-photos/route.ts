import { NextResponse } from "next/server";
import { get_admin } from "@/app/server/admin_auth";
import { within_limit } from "@/app/server/rate_limit";
import { MAX_PHOTO_BYTES, save_demo_photo } from "@/app/server/private_demos";

/**
 * Admin upload of one private-demo photo, already resized in the browser (see demo_form.tsx).
 * Stored in MongoDB, so it works without any file storage being configured.
 */
export async function POST(request: Request): Promise<NextResponse> {
    if (!(await get_admin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    if (!(await within_limit("upload"))) return NextResponse.json({ error: "Too many uploads, try again later" }, { status: 429 });

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    const demo_id = form?.get("demo_id");
    if (!(file instanceof File) || typeof demo_id != "string") return NextResponse.json({ error: "No photo" }, { status: 400 });
    if (file.size > MAX_PHOTO_BYTES) return NextResponse.json({ error: "This photo is too large." }, { status: 413 });

    const result = await save_demo_photo(demo_id, file.type, new Uint8Array(await file.arrayBuffer()));
    return result.ok ? NextResponse.json({ id: result.id }) : NextResponse.json({ error: result.error }, { status: 400 });
}

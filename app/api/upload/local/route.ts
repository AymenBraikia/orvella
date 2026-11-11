import { NextResponse } from "next/server";
import { is_upload_kind, UPLOAD_RULES } from "@/app/(site)/lib/upload_rules";
import { get_admin } from "@/app/server/admin_auth";
import { local_storage_available, save_local_file, STORAGE_DRIVER } from "@/app/server/storage";

/** Development-only upload target used when no BLOB_READ_WRITE_TOKEN is set. */
export async function POST(request: Request) {
    if (!local_storage_available()) {
        // Reached in production when the build had no BLOB_READ_WRITE_TOKEN: there is nowhere to keep the file.
        const error = STORAGE_DRIVER === "vercel-blob" ? "Vercel Blob was added after this build. Redeploy the site." : "Photo storage is not set up. Add a Vercel Blob store to the project, then redeploy.";
        return NextResponse.json({ error }, { status: 503 });
    }

    const form = await request.formData();
    const kind = form.get("kind");
    const file = form.get("file");

    if (!is_upload_kind(kind) || !(file instanceof File)) return NextResponse.json({ error: "Invalid upload" }, { status: 400 });

    const rule = UPLOAD_RULES[kind];
    if (rule.admin_only && !(await get_admin())) return NextResponse.json({ error: "Not allowed. Log in again as an admin." }, { status: 403 });
    if (!rule.content_types.includes(file.type)) return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
    if (file.size > rule.max_bytes) return NextResponse.json({ error: "File too large" }, { status: 413 });

    return NextResponse.json({ url: await save_local_file(file, kind) });
}

import "server-only";

import { del } from "@vercel/blob";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { UPLOAD_RULES, type UploadKind } from "@/app/(site)/lib/upload_rules";

/*
 * File storage behind one small interface, so Vercel Blob can be swapped for S3 / Cloudinary:
 * a new driver needs (1) a way for the browser to upload directly (see /api/upload),
 * (2) is_stored_url and (3) delete_files.
 *
 * - "vercel-blob": used whenever BLOB_READ_WRITE_TOKEN is set.
 * - "local": development fallback without any account; files go to public/dev-uploads (gitignored).
 */

export type StorageDriver = "vercel-blob" | "local";

export const STORAGE_DRIVER: StorageDriver = process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local";

const LOCAL_ROOT = path.join(process.cwd(), "public", "dev-uploads");
const LOCAL_URL_PREFIX = "/dev-uploads/";

export function local_storage_available(): boolean {
    return STORAGE_DRIVER === "local" && process.env.NODE_ENV !== "production";
}

/** True if `url` points at a file we stored for `kind` — never trust arbitrary URLs from a form. */
export function is_stored_url(url: string, kind: UploadKind): boolean {
    const prefix = `/${UPLOAD_RULES[kind].prefix}/`;

    if (url.startsWith(LOCAL_URL_PREFIX)) return local_storage_available() && url.startsWith(`${LOCAL_URL_PREFIX}${UPLOAD_RULES[kind].prefix}/`) && !url.includes("..");

    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" && parsed.hostname.endsWith(".public.blob.vercel-storage.com") && parsed.pathname.startsWith(prefix);
    } catch {
        return false;
    }
}

const EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "video/mp4": "mp4",
    "video/webm": "webm",
};

/** Development driver: store a file under public/dev-uploads and return its public path. */
export async function save_local_file(file: File, kind: UploadKind): Promise<string> {
    if (!local_storage_available()) throw new Error("Local storage is only available in development");

    const folder = path.join(LOCAL_ROOT, UPLOAD_RULES[kind].prefix);
    await mkdir(folder, { recursive: true });

    const name = `${randomUUID()}.${EXTENSIONS[file.type] ?? "bin"}`;
    await writeFile(path.join(folder, name), Buffer.from(await file.arrayBuffer()));

    return `${LOCAL_URL_PREFIX}${UPLOAD_RULES[kind].prefix}/${name}`;
}

/** Remove stored files. Failures are logged, never thrown (a stray file is better than a failed save). */
export async function delete_files(urls: string[]): Promise<void> {
    const blob = urls.filter((u) => u.startsWith("https://"));
    const local = urls.filter((u) => u.startsWith(LOCAL_URL_PREFIX) && !u.includes(".."));

    try {
        if (blob.length && STORAGE_DRIVER === "vercel-blob") await del(blob);
        for (const u of local) await unlink(path.join(LOCAL_ROOT, u.slice(LOCAL_URL_PREFIX.length)));
    } catch (error) {
        console.error("Could not delete stored files", error);
    }
}

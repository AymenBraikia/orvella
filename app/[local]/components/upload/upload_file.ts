import { UPLOAD_RULES, type UploadKind } from "@/app/(site)/lib/upload_rules";

function safe_name(file: File): string {
    const base = file.name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").slice(-80) || "file";
    return base.toLowerCase();
}

/** Upload one file straight from the browser to storage; resolves with its public URL. */
export async function upload_file(file: File, kind: UploadKind, on_progress?: (percent: number) => void): Promise<string> {
    if (process.env.NEXT_PUBLIC_UPLOAD_DRIVER === "vercel-blob") {
        const { upload } = await import("@vercel/blob/client");
        const result = await upload(`${UPLOAD_RULES[kind].prefix}/${safe_name(file)}`, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
            clientPayload: kind,
            contentType: file.type,
            multipart: file.size > 20 * 1024 * 1024,
            onUploadProgress: ({ percentage }) => on_progress?.(percentage),
        });
        return result.url;
    }

    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append("kind", kind);
        form.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload/local");
        xhr.upload.onprogress = (e) => e.lengthComputable && on_progress?.(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => {
            try {
                const json = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300 && json.url) resolve(json.url);
                else reject(new Error(json.error || `Upload failed (${xhr.status})`));
            } catch {
                reject(new Error(`Upload failed (${xhr.status})`));
            }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(form);
    });
}

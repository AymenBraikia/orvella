/** What may be uploaded where. Shared by the browser (early feedback) and the server (enforcement). */
export type UploadKind = "sell" | "product_image" | "product_video";

export type UploadRule = {
    /** Folder in storage; also checked when a URL is submitted back to us. */
    prefix: string;
    content_types: string[];
    max_bytes: number;
    admin_only: boolean;
};

const MB = 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const UPLOAD_RULES: Record<UploadKind, UploadRule> = {
    sell: { prefix: "sell", content_types: IMAGE_TYPES, max_bytes: 8 * MB, admin_only: false },
    product_image: { prefix: "products", content_types: IMAGE_TYPES, max_bytes: 15 * MB, admin_only: true },
    product_video: { prefix: "products", content_types: ["video/mp4", "video/webm"], max_bytes: 200 * MB, admin_only: true },
};

export const MAX_SELL_IMAGES = 8;

/** Most browsers can't display HEIC, and some report no type for it, so the extension counts too. */
export function is_heic(file: Pick<File, "name" | "type">): boolean {
    return /^image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

export function is_upload_kind(value: unknown): value is UploadKind {
    return typeof value === "string" && value in UPLOAD_RULES;
}

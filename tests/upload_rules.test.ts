import { describe, expect, it } from "vitest";
import { is_heic, UPLOAD_RULES } from "@/app/(site)/lib/upload_rules";

describe("photo uploads", () => {
    it("no upload kind accepts HEIC: most browsers cannot display it", () => {
        for (const rule of Object.values(UPLOAD_RULES)) expect(rule.content_types.filter((t) => /hei[cf]/.test(t))).toEqual([]);
    });

    it("spots HEIC by type, and by extension when the browser reports no type", () => {
        expect(is_heic({ name: "IMG_0001.jpg", type: "image/heic" })).toBe(true);
        expect(is_heic({ name: "IMG_0001.HEIC", type: "" })).toBe(true);
        expect(is_heic({ name: "photo.heif", type: "" })).toBe(true);
        expect(is_heic({ name: "IMG_0001.jpeg", type: "image/jpeg" })).toBe(false);
    });
});

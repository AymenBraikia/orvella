import { beforeEach, describe, expect, it, vi } from "vitest";
import imageLoader from "../image_loader";

beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://demo.test/");
});

describe("image loader", () => {
    it("sends site images through wsrv with their public address and the requested size", () => {
        const url = new URL(imageLoader({ src: "/uploads/watches/a b/img_0.jpg", width: 640, quality: 60 }));

        expect(url.origin).toBe("https://wsrv.nl");
        expect(url.searchParams.get("url")).toBe("https://demo.test/uploads/watches/a b/img_0.jpg");
        expect(url.searchParams.get("w")).toBe("640");
        expect(url.searchParams.get("q")).toBe("60");
        expect(url.searchParams.get("output")).toBe("webp");
    });

    it("uses quality 75 unless told otherwise", () => {
        expect(new URL(imageLoader({ src: "/a.jpg", width: 320 })).searchParams.get("q")).toBe("75");
    });

    it("passes full addresses, such as uploaded photos, as they are", () => {
        const src = "https://store.public.blob.vercel-storage.com/products/a.jpg";
        expect(new URL(imageLoader({ src, width: 320 })).searchParams.get("url")).toBe(src);
    });

    it("serves the original when the site has no public address, since wsrv could not reach it", () => {
        vi.stubEnv("NEXT_PUBLIC_BASE_URL", "http://localhost:3000");
        expect(imageLoader({ src: "/a.jpg", width: 320 })).toBe("/a.jpg");
    });

    it("leaves SVGs alone", () => {
        expect(imageLoader({ src: "/logo.svg", width: 320 })).toBe("/logo.svg");
    });
});

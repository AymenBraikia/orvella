import { describe, expect, it } from "vitest";
import { lead_schema } from "@/app/(no_footer)/why/lead/schema";

const valid = { name: "Jana", business: "Jana Watches", contact: "jana@example.com", stock_url: "https://instagram.com/janawatches" };
const parse = (input: object) => lead_schema().safeParse({ ...valid, ...input });

describe("demo request form on /why", () => {
    it("accepts an email or a WhatsApp number as the contact", () => {
        expect(parse({}).success).toBe(true);
        expect(parse({ contact: "+49 151 1234 5678" }).success).toBe(true);
        expect(parse({ contact: "0151-12345678" }).success).toBe(true);
    });

    it("rejects a contact that is neither", () => {
        expect(parse({ contact: "call me" }).success).toBe(false);
        expect(parse({ contact: "12345" }).success).toBe(false);
        expect(parse({ contact: "jana@" }).success).toBe(false);
    });

    it("accepts a link with or without https://, or an @handle, as the stock", () => {
        expect(parse({ stock_url: "chrono24.de/dealer/jana" }).success).toBe(true);
        expect(parse({ stock_url: "@jana.watches" }).success).toBe(true);
    });

    it("rejects stock that is not a link", () => {
        expect(parse({ stock_url: "my instagram" }).success).toBe(false);
    });

    it("requires name, business, contact and stock; the message is optional", () => {
        for (const field of ["name", "business", "contact", "stock_url"]) expect(parse({ [field]: "  " }).success).toBe(false);
        expect(parse({ message: undefined }).success).toBe(true);
    });
});

import { describe, expect, it, vi } from "vitest";
import type { StoreSettings } from "@/types/settings";

vi.mock("../app/db/collections", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: <T,>(fn: T) => fn }));

const { DEFAULT_SETTINGS } = await import("@/app/server/settings");
const { setup_issues } = await import("@/app/[local]/(admin)/admin/_lib/setup");

const READY_ENV = { RESEND_API_KEY: "re_1", EMAIL_FROM: "shop@dealer.de", BLOB_READ_WRITE_TOKEN: "blob", PAYPAL_ENV: "live", PAYPAL_WEBHOOK_ID: "WH-1" };

const READY: StoreSettings = {
    ...DEFAULT_SETTINGS,
    legal_name: "Muster Uhren GmbH",
    vat_id: "DE123456789",
    address: { ...DEFAULT_SETTINGS.address, street: "Hauptstraße 1" },
    phone: "+49 89 123456",
    email: "info@muster-uhren.de",
    bank: { ...DEFAULT_SETTINGS.bank, iban: "DE89 3704 0044 0532 0130 00" },
    notification_emails: ["orders@muster-uhren.de"],
    whatsapp: "4915112345678",
};

const titles = (settings: StoreSettings, env: Record<string, string | undefined> = READY_ENV, demo = false) => setup_issues(settings, env, demo).map((i) => i.title);

describe("admin setup checklist", () => {
    it("a finished shop has nothing left to do, so the card disappears", () => {
        expect(titles(READY)).toEqual([]);
    });

    it("the untouched defaults report everything", () => {
        expect(titles(DEFAULT_SETTINGS, {})).toEqual(["Store details are still placeholders", "No notification email", "Email sending is not set up", "Photo storage is not set up", "PayPal is in sandbox mode", "PayPal webhook is missing", "No WhatsApp number"]);
    });

    it("every issue says how to fix it", () => {
        for (const issue of setup_issues(DEFAULT_SETTINGS, {}, false)) expect(issue.fix.length).toBeGreaterThan(20);
    });

    it("one placeholder left is enough", () => {
        expect(titles({ ...READY, vat_id: DEFAULT_SETTINGS.vat_id })).toEqual(["Store details are still placeholders"]);
    });

    it("email needs both the key and the sender", () => {
        expect(titles(READY, { ...READY_ENV, EMAIL_FROM: "" })).toEqual(["Email sending is not set up"]);
    });

    it("PayPal warnings go away when PayPal is switched off", () => {
        const no_paypal = { ...READY, payments: { ...READY.payments, paypal: false } };
        expect(titles(no_paypal, { ...READY_ENV, PAYPAL_ENV: "sandbox", PAYPAL_WEBHOOK_ID: "" })).toEqual([]);
    });

    it("the demo expects placeholders and the sandbox", () => {
        expect(titles({ ...READY, legal_name: DEFAULT_SETTINGS.legal_name }, { ...READY_ENV, PAYPAL_ENV: "sandbox" }, true)).toEqual([]);
    });
});

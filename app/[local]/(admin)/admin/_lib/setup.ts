import "server-only";

import { DEFAULT_SETTINGS } from "@/app/server/settings";
import { DEMO_MODE } from "@/app/(site)/lib/demo";
import type { StoreSettings } from "@/types/settings";

export type SetupIssue = { title: string; fix: string };

const PLACEHOLDER_FIELDS = (s: StoreSettings) => [
    [s.legal_name, DEFAULT_SETTINGS.legal_name],
    [s.vat_id, DEFAULT_SETTINGS.vat_id],
    [s.address.street, DEFAULT_SETTINGS.address.street],
    [s.phone, DEFAULT_SETTINGS.phone],
    [s.email, DEFAULT_SETTINGS.email],
    [s.bank.iban, DEFAULT_SETTINGS.bank.iban],
];

/** What still stops the shop from working properly, each with one line on how to fix it. */
export function setup_issues(settings: StoreSettings, env: Record<string, string | undefined> = process.env, demo = DEMO_MODE): SetupIssue[] {
    const issues: SetupIssue[] = [];
    const add = (missing: unknown, title: string, fix: string) => {
        if (missing) issues.push({ title, fix });
    };

    add(!demo && PLACEHOLDER_FIELDS(settings).some(([value, placeholder]) => value == placeholder), "Store details are still placeholders", "Enter your company, address, VAT ID and bank details in Settings. They appear on the imprint and next to the bank details.");
    add(!settings.notification_emails.length, "No notification email", "Add one in Settings → Notifications. Until then new orders and requests reach nobody.");
    add(!env.RESEND_API_KEY || !env.EMAIL_FROM, "Email sending is not set up", "Set RESEND_API_KEY and EMAIL_FROM on the server. Until then no email goes out, to customers or to you.");
    add(!env.BLOB_READ_WRITE_TOKEN, "Photo storage is not set up", "Add a Vercel Blob store to the project (BLOB_READ_WRITE_TOKEN). Photo uploads won't work in production without it.");
    add(!demo && settings.payments.paypal && env.PAYPAL_ENV != "live", "PayPal is in sandbox mode", "Set PAYPAL_ENV=live with your live client id and secret. Sandbox payments are not real money.");
    add(settings.payments.paypal && !env.PAYPAL_WEBHOOK_ID, "PayPal webhook is missing", "Create a webhook for /api/paypal/webhook in the PayPal dashboard and set PAYPAL_WEBHOOK_ID. Without it a closed browser can leave a paid order unpaid here.");
    add(!settings.whatsapp, "No WhatsApp number", 'Add it in Settings → Contact. The "Ask on WhatsApp" button stays hidden without it.');

    return issues;
}

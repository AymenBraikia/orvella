import "server-only";

import { createTranslator } from "next-intl";
import { send_email } from "./email";
import { render_email, type Block } from "./render";
import { get_settings, DEFAULT_SETTINGS } from "../settings";
import { applyBrand, DEFAULT_BRAND } from "@/i18n/brand";
import { routing } from "@/i18n/routing";
import { getDirection } from "@/i18n/direction";
import { absolute_url } from "@/app/(site)/lib/site_url";
import { format_money } from "@/app/(site)/lib/price_format";
import type { Order } from "@/types/order";
import type { StoreSettings } from "@/types/settings";
import type { Sell } from "@/types/sell";
import type { Consignment } from "@/types/consignment";
import type { Appointment } from "@/types/appointment";

/*
 * Who gets which email. Customer emails are written in the customer's language (stored on the
 * order / request); dealer emails are English like the admin. Every function swallows errors —
 * call them after the main work is saved (e.g. inside after()).
 */

type Locale = (typeof routing.locales)[number];

async function translator(locale: string | undefined, settings: StoreSettings) {
    const l: Locale = routing.locales.includes(locale as Locale) ? (locale as Locale) : "en";
    const raw = (await import(`@/messages/${l}.json`)).default;
    const messages = settings.store_name.toLowerCase() === DEFAULT_BRAND.toLowerCase() ? raw : applyBrand(raw, settings.store_name);
    return { t: createTranslator({ locale: l, messages }), locale: l };
}

function footer(s: StoreSettings): string {
    return [s.legal_name || s.store_name, s.address.street, `${s.address.postcode} ${s.address.city}`.trim(), s.address.country, s.email].filter((v) => v && v.trim()).join(" · ");
}

function dealer_recipients(s: StoreSettings): string[] {
    if (s.notification_emails.length) return s.notification_emails;
    return s.email && s.email !== DEFAULT_SETTINGS.email ? [s.email] : [];
}

function date_text(value: Date | string, locale: string): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(value));
}

function order_rows(order: Order, t: (key: string, values?: Record<string, string | number>) => string): [string, string][] {
    const money = (n: number) => format_money(n, order.currency);
    const rows: [string, string][] = order.items.map((i) => [`${i.name}${i.quantity > 1 ? ` × ${i.quantity}` : ""}`, money(i.total)]);

    rows.push([t("emails.subtotal"), money(order.totals.items)]);
    rows.push([order.address == "Local Pickup" ? t("emails.pickup") : t("emails.shipping"), money(order.totals.shipping)]);
    if (order.totals.discount > 0) rows.push([t("emails.discount"), `− ${money(order.totals.discount)}`]);
    if (order.tax.mode == "added") rows.push([t("emails.vatAdded", { rate: order.tax.rate }), money(order.totals.tax)]);
    rows.push([t("emails.total"), money(order.totals.total)]);
    if (order.tax.mode == "included" && order.totals.tax_included > 0) rows.push([t("emails.vatIncluded", { rate: order.tax.rate }), money(order.totals.tax_included)]);

    return rows;
}

function bank_rows(order: Order, s: StoreSettings, t: (key: string) => string): [string, string][] {
    return [
        [t("orders.bank.accountHolder"), s.bank.account_holder],
        [t("orders.bank.bank"), s.bank.bank_name],
        [t("orders.bank.iban"), s.bank.iban],
        [t("orders.bank.bic"), s.bank.bic],
        [t("orders.bank.reference"), order.id],
        [t("orders.bank.amount"), format_money(order.totals.total, order.currency)],
    ];
}

/* ───────────────────────── customer: orders ───────────────────────── */

type OrderEmail = "confirmed" | "received_bank" | "payment_received" | "shipped" | "cancelled" | "expired";

async function customer_order_email(order: Order, kind: OrderEmail) {
    const s = await get_settings();
    const { t, locale } = await translator(order.locale, s);

    const key = { confirmed: "orderConfirmed", received_bank: "orderReceivedBank", payment_received: "paymentReceived", shipped: "shipped", cancelled: "cancelled", expired: "cancelled" }[kind];
    const deadline = order.reserved_until ? date_text(order.reserved_until, locale) : "";
    const values = { id: order.id, amount: format_money(order.totals.total, order.currency), date: deadline, carrier: order.tracking?.carrier ?? "" };

    const blocks: Block[] = [{ kind: "p", text: t("emails.greeting", { name: order.first_name || "" }).replace(/ ,/, ",") }];
    blocks.push({ kind: "p", text: t(kind == "expired" ? "emails.cancelled.expiredText" : `emails.${key}.text`, values) });

    if (kind == "shipped" && order.tracking) blocks.push({ kind: "rows", rows: [[t("emails.shipped.carrier"), order.tracking.carrier], [t("emails.shipped.tracking"), order.tracking.number]] });
    if (kind == "received_bank") blocks.push({ kind: "rows", title: t("orders.bank.heading"), rows: bank_rows(order, s, t) });
    if (kind != "cancelled" && kind != "expired") blocks.push({ kind: "rows", title: `${t("emails.orderNumber")} ${order.id}`, rows: order_rows(order, t) });
    if (order.tax.mode == "margin_scheme" && kind != "cancelled" && kind != "expired") blocks.push({ kind: "p", text: t("checkout.marginScheme") });

    // The private order link works for guests and account holders alike.
    const order_link = order.access_token ? `/${locale}/thank_you?order=${encodeURIComponent(order.id)}&token=${order.access_token}` : `/${locale}/thank_you`;
    blocks.push({ kind: "button", label: t("emails.viewOrders"), href: absolute_url(order_link) });
    blocks.push({ kind: "p", text: t("emails.signoff", { store: s.store_name }) });

    const { html, text } = render_email({ store: s.store_name, heading: t(`emails.${key}.heading`), blocks, footer: footer(s), dir: getDirection(locale) });
    await send_email({ to: order.email, subject: t(`emails.${key}.subject`, values), html, text, reply_to: s.email });
}

/* ───────────────────────── dealer ───────────────────────── */

async function dealer_email(subject: string, heading: string, blocks: Block[], reply_to?: string) {
    const s = await get_settings();
    const to = dealer_recipients(s);
    if (!to.length) return;

    const { html, text } = render_email({ store: s.store_name, heading, blocks, footer: "Sent by your shop. Manage notification addresses in Admin → Settings." });
    await send_email({ to, subject, html, text, reply_to });
}

function dealer_order_blocks(order: Order): Block[] {
    const en = (key: string, v?: Record<string, string | number>) =>
        ({ "emails.subtotal": "Subtotal", "emails.shipping": "Shipping", "emails.pickup": "Local pickup", "emails.discount": "Discount", "emails.total": "Total", "emails.vatAdded": `VAT (${v?.rate}%)`, "emails.vatIncluded": `Includes VAT ${v?.rate}%` })[key] ?? key;
    const address = order.address == "Local Pickup" ? "Local pickup in store" : [order.address.address1, order.address.address2, `${order.address.postCode} ${order.address.city}`, order.address.country].filter(Boolean).join(", ");

    return [
        {
            kind: "rows",
            title: "Customer",
            rows: [
                ["Name", [order.first_name, order.last_name].filter(Boolean).join(" ") || "—"],
                ["Email", order.email],
                ["Phone", order.phone || "—"],
                ["Delivery", address],
                ["Payment", order.payment_method],
            ],
        },
        { kind: "rows", title: "Order", rows: order_rows(order, en) },
        { kind: "button", label: "Open order in admin", href: absolute_url(`/en/admin/orders/${encodeURIComponent(order.id)}`) },
    ];
}

/* ───────────────────────── events ───────────────────────── */

async function safely(label: string, fn: () => Promise<unknown>) {
    try {
        await fn();
    } catch (error) {
        console.error(`Notification "${label}" failed`, error);
    }
}

/** A bank transfer order was placed (pieces reserved, payment pending). */
export async function notify_order_placed(order: Order) {
    if (order.payment_method != "Bank Transfer") return;
    await Promise.all([
        safely("customer bank order", () => customer_order_email(order, "received_bank")),
        safely("dealer bank order", () => dealer_email(`New bank transfer order ${order.id} — ${format_money(order.totals.total, order.currency)}, awaiting payment`, `New order ${order.id} (bank transfer)`, dealer_order_blocks(order), order.email)),
    ]);
}

/** Payment confirmed — online (PayPal/card) at checkout, or by the dealer for a bank transfer. */
export async function notify_order_paid(order: Order, source: "online" | "admin") {
    if (source == "online") {
        await Promise.all([
            safely("customer order confirmed", () => customer_order_email(order, "confirmed")),
            safely("dealer new order", () => dealer_email(`New order ${order.id} — ${format_money(order.totals.total, order.currency)} paid (${order.payment_method})`, `New paid order ${order.id}`, dealer_order_blocks(order), order.email)),
        ]);
    } else {
        await safely("customer payment received", () => customer_order_email(order, "payment_received"));
    }
}

export async function notify_order_shipped(order: Order) {
    await safely("customer shipped", () => customer_order_email(order, "shipped"));
}

/** Only for orders the customer actually placed (bank transfers) — not for an abandoned PayPal window. */
export async function notify_order_cancelled(order: Order, reason: "store" | "expired") {
    if (order.payment_method != "Bank Transfer" && reason == "expired") return;
    await safely("customer cancelled", () => customer_order_email(order, reason == "expired" ? "expired" : "cancelled"));
}

/* ───────────────────────── leads & appointments ───────────────────────── */

export async function notify_lead(lead: Sell | Consignment) {
    const watch = [lead.brand, lead.model].filter(Boolean).join(" ");
    const kind = lead.intent == "consign" ? "consignment" : "sell";

    await Promise.all([
        safely("customer lead received", async () => {
            const s = await get_settings();
            const { t, locale } = await translator(lead.locale, s);
            const { html, text } = render_email({
                store: s.store_name,
                heading: t("emails.leadReceived.heading"),
                blocks: [
                    { kind: "p", text: t("emails.greeting", { name: lead.firstName }) },
                    { kind: "p", text: t("emails.leadReceived.text", { watch }) },
                    { kind: "p", text: t("emails.signoff", { store: s.store_name }) },
                ],
                footer: footer(s),
                dir: getDirection(locale),
            });
            await send_email({ to: lead.email, subject: t("emails.leadReceived.subject"), html, text, reply_to: s.email });
        }),
        safely("dealer lead", () =>
            dealer_email(
                `New ${kind} request: ${watch}`,
                `New ${kind} request`,
                [
                    {
                        kind: "rows",
                        rows: [
                            ["Customer", `${lead.firstName} ${lead.lastName}`],
                            ["Email", lead.email],
                            ["Phone", lead.phone],
                            ["Watch", watch],
                            ["Reference", lead.refNum || "—"],
                            ["Condition", lead.condition],
                            ["Box / papers", [lead.box && "Box", lead.papers && "Papers"].filter(Boolean).join(", ") || "Neither"],
                            ["Asking price", format_money(lead.price, "EUR")],
                        ],
                    },
                    ...(lead.message ? [{ kind: "p" as const, text: lead.message }] : []),
                    ...(lead.images.length ? [{ kind: "images" as const, urls: lead.images }] : []),
                    { kind: "button", label: "Open request in admin", href: absolute_url(`/en/admin/leads/${encodeURIComponent(lead.id)}`) },
                ],
                lead.email,
            ),
        ),
    ]);
}

async function customer_appointment_email(a: Appointment, kind: "appointmentRequested" | "appointmentConfirmed") {
    const s = await get_settings();
    const { t, locale } = await translator(a.locale, s);
    const values = { date: date_text(a.date, locale), address: [s.address.street, `${s.address.postcode} ${s.address.city}`].filter((v) => v.trim()).join(", ") };

    const { html, text } = render_email({
        store: s.store_name,
        heading: t(`emails.${kind}.heading`),
        blocks: [
            { kind: "p", text: t("emails.greeting", { name: a.firstName }) },
            { kind: "p", text: t(`emails.${kind}.text`, values) },
            { kind: "p", text: t("emails.signoff", { store: s.store_name }) },
        ],
        footer: footer(s),
        dir: getDirection(locale),
    });
    await send_email({ to: a.email, subject: t(`emails.${kind}.subject`, values), html, text, reply_to: s.email });
}

export async function notify_appointment_requested(a: Appointment) {
    await Promise.all([
        safely("customer appointment requested", () => customer_appointment_email(a, "appointmentRequested")),
        safely("dealer appointment", () =>
            dealer_email(
                `Appointment request for ${date_text(a.date, "en-GB")}: ${a.firstName} ${a.lastName}`,
                "New appointment request",
                [
                    {
                        kind: "rows",
                        rows: [
                            ["Date", date_text(a.date, "en-GB")],
                            ["Customer", `${a.firstName} ${a.lastName}`],
                            ["Email", a.email],
                            ["Phone", a.phone],
                        ],
                    },
                    ...(a.reason ? [{ kind: "p" as const, text: a.reason }] : []),
                    { kind: "button", label: "Open appointments", href: absolute_url("/en/admin/appointments") },
                ],
                a.email,
            ),
        ),
    ]);
}

export async function notify_appointment_confirmed(a: Appointment) {
    await safely("customer appointment confirmed", () => customer_appointment_email(a, "appointmentConfirmed"));
}

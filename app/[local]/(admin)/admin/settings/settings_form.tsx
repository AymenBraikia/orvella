"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { save_settings } from "../actions/settings";
import { settings_schema } from "./schema";
import { WEEKDAYS, type StoreSettings } from "@/types/settings";

type Values = Omit<StoreSettings, "updated_at">;

/** Read or write a dotted path ("address.city") in the settings object. */
function get_path(obj: unknown, path: string): unknown {
    return path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], obj);
}
function set_path<T>(obj: T, path: string, value: unknown): T {
    const [head, ...rest] = path.split(".");
    const current = (obj as Record<string, unknown>)[head];
    return { ...obj, [head]: rest.length ? set_path(current ?? {}, rest.join("."), value) : value };
}

export default function SettingsForm({ initial, stripe_configured }: { initial: Values; stripe_configured: boolean }) {
    const router = useRouter();
    const [values, set_values] = useState<Values>(initial);
    const [emails, set_emails] = useState(initial.notification_emails.join(", "));
    const [errors, set_errors] = useState<Record<string, string>>({});
    const [message, set_message] = useState<{ ok: boolean; text: string } | null>(null);
    const [saving, start] = useTransition();

    const bind = (path: string) => ({
        value: String(get_path(values, path) ?? ""),
        error: errors[path],
        onChange: (v: string) => set_values((s) => set_path(s, path, v)),
    });
    const toggle = (path: string) => ({ checked: Boolean(get_path(values, path)), onChange: (v: boolean) => set_values((s) => set_path(s, path, v)) });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            ...values,
            notification_emails: emails
                .split(/[,;\s]+/)
                .map((s) => s.trim())
                .filter(Boolean),
        };

        const parsed = settings_schema.safeParse(payload);
        if (!parsed.success) {
            const next: Record<string, string> = {};
            for (const issue of parsed.error.issues) next[issue.path.join(".")] ??= issue.message;
            set_errors(next);
            set_message({ ok: false, text: "Please fix the highlighted fields." });
            return;
        }

        set_errors({});
        start(async () => {
            const result = await save_settings(payload);
            if (result.ok) {
                set_message({ ok: true, text: "Saved. The storefront uses the new settings now." });
                router.refresh();
            } else {
                set_errors(result.fields ?? {});
                set_message({ ok: false, text: result.error });
            }
        });
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
            <Section title="Store" hint="Shown in the header, footer, imprint, store page, emails and search results.">
                <Field label="Store name" {...bind("store_name")} />
                <Field label="Legal company name" {...bind("legal_name")} hint="As registered, e.g. Muster Uhren GmbH" />
                <Field label="Authorised representative" {...bind("representative")} />
                <Field label="VAT ID" {...bind("vat_id")} />
                <Field label="Register court" {...bind("register_court")} hint="Required for a GmbH, e.g. Amtsgericht München" />
                <Field label="Register number" {...bind("register_number")} hint="e.g. HRB 123456" />
                <Field label="Street and number" {...bind("address.street")} />
                <Field label="Postcode" {...bind("address.postcode")} />
                <Field label="City" {...bind("address.city")} />
                <Field label="Country" {...bind("address.country")} />
            </Section>

            <Section title="Consumer arbitration (§ 36 VSBG)" hint="Shown on the imprint and in the terms. Off means you state that you do not take part.">
                <Check label="We take part in consumer arbitration" {...toggle("arbitration_participates")} />
                <Field label="Arbitration board" {...bind("arbitration_board")} hint="Name, address and website of the board" />
            </Section>

            <Section title="Contact & social">
                <Field label="Phone" {...bind("phone")} />
                <Field label="Email" {...bind("email")} />
                <Field label="WhatsApp number" {...bind("whatsapp")} hint="International format, digits only: 4915112345678" />
                <Field label="Instagram URL" {...bind("instagram_url")} />
                <Field label="Chrono24 profile URL" {...bind("chrono24_url")} />
                <Field label="eBay shop URL" {...bind("ebay_url")} />
                <Field label="Parking (Google Maps link)" {...bind("parking_url")} />
            </Section>

            <Section title="Opening hours" hint="Free text per day. Leave empty for closed.">
                {WEEKDAYS.map((day) => (
                    <Field key={day} label={day[0].toUpperCase() + day.slice(1)} {...bind(`opening_hours.${day}`)} />
                ))}
            </Section>

            <Section title="Tax" hint="Applies to every order, whatever the payment method.">
                <Choice
                    label="How prices are taxed"
                    {...bind("tax.mode")}
                    options={[
                        { value: "included", label: "Prices include VAT (EU B2C)" },
                        { value: "added", label: "VAT is added at checkout" },
                        { value: "margin_scheme", label: "Margin scheme (§25a UStG), no VAT shown" },
                    ]}
                />
                <Field label="VAT rate (%)" type="number" {...bind("tax.rate")} />
            </Section>

            <Section title="Bank transfer" hint="Shown to customers who pay by bank transfer, with the order number as reference.">
                <Field label="Account holder" {...bind("bank.account_holder")} />
                <Field label="Bank" {...bind("bank.bank_name")} />
                <Field label="IBAN" {...bind("bank.iban")} />
                <Field label="BIC" {...bind("bank.bic")} />
                <Field label="Hold pieces for (days)" type="number" {...bind("reservation_days")} hint="Unpaid bank orders are cancelled after this." />
                <Field label="Order number prefix" {...bind("order_prefix")} hint="e.g. ORV → ORV-2026-000123" />
            </Section>

            <Section title="Checkout options">
                <Check label="PayPal" {...toggle("payments.paypal")} />
                <Check label="Bank transfer" {...toggle("payments.bank_transfer")} />
                <Check label={`Card payments (Stripe)${stripe_configured ? "" : " — needs STRIPE_SECRET_KEY"}`} {...toggle("payments.stripe")} disabled={!stripe_configured} />
                <Check label="Local pickup in store" {...toggle("payments.local_pickup")} />
            </Section>

            <Section title="Notifications" hint="New orders, sell/consign requests and appointments are emailed here.">
                <label className="flex flex-col gap-1 text-xs text-secondary sm:col-span-2">
                    Email addresses (comma separated)
                    <input value={emails} onChange={(e) => set_emails(e.target.value)} className="border-b border-secondary bg-transparent py-1 text-sm text-foreground outline-none focus:border-gold" />
                    {errors["notification_emails"] || Object.entries(errors).find(([k]) => k.startsWith("notification_emails."))?.[1] ? (
                        <span className="text-red-400">{errors["notification_emails"] ?? "One of the addresses is not valid"}</span>
                    ) : null}
                </label>
            </Section>

            <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-4 bg-background border-t border-secondary/30 py-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
                <button type="submit" disabled={saving} className={`button3 bg-gold text-primary px-6! py-3! ${saving ? "disabled" : ""}`}>
                    {saving ? "Saving…" : "Save settings"}
                </button>
                {message && (
                    <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-emerald-500" : "text-red-400"}`}>
                        {message.text}
                    </p>
                )}
            </div>
        </form>
    );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
    return (
        <fieldset className="border border-secondary/30 p-4 flex flex-col gap-4">
            <legend className="px-2 font-secondary text-gold">{title}</legend>
            {hint && <p className="text-xs text-secondary -mt-2">{hint}</p>}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{children}</div>
        </fieldset>
    );
}

function Field({ label, value, onChange, error, hint, type = "text" }: { label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; type?: "text" | "number" }) {
    return (
        <label className="flex flex-col gap-1 text-xs text-secondary">
            {label}
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`border-b bg-transparent py-1 text-sm text-foreground outline-none focus:border-gold ${error ? "border-red-400" : "border-secondary"}`} />
            {error ? <span className="text-red-400">{error}</span> : hint ? <span>{hint}</span> : null}
        </label>
    );
}

function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <label className="flex flex-col gap-1 text-xs text-secondary">
            {label}
            <select value={value} onChange={(e) => onChange(e.target.value)} className="border-b border-secondary bg-background py-1 text-sm text-foreground outline-none focus:border-gold">
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function Check({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <label className={`flex items-center gap-2 text-sm ${disabled ? "opacity-50" : "cursor-pointer"}`}>
            <input type="checkbox" disabled={disabled} checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-(--clr-gold) w-4 h-4" />
            {label}
        </label>
    );
}

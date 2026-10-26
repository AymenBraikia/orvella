import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { applyBrand } from "./brand";
import { routing } from "./routing";
import { brand_for_messages } from "@/app/server/store_identity";

type Locale = (typeof routing.locales)[number];
const is_locale = (value: unknown): value is Locale => routing.locales.includes(value as Locale);

export default getRequestConfig(async ({ requestLocale, locale: explicit }) => {
    // The locale in the URL (or one asked for explicitly, e.g. emails) wins; the cookie is the fallback.
    let locale = explicit ?? (await requestLocale);
    if (!is_locale(locale)) locale = (await cookies()).get("NEXT_LOCALE")?.value;
    if (!is_locale(locale)) locale = routing.defaultLocale;

    const messages = (await import(`@/messages/${locale}.json`)).default;

    // Store name from the settings, or the ?ref= pitch name, replaces "Orvella" in every message.
    const brand = await brand_for_messages();
    return { locale, messages: brand ? applyBrand(messages, brand) : messages };
});

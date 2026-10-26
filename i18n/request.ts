import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { applyBrand } from "./brand";
import { brand_for_messages } from "@/app/server/store_identity";

export default getRequestConfig(async () => {
    const store = await cookies();
    const locale = store.get("NEXT_LOCALE")?.value || "en";
    const messages = (await import(`@/messages/${locale}.json`)).default;

    // Store name from the settings, or the ?ref= pitch name, replaces "Orvella" in every message.
    const brand = await brand_for_messages();
    return { locale, messages: brand ? applyBrand(messages, brand) : messages };
});
import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { applyBrand } from "./brand";

export default getRequestConfig(async () => {
    const store = await cookies();
    const locale = store.get("NEXT_LOCALE")?.value || "en";
    const messages = (await import(`@/messages/${locale}.json`)).default;

    const brand = store.get("ref")?.value;
    return { locale, messages: brand ? applyBrand(messages, brand) : messages };
});
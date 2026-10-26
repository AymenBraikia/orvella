import type { Item } from "@/types/item";
import type { StoreSettings } from "@/types/settings";
import { absolute_url, BASE_URL } from "./site_url";
import { brand_name } from "./brand_name";
import { item_name } from "./item_name";

/** Site paths may contain spaces (/uploads/Rolex/…); make them valid absolute URLs. */
export function absolute_media(src: string): string {
    return src.startsWith("http") ? src : `${BASE_URL}${encodeURI(src)}`;
}

/** <script type="application/ld+json">, escaped so content can never close the tag. */
export function JsonLd({ data }: { data: object }) {
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

const AVAILABILITY = {
    available: "https://schema.org/InStock",
    reserved: "https://schema.org/LimitedAvailability",
    sold: "https://schema.org/SoldOut",
} as const;

/** schema.org Product for a product page (Google shopping / rich results). */
export function product_jsonld(item: Item, store_name: string, locale: string) {
    const url = absolute_url(`/${locale}/product/${encodeURIComponent(item.slug)}`);
    const is_watch = item.type == "watch" || item.type == "spare";

    return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: item_name(item),
        description: item.description,
        sku: item.slug,
        ...(is_watch && item.reference ? { mpn: item.reference } : {}),
        ...(is_watch && item.brand ? { brand: { "@type": "Brand", name: brand_name(item.brand) } } : {}),
        image: item.images.map(absolute_media),
        url,
        itemCondition: item.condition == "New" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
        offers: {
            "@type": "Offer",
            url,
            price: item.price,
            priceCurrency: "EUR",
            availability: AVAILABILITY[item.stock_status ?? "available"],
            itemCondition: item.condition == "New" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
            seller: { "@type": "Organization", name: store_name },
        },
    };
}

const DAY_CODES = { monday: "Mo", tuesday: "Tu", wednesday: "We", thursday: "Th", friday: "Fr", saturday: "Sa", sunday: "Su" } as const;

/** schema.org JewelryStore for the homepage, from the store settings. */
export function store_jsonld(s: StoreSettings, locale: string) {
    // Only "HH:MM – HH:MM" style hours can be expressed; free text like "by appointment" is left out.
    const hours = Object.entries(s.opening_hours).flatMap(([day, text]) => {
        const match = text.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
        return match ? [`${DAY_CODES[day as keyof typeof DAY_CODES]} ${match[1].padStart(2, "0")}:${match[2]}-${match[3].padStart(2, "0")}:${match[4]}`] : [];
    });

    return {
        "@context": "https://schema.org",
        "@type": "JewelryStore",
        name: s.store_name,
        legalName: s.legal_name,
        url: absolute_url(`/${locale}`),
        image: absolute_media("/banner.png"),
        logo: absolute_media("/logo_vertical.png"),
        telephone: s.phone,
        email: s.email,
        ...(s.vat_id ? { vatID: s.vat_id } : {}),
        address: { "@type": "PostalAddress", streetAddress: s.address.street, postalCode: s.address.postcode, addressLocality: s.address.city, addressCountry: s.address.country },
        ...(hours.length ? { openingHours: hours } : {}),
        sameAs: [s.instagram_url, s.chrono24_url, s.ebay_url].filter(Boolean),
    };
}

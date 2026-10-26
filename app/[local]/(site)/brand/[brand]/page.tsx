import Display_list from "@/app/components/display_list";
import get_brand from "../get_brand";
import { getTranslations } from "next-intl/server";
import { brand_name } from "../../lib/brand_name";
import type { Metadata } from "next";
import { page_metadata } from "../../lib/site_metadata";

interface PageProps {
    params: Promise<{
        brand: string;
        local: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { brand: raw, local } = await params;
    const brand = safe_decode(raw).toLowerCase().trim();
    const [first] = await get_brand(brand);
    const t = await getTranslations({ locale: local, namespace: "seo" });
    return page_metadata(local, `/brand/${encodeURIComponent(brand)}`, brand_name(brand), t("brand", { brand: brand_name(brand) }), first?.images[0]);
}

type BrandSection = { heading: string; text: string };

/** "Van Cleef & Arpels" -> "van_cleef_and_arpels", matching the keys under `brands` in messages/*.json */
function brand_key(brand: string): string {
    return brand.replace(/&/g, "and").replace(/[\s-]+/g, "_");
}

function safe_decode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export default async function DynamicPage({ params }: PageProps) {
    const brand = safe_decode((await params).brand).toLowerCase().trim();
    const data = await get_brand(brand);

    return (
        <div className="h-fit w-dvw py-4 sm:px-16 px-4 flex-center flex-col mt-10">
            <div className="w-full flex flex-col justify-start items-start gap-4">
                <h1 className="font-secondary">{brand_name(brand)}</h1>
                <Description brand={brand} />
            </div>
            {<Display_list items={data} />}
        </div>
    );
}

async function Description({ brand }: { brand: string }) {
    const t = await getTranslations("brands");
    const key = brand_key(brand);

    if (!t.has(`${key}.sections`)) return <div></div>;

    const sections = t.raw(`${key}.sections`) as BrandSection[];

    return (
        <div className="hidden sm:flex flex-col w-full h-fit gap-4 text-sm tracking-widest leading-5">
            {sections.map((section) => (
                <div key={section.heading} className="flex flex-col gap-4">
                    <h6 className="font-medium text-shine">{section.heading}</h6>
                    <p className="font-secondary">{section.text}</p>
                </div>
            ))}
        </div>
    );
}

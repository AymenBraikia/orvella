import { after } from "next/server";
import { notFound } from "next/navigation";
import AtcBtn from "@/app/components/buttons/addToCart";
import { item_price } from "../../lib/price_format";
import { server_has, server_href } from "@/app/server/storefront";
import get_product from "./get_product";
import Images_list from "./images";
import ProductLayout from "@/app/components/product_layout";
import Link from "next/link";
import InfoTable from "./info_table";
import increase_relevance_score from "@/app/server/increase_relevance_score";
import score_rewards from "../../lib/relevance_score";
import { getLocale, getTranslations } from "next-intl/server";
import { store_identity } from "@/app/server/store_identity";
import { absolute_url } from "../../lib/site_url";
import EnquiryForm from "./enquiry/enquiry_form";
import WhatsApp from "@/app/components/svg/whatsapp";
import { get_Currency } from "../../lib/get_currency";
import { item_name } from "../../lib/item_name";
import type { Metadata } from "next";
import { language_alternates } from "../../lib/site_metadata";
import { absolute_media, JsonLd, product_jsonld } from "../../lib/structured_data";

interface PageProps {
    params: Promise<{
        slug: string;
        local: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug, local } = await params;
    const data = await get_product(slug);
    if (!data) return {};

    const title = item_name(data);
    const description = data.description?.slice(0, 160);
    const image = data.images[0] ? absolute_media(data.images[0]) : undefined;

    return {
        title,
        description,
        alternates: language_alternates(`/product/${encodeURIComponent(data.slug)}`, local),
        openGraph: { title, description, type: "website", url: absolute_url(`/${local}/product/${encodeURIComponent(data.slug)}`), ...(image ? { images: [{ url: image, alt: title }] } : {}) },
        twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
        // Pieces only shown to one ?ref= visitor (private demos, pitches) are never indexed.
        ...(data.preview ? { robots: { index: false, follow: false } } : {}),
    };
}

export default async function DynamicPage({ params }: PageProps) {
    const slug = (await params).slug;
    const data = await get_product(slug);
    if (!data) notFound();

    const t = await getTranslations("product");
    const t_stock = await getTranslations("common.stock");
    const country = await get_Currency();

    after(() => increase_relevance_score(slug, score_rewards.view_details));

    const status = data.stock_status ?? "available";
    const t_common = await getTranslations("common");
    const store_links = [
        { href: "/store", label: t("findInStore") },
        { href: "/booking", label: t("bookAppointment") },
    ].filter((link) => server_has(link.href));

    // Most buyers of pre-owned luxury pieces ask first: WhatsApp with the piece prefilled, or the form below.
    const t_enquiry = await getTranslations("product.enquiry");
    const { whatsapp, store_name } = await store_identity();
    const reference = (data.type == "watch" || data.type == "spare") && data.reference ? ` (Ref. ${data.reference})` : "";
    const whatsapp_href = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(t_enquiry("whatsappText", { name: item_name(data), ref: reference, url: absolute_url(`/${await getLocale()}/product/${data.slug}`) }))}` : null;

    return (
        <ProductLayout before={<JsonLd data={product_jsonld(data, store_name, await getLocale())} />} gallery={<Images_list data={data} />}>
            <h1 className="tracking-wider">{item_name(data)}</h1>
            <p className="font-sans text-shine tracking-widest leading-8">{data.description}</p>
            {(data.type == "watch" || data.type == "spare") && data.reference && <h3>{`${t("reference")}: ${data.reference}`}</h3>}
            <h3 className={status == "sold" ? "line-through opacity-60" : ""}>{item_price(data.price, country, t_common("priceOnRequest"))}</h3>
            <h4>{t("stock") + ": " + t_stock(status)}</h4>
            <div className="flex-center gap-2 w-full flex-wrap sm:flex-nowrap lg:flex-wrap xl:flex-nowrap text-sm sm:text-base">
                <div className="2xl:w-2/5 font-sans xl:w-1/3 lg:w-full sm:w-1/3 w-full">
                    <AtcBtn slug={data.slug} status={status} />
                </div>
                <div className="flex-center gap-2 font-sans 2xl:w-3/5 xl:w-2/3 lg:w-full sm:w-2/3 w-full flex-wrap sm:flex-nowrap">
                    {store_links.map((link) => (
                        <Link key={link.href} href={server_href(link.href)} className="flex-center button w-full">
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full font-sans text-sm sm:text-base normal-case">
                <a href="#enquire" className="button2 border border-secondary/40">
                    {t_enquiry("enquire")}
                </a>
                {status == "available" && (
                    <a href="#enquire" className="button2 border border-secondary/40">
                        {t_enquiry("reserve")}
                    </a>
                )}
                {whatsapp_href && (
                    <a href={whatsapp_href} target="_blank" rel="noreferrer" className="button2 border border-secondary/40 flex items-center gap-2">
                        <WhatsApp classnames="w-5" />
                        {t_enquiry("whatsapp")}
                    </a>
                )}
            </div>
            <InfoTable item={data} />
            <EnquiryForm slug={data.slug} can_reserve={status == "available"} />
        </ProductLayout>
    );
}

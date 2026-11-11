import { getTranslations } from "next-intl/server";
import SectionsView from "./sections_view";
import { current_demo, server_href } from "@/app/server/storefront";
import { collection_path } from "../(site)/lib/storefront";

export default async function Sections() {
    const t = await getTranslations("home");
    const tc = await getTranslations("common");

    // A lead demo: its collections, with the seller's photos, each opening its shop filtered to it.
    const collections = current_demo()?.collections;
    if (collections) {
        return (
            <SectionsView
                heading={collections.heading}
                subtext={collections.subtext}
                // Four cards, like the store's categories (the menu and the shop filter list them all).
                cards={collections.items.slice(0, 4).map((c) => ({ href: server_href(collection_path(c.name)), label: c.name, explore: tc("explore"), image: c.image }))}
            />
        );
    }

    return (
        <SectionsView
            heading={t("sectionsHeading")}
            subtext={t("sectionsSubtext")}
            cards={[
                { href: "/watches", label: tc("watches"), explore: tc("explore"), image: "/watches.avif" },
                { href: "/rings", label: tc("rings"), explore: tc("explore"), image: "/rings.webp" },
                { href: "/bracelets", label: tc("bracelets"), explore: tc("explore"), image: "/bracelets.webp" },
                { href: "/necklaces", label: tc("necklaces"), explore: tc("explore"), image: "/necklaces.avif" },
            ]}
        />
    );
}

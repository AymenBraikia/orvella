import { getTranslations } from "next-intl/server";
import SectionsView from "./sections_view";

export default async function Sections() {
    const t = await getTranslations("home");
    const tc = await getTranslations("common");

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

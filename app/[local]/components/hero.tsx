import { getTranslations } from "next-intl/server";
import HeroView from "./hero_view";
import { current_demo } from "@/app/server/storefront";

const POSTER = "/hero_poster.webp"; // the video's first frame, so the switch to the video is seamless

export default async function Hero() {
    const t = await getTranslations("home");

    // A lead demo: the seller's video on phones (it is portrait) and a photo of theirs on wider screens.
    const demo = current_demo();
    if (demo) {
        const { title, subtitle, poster, video, desktop_image } = demo.hero;
        return <HeroView title={title} subtitle={subtitle} discover={t("discover")} href="#new" poster={poster} desktop_image={desktop_image} video={video} video_screens={desktop_image ? "mobile" : "desktop"} />;
    }

    return <HeroView title={t("heroTitle")} subtitle={t("heroSubtitle")} discover={t("discover")} poster={POSTER} video="/hero_vid.mp4" />;
}

import { getTranslations } from "next-intl/server";
import HeroView from "./hero_view";

const POSTER = "/hero_poster.webp"; // the video's first frame, so the switch to the video is seamless

export default async function Hero() {
    const t = await getTranslations("home");

    return <HeroView title={t("heroTitle")} subtitle={t("heroSubtitle")} discover={t("discover")} poster={POSTER} video="/hero_vid.mp4" />;
}

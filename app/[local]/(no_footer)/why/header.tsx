import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function Header() {
    const t = await getTranslations("why.nav");

    return (
        <header className={`flex justify-between items-center w-dvw px-4 sm:px-10 fixed top-0 inset-s-0 z-4000 min-h-15 sm:min-h-20 bg-background`}>
            <Link aria-label={"go back home"} href={"/"} className="min-w-fit w-25 sm:w-fit whitespace-nowrap text-xs sm:text-sm text-secondary hover:text-primary transition-default md:text-base ">
                {t("back")}
            </Link>
            <Link aria-label={"home"} href={"/"} className="relative aspect-square w-8 md:aspect-video md:w-25">
                <Image src={"/logo_dark.png"} sizes="(max-width: 768px) 175px, 200px" alt="Arvell" fill className={`md:block hidden object-cover object-center dark:brightness-100 brightness-0 `} />
                <Image src={"/logo_dark_compact.png"} sizes="(max-width: 768px) 175px, 200px" alt="Arvell" fill className={`md:hidden block object-cover object-center dark:brightness-100 brightness-0 `} />
            </Link>
            <Link aria-label={"see the next step"} href={"#cta"} className="min-w-fit w-25 sm:w-fit whitespace-nowrap text-xs sm:text-sm sm:button2 font-normal md:text-base ">
                {t("nextStep")}
            </Link>
        </header>
    );
}

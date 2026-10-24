import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Header() {
    const t = await getTranslations("why.nav");
    const t2 = await getTranslations("home");

    return (
        <header className={`flex justify-between items-center w-dvw px-4 sm:px-10 fixed top-0 inset-s-0 z-4000 min-h-15 sm:min-h-20 bg-background`}>
            <Link aria-label={"go back home"} href={"/"} className="min-w-fit w-25 sm:w-fit whitespace-nowrap text-xs sm:text-sm text-secondary hover:text-primary transition-default md:text-base ">
                {t("back")}
            </Link>
            <Link aria-label={"home"} href={"/"} className="w-fit font-primary flex-center text-base sm:text-xl md:text-2xl xl:text-4xl tracking-widest">
                {t2("heroTitle")}
                {/* <Image src={"/logo_vertical.png"} sizes="(max-width: 768px) 175px, 200px" alt="Orvella" fill className={`md:block hidden object-cover object-center dark:brightness-100 brightness-0 `} /> */}
                {/* <Image src={"/logo_dark_compact.png"} sizes="(max-width: 768px) 175px, 200px" alt="Orvella" fill className={`md:hidden block object-cover object-center dark:brightness-100 brightness-0 `} /> */}
            </Link>
            <Link aria-label={"see the next step"} href={"#cta"} className="min-w-fit w-25 sm:w-fit whitespace-nowrap text-xs sm:text-sm sm:button2 font-normal md:text-base ">
                {t("nextStep")}
            </Link>
        </header>
    );
}

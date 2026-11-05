import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Header() {
    const t = await getTranslations("why.nav");

    return (
        <header className={`flex justify-between items-center w-dvw px-4 sm:px-10 fixed top-0 inset-s-0 z-4000 min-h-15 sm:min-h-20 bg-background`}>
            <Link aria-label={"go back home"} href={"/"} className="min-w-fit w-25 sm:w-fit whitespace-nowrap text-xs sm:text-sm text-secondary hover:text-primary transition-default md:text-base ">
                {t("back")}
            </Link>
            {/* The pitch page is Corlane's own, so it carries the Corlane logo: the full wordmark where there is room, the C mark on small screens. */}
            <Link aria-label={"Corlane home"} href={"/"} className="w-fit flex-center shrink-0">
                <Image src={"/logo.svg"} alt="Corlane" width={882} height={230} className="hidden sm:block h-8 md:h-10 xl:h-12 w-auto" />
                <Image src={"/logo_simple.svg"} alt="Corlane" width={482} height={513} className="sm:hidden h-9 w-auto" />
            </Link>
            <Link aria-label={"see the next step"} href={"#cta"} className="min-w-fit w-25 sm:w-fit whitespace-nowrap text-xs sm:text-sm sm:button2 font-normal md:text-base ">
                {t("nextStep")}
            </Link>
        </header>
    );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function Error({ reset }: { reset: () => void }) {
    const t = useTranslations("error");
    return (
        <div className="flex-center py-10">
            <div className="relative aspect-video w-dvw">
                <div className="absolute top-1/7 inset-e-1/8 flex justify-center items-start flex-col fade-in p-8 max-w-150 bg-background">
                    <h1>{t("heading")}</h1>
                    <h5 className="font-secondary">{t("subHeading")}</h5>
                    <p className="mt-2 text-secondary">{t("subText")}</p>
                    <div className="flex gap-4">
                        <button onClick={() => reset()} className="mt-4 px-4 py-2 button capitalize">
                            {t("tryAgain")}
                        </button>
                        <Link href="/" className="mt-4 px-4 py-2 button2 capitalize">
                            {t("return")}
                        </Link>
                    </div>
                </div>
                <Image fill alt="Error" src={"/notFound.jpg"} sizes="100dvw" className="object-cover object-center -z-10 brightness-80" />
            </div>
        </div>
    );
}

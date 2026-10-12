"use client";

import { use, useState } from "react";
import Link from "next/link";
import Input from "@/app/components/elements/input";
import { useRouter } from "next/navigation";
import Log_in from "../actions/log_in";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string; ref?: string }> }) {
    const params = use(searchParams);
    const t = useTranslations("auth.login");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            const result = await Log_in(formData);

            if (result.success) {
                return router.push(result.redirect || "/");
            }

            setIsSubmitting(false);
            return setError(result.error || t("somethingWentWrong"));
        } catch {
            setIsSubmitting(false);
            setError(t("somethingWentWrong"));
        }
    }

    return (
        <div className="relative w-full max-w-md flex-center flex-col gap-4 rounded-2xl border border-(--bg-primary) p-6 sm:p-10">
            <div className="flex-center">
                <Link aria-label={"home"} href={"/"} className="relative aspect-video w-30">
                    <Image src={"/logo_dark.png"} alt={params.ref || "Arvell"} fill className={`object-cover object-center bright-img `} />
                </Link>
            </div>

            <h1 className="text-center font-secondary">{t("title")}</h1>

            <p className="text-sm leading-relaxed text-secondary">{t("description")}</p>

            <form onSubmit={handleSubmit} className="flex-center flex-col gap-6 w-full" noValidate>
                <input type="hidden" name="recordId" value={params.redirect} />

                <Input placeholder={t("emailPlaceholder")} name="email" type="email" required label={t("email")} />

                <Input placeholder={t("passwordPlaceholder")} name="password" type="password" required label={t("password")} />

                <button type="submit" disabled={isSubmitting} className={`button w-full rounded-lg py-3 font-medium transition-default ${isSubmitting ? "cursor-not-allowed" : "cursor-pointer"}`}>
                    {isSubmitting ? t("loggingIn") : t("logIn")}
                </button>
            </form>

            <p className="text-center text-sm text-secondary">
                {t("dontHaveAccount")}{" "}
                <Link href="/auth/sign_up" className="font-medium text-primary underline underline-offset-2">
                    {t("signUp")}
                </Link>
            </p>

            <div className={`fixed inset-e-0 bottom-4 text-sm transition-default bg-secondary p-4 ${error ? "-translate-x-4" : "translate-x-full"}`}>{error}</div>
        </div>
    );
}

"use client";

import { use, useState } from "react";
import Link from "next/link";
import Input from "@/app/components/elements/input";
import CheckBox from "@/app/components/elements/checkbox";
import Sign_up from "../actions/sign_up";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function SignUpPage({ searchParams }: { searchParams: Promise<{ redirect?: string; ref?: string }> }) {
    const params = use(searchParams);
    const t = useTranslations("auth.signUp");

    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (!agreed) {
            return setError(t("termsRequired"));
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            const result = await Sign_up(formData);

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

                <div className="w-full flex flex-col sm:flex-row items-stretch gap-6">
                    <Input placeholder={t("firstNamePlaceholder")} name="firstName" type="text" required label={t("firstName")} />

                    <Input placeholder={t("lastNamePlaceholder")} name="lastName" type="text" required label={t("lastName")} />
                </div>

                <Input placeholder={t("emailPlaceholder")} name="email" type="email" required label={t("email")} />

                <Input placeholder={t("passwordPlaceholder")} name="password" type="password" required label={t("password")} />

                <CheckBox label={t("agree")} action={setAgreed} active={agreed} name="agreed" />

                <button type="submit" disabled={isSubmitting} className={`button w-full rounded-lg py-3 font-medium transition-default ${isSubmitting ? "cursor-not-allowed" : "cursor-pointer"}`}>
                    {isSubmitting ? t("creatingAccount") : t("createAccount")}
                </button>
            </form>

            <p className="text-center text-sm text-secondary">
                {t("alreadyHaveAccount")}{" "}
                <Link href="/auth/log_in" className="font-medium text-primary underline underline-offset-2">
                    {t("logIn")}
                </Link>
            </p>

            <div className={`fixed inset-e-0 bottom-4 text-sm transition-default bg-secondary p-4 ${error ? "-translate-x-4" : "translate-x-full"}`}>{error}</div>
        </div>
    );
}

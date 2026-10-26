"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Input from "@/app/components/elements/input";
import { reset_password } from "../actions/password_reset";

export default function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
    const { token } = use(searchParams);
    const t = useTranslations("auth.reset");
    const t_errors = useTranslations("auth.errors");
    const t_home = useTranslations("home");
    const router = useRouter();

    const [saving, set_saving] = useState(false);
    const [error, set_error] = useState<string | null>(null);

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        set_error(null);
        set_saving(true);

        const result = await reset_password(new FormData(e.currentTarget));
        if (result.ok) {
            router.push("/");
            router.refresh();
            return;
        }

        set_saving(false);
        set_error(result.error == "invalid_token" ? t("invalid") : t_errors(result.error ?? "missing"));
    }

    return (
        <div className="relative w-full max-w-md flex-center flex-col gap-4 rounded-2xl border border-(--bg-primary) p-6 sm:p-10">
            <Link aria-label="home" href="/" className="w-fit text-gold font-primary text-2xl">
                {t_home("heroTitle")}
            </Link>

            <h4 className="text-center font-secondary">{t("title")}</h4>

            {token ? (
                <>
                    <p className="text-sm leading-relaxed text-secondary">{t("description")}</p>
                    <form onSubmit={submit} className="flex-center flex-col gap-6 w-full" noValidate>
                        <input type="hidden" name="token" value={token} />
                        <Input name="password" type="password" required label={t("password")} />
                        <button type="submit" disabled={saving} className={`button w-full rounded-lg py-3 font-medium ${saving ? "cursor-not-allowed" : "cursor-pointer"}`}>
                            {saving ? t("saving") : t("submit")}
                        </button>
                    </form>
                </>
            ) : (
                <p className="text-sm text-red-400">{t("invalid")}</p>
            )}

            {error && (
                <p role="alert" className="text-sm text-red-400">
                    {error}
                </p>
            )}

            <Link href="/auth/forgot" className="text-sm underline text-secondary">
                {t("newLink")}
            </Link>
        </div>
    );
}

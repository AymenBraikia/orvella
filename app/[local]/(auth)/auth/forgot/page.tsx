"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Input from "@/app/components/elements/input";
import { request_password_reset } from "../actions/password_reset";

export default function ForgotPasswordPage() {
    const t = useTranslations("auth.forgot");
    const t_errors = useTranslations("auth.errors");
    const t_home = useTranslations("home");

    const [state, set_state] = useState<"editing" | "sending" | "sent">("editing");
    const [error, set_error] = useState<string | null>(null);

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        set_error(null);
        set_state("sending");

        const result = await request_password_reset(new FormData(e.currentTarget));
        if (result.ok) return set_state("sent");

        set_state("editing");
        set_error(t_errors(result.error ?? "missing"));
    }

    return (
        <div className="relative w-full max-w-md flex-center flex-col gap-4 rounded-2xl border border-(--bg-primary) p-6 sm:p-10">
            <Link aria-label="home" href="/" className="w-fit text-gold font-primary text-2xl">
                {t_home("heroTitle")}
            </Link>

            <h4 className="text-center font-secondary">{t("title")}</h4>

            {state == "sent" ? (
                <p role="status" className="text-sm leading-relaxed text-center">
                    {t("sent")}
                </p>
            ) : (
                <>
                    <p className="text-sm leading-relaxed text-secondary">{t("description")}</p>
                    <form onSubmit={submit} className="flex-center flex-col gap-6 w-full" noValidate>
                        <Input name="email" type="email" required label={t("email")} />
                        <button type="submit" disabled={state == "sending"} className={`button w-full rounded-lg py-3 font-medium ${state == "sending" ? "cursor-not-allowed" : "cursor-pointer"}`}>
                            {state == "sending" ? t("sending") : t("submit")}
                        </button>
                    </form>
                    {error && (
                        <p role="alert" className="text-sm text-red-400">
                            {error}
                        </p>
                    )}
                </>
            )}

            <Link href="/auth/log_in" className="text-sm underline text-secondary">
                {t("back")}
            </Link>
        </div>
    );
}

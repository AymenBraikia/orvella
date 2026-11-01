"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Honeypot, { honeypot_value } from "@/app/components/elements/honeypot";
import Input from "@/app/components/elements/input";
import submit_lead from "./submit";
import { lead_schema, type LeadInput } from "./schema";

/**
 * "Book your custom demo": a dealer sends their stock link and how to reach them.
 * /why only ships the "why" translations to the browser, so the two shared texts come in as props.
 */
export default function LeadForm({ required, rate_limited_text }: { required: string; rate_limited_text: string }) {
    const t = useTranslations("why.cta");

    const schema = useMemo(() => lead_schema({ required, invalidContact: t("form.invalidContact"), invalidLink: t("form.invalidLink") }), [t, required]);
    const [state, set_state] = useState<"editing" | "sending" | "sent" | "failed">("editing");
    const [rate_limited, set_rate_limited] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LeadInput>({ resolver: zodResolver(schema) });

    const send = async (data: LeadInput, event?: React.BaseSyntheticEvent) => {
        set_state("sending");
        const result = await submit_lead({ ...data, website: honeypot_value(event) });
        set_rate_limited(!result.ok && result.error == "rate");
        set_state(result.ok ? "sent" : "failed");
    };

    if (state == "sent") {
        return (
            <div className="w-full border border-gold p-6 flex flex-col gap-3 text-start font-sans" role="status">
                <h3 className="text-gold font-secondary text-xl">{t("form.successHeading")}</h3>
                <p className="text-sm text-secondary">{t("form.successText")}</p>
            </div>
        );
    }

    const error = (message?: string) => message && <p className="text-red-400 text-sm">{message}</p>;

    return (
        <form onSubmit={handleSubmit(send)} className="w-full flex flex-col gap-5 text-start font-sans" noValidate>
            <Honeypot />
            <div className="grid sm:grid-cols-2 gap-5">
                <div>
                    <Input {...register("name")} label={t("form.name")} type="text" required />
                    {error(errors.name?.message)}
                </div>
                <div>
                    <Input {...register("business")} label={t("form.business")} type="text" required />
                    {error(errors.business?.message)}
                </div>
                <div>
                    <Input {...register("contact")} label={t("form.contact")} type="text" required />
                    {error(errors.contact?.message)}
                </div>
                <div>
                    <Input {...register("stock_url")} label={t("form.stock")} placeholder={t("form.stockPlaceholder")} type="text" required />
                    {error(errors.stock_url?.message)}
                </div>
            </div>

            <label className="flex flex-col gap-2 text-sm">
                {t("form.message")}
                <textarea {...register("message")} rows={3} className="w-full border-b border-secondary bg-transparent p-1 outline-none" />
            </label>

            <button type="submit" disabled={state == "sending"} className={`button w-full font-light ${state == "sending" ? "disabled" : ""}`}>
                {state == "sending" ? t("form.sending") : t("sendStock")}
            </button>
            {state == "failed" && (
                <p role="alert" className="text-red-400 text-sm">
                    {rate_limited ? rate_limited_text : t("form.error")}
                </p>
            )}
        </form>
    );
}

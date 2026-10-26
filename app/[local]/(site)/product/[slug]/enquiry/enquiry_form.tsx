"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Input from "@/app/components/elements/input";
import submit_enquiry from "./submit";
import { enquiry_schema, type EnquiryInput } from "./schema";

/** "Enquire about this piece" — also used to ask for a reservation. */
export default function EnquiryForm({ slug, can_reserve }: { slug: string; can_reserve: boolean }) {
    const t = useTranslations("product.enquiry");
    const t_fields = useTranslations("common.formFields");

    const schema = useMemo(() => enquiry_schema({ required: t_fields("required"), invalidEmail: t_fields("invalidEmail") }), [t_fields]);
    const [state, set_state] = useState<"editing" | "sending" | "sent" | "failed">("editing");

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<EnquiryInput>({ resolver: zodResolver(schema), defaultValues: { slug, type: "question" } });

    const type = watch("type");

    const send = async (data: EnquiryInput) => {
        set_state("sending");
        const result = await submit_enquiry(data);
        set_state(result.ok ? "sent" : "failed");
    };

    if (state == "sent") {
        return (
            <div id="enquire" className="w-full border border-gold p-6 flex flex-col gap-3 scroll-mt-28 font-sans normal-case" role="status">
                <h4 className="text-gold font-secondary">{t("successHeading")}</h4>
                <p className="text-sm text-secondary">{t("successText")}</p>
                <button
                    type="button"
                    className="underline text-sm w-fit"
                    onClick={() => {
                        reset({ slug, type: "question" });
                        set_state("editing");
                    }}
                >
                    {t("again")}
                </button>
            </div>
        );
    }

    return (
        <form id="enquire" onSubmit={handleSubmit(send)} className="w-full border border-secondary/40 p-4 sm:p-6 flex flex-col gap-5 scroll-mt-28 font-sans normal-case" noValidate>
            <h4 className="font-secondary">{t("heading")}</h4>

            {can_reserve && (
                <div className="flex flex-wrap gap-2 text-sm">
                    {(["question", "reservation"] as const).map((option) => (
                        <button key={option} type="button" onClick={() => setValue("type", option)} className={`px-3 py-2 border ${type == option ? "border-gold text-gold" : "border-secondary/40 text-secondary"}`}>
                            {option == "question" ? t("typeQuestion") : t("typeReservation")}
                        </button>
                    ))}
                </div>
            )}
            {type == "reservation" && <p className="text-xs text-secondary">{t("reservationNote")}</p>}

            <div className="grid sm:grid-cols-2 gap-5">
                <div>
                    <Input {...register("name")} label={t("name")} type="text" required />
                    {errors.name && <p className="text-red-400 text-sm">{errors.name.message}</p>}
                </div>
                <div>
                    <Input {...register("email")} label={t_fields("email")} type="email" required />
                    {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
                </div>
                <Input {...register("phone")} label={t_fields("phone")} type="tel" />
            </div>

            <label className="flex flex-col gap-2 text-sm">
                {t_fields("message")}
                <textarea {...register("message")} rows={4} placeholder={t("messagePlaceholder")} className="w-full border-b border-secondary bg-transparent p-1 outline-none" />
            </label>

            <button type="submit" disabled={state == "sending"} className={`button3 bg-gold text-primary w-fit px-6! py-3! ${state == "sending" ? "disabled" : ""}`}>
                {state == "sending" ? t("sending") : type == "reservation" ? t("submitReservation") : t("submit")}
            </button>
            {state == "failed" && (
                <p role="alert" className="text-red-400 text-sm">
                    {t("error")}
                </p>
            )}
        </form>
    );
}

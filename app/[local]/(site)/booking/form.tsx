"use client";

import { useMemo, useState } from "react";
import Honeypot, { honeypot_value } from "@/app/components/elements/honeypot";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/app/components/elements/input";
import Submit from "./submit";
import { booking_schema, type BookingInput, type BookingOutput } from "./schema";
import { useTranslations } from "next-intl";

export default function Form() {
    const t = useTranslations("booking.fields");
    const t_booking = useTranslations("booking");
    const t_validation = useTranslations("common.formFields");

    const formSchema = useMemo(
        () => booking_schema({ required: t_validation("required"), invalidEmail: t_validation("invalidEmail"), futureDate: t_validation("futureDate") }),
        [t_validation],
    );

    const [state, set_state] = useState<"editing" | "sending" | "sent" | "failed">("editing");
    const [rate_limited, set_rate_limited] = useState(false);
    const t_errors = useTranslations("common.errors");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<BookingInput, unknown, BookingOutput>({
        resolver: zodResolver(formSchema),
        mode: "onSubmit",
    });

    const onValid = async (data: BookingOutput, event?: React.BaseSyntheticEvent) => {
        set_state("sending");
        const result = await Submit({ ...data, website: honeypot_value(event) });
        set_rate_limited(!result.ok && result.error == "rate");
        set_state(result.ok ? "sent" : "failed");
    };

    if (state == "sent") {
        return (
            <div className="w-full flex-center flex-col gap-4 text-center py-16" role="status">
                <h3 className="font-medium font-secondary text-gold">{t_booking("success.heading")}</h3>
                <p className="text-shine max-w-150">{t_booking("success.text")}</p>
                <button
                    type="button"
                    className="button2 px-4 py-2 underline"
                    onClick={() => {
                        reset();
                        set_state("editing");
                    }}
                >
                    {t_booking("success.again")}
                </button>
            </div>
        );
    }

    const today = new Date();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const minDateString = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    return (
        <form onSubmit={handleSubmit(onValid)} className="w-full h-fit p-4 flex-center flex-col gap-6">
            <Honeypot />
            <div className={`w-full h-fit min-h-80 relative flex-center overflow-hidden`}>
                <div className="w-full max-w-200 gap-4 flex-center flex-wrap">
                    <div className="w-full sm:w-[calc(50%-8px)]">
                        <Input required {...register("firstName")} label={t("firstName")} type={"text"} />
                        {errors.firstName && <p className="text-red-400 text-sm">{errors.firstName.message}</p>}
                    </div>
                    <div className="w-full sm:w-[calc(50%-8px)]">
                        <Input required {...register("lastName")} label={t("lastName")} type={"text"} />
                        {errors.lastName && <p className="text-red-400 text-sm">{errors.lastName.message}</p>}
                    </div>
                    <div className="w-full sm:w-[calc(50%-8px)]">
                        <Input required {...register("email")} label={t("email")} type={"email"} />
                        {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
                    </div>
                    <div className="w-full sm:w-[calc(50%-8px)]">
                        <Input required {...register("phone")} label={t("phone")} type={"tel"} />
                        {errors.phone && <p className="text-red-400 text-sm">{errors.phone.message}</p>}
                    </div>
                    <div className="w-full">
                        <textarea {...register("reason")} className="w-full min-h-10 max-h-40 border-b outline-0 border-secondary p-1" id="messages" placeholder={t("reason")}></textarea>
                        {errors.reason && <p className="text-red-400 text-sm">{errors.reason.message}</p>}
                    </div>

                    <div className="w-full flex flex-col gap-4">
                        <label htmlFor="date" className="text-gray-300">
                            {t("appointmentDate")}*
                        </label>
                        <input
                            type="date"
                            id="date"
                            min={minDateString}
                            {...register("date")}
                            className="w-full bg-transparent border-b outline-none border-secondary p-1 text-white scheme-dark [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer transition-opacity"
                        />
                        {errors.date && <p className="text-red-400 text-sm">{errors.date?.message as string}</p>}
                    </div>
                </div>
            </div>

            <button type="submit" disabled={state == "sending"} className={`button px-4 py-2 ${state == "sending" ? "disabled" : ""}`}>
                {state == "sending" ? t_booking("sending") : t("submit")}
            </button>
            {state == "failed" && (
                <p role="alert" className="text-red-400 text-sm">
                    {rate_limited ? t_errors("rateLimited") : t_booking("error")}
                </p>
            )}
        </form>
    );
}

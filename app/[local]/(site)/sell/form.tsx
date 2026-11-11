"use client";

import { useCallback, useMemo, useState } from "react";
import Honeypot, { honeypot_value } from "@/app/components/elements/honeypot";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/app/components/elements/input";
import CheckBox from "@/app/components/elements/checkbox";
import ImagePicker from "@/app/components/upload/image_picker";
import Submit from "./submit";
import { sell_schema, type SellInput, type SellOutput } from "./schema";
import { MAX_SELL_IMAGES } from "../lib/upload_rules";
import { useTranslations } from "next-intl";

type FormInput = SellInput;
type FormOutput = SellOutput;

export default function Form() {
    const t = useTranslations("sell.form");
    const t_fields = useTranslations("common.formFields");
    const t_btns = useTranslations("common.buttons");
    const t_upload = useTranslations("common.upload");

    const formSchema = useMemo(
        () =>
            sell_schema({
                required: t_fields("required"),
                invalidEmail: t_fields("invalidEmail"),
                selectOption: t_fields("selectOption"),
                invalidPrice: t_fields("invalidPrice"),
                tooManyImages: t_upload("tooMany", { max: MAX_SELL_IMAGES }),
            }),
        [t_fields, t_upload],
    );

    const stepFields: Record<number, (keyof FormInput)[]> = {
        0: ["firstName", "lastName", "email", "phone"],
        1: ["intent"],
        2: ["brand", "price", "model", "refNum", "condition", "images", "message"],
    };

    const [step, set_step] = useState<number>(0);

    const [state, set_state] = useState<"editing" | "sending" | "sent" | "failed">("editing");
    const [rate_limited, set_rate_limited] = useState(false);
    const t_errors = useTranslations("common.errors");
    const [uploading, set_uploading] = useState(false);
    const [picker_key, set_picker_key] = useState(0);

    const {
        register,
        control,
        handleSubmit,
        trigger,
        setValue,
        reset,
        formState: { errors },
    } = useForm<FormInput, unknown, FormOutput>({
        resolver: zodResolver(formSchema),
        mode: "onSubmit",
        defaultValues: { images: [] },
    });

    const on_images = useCallback(
        (urls: string[], busy: boolean) => {
            setValue("images", urls);
            set_uploading(busy);
        },
        [setValue],
    );

    const nextStep = async () => {
        const valid = await trigger(stepFields[step]);
        if (valid) set_step((p) => Math.min(p + 1, 2));
    };

    const prevStep = () => set_step((p) => Math.max(p - 1, 0));

    const onValid = async (data: FormOutput, event?: React.BaseSyntheticEvent) => {
        if (uploading) return;
        set_state("sending");
        const result = await Submit({ ...data, website: honeypot_value(event) });
        set_rate_limited(!result.ok && result.error == "rate");
        set_state(result.ok ? "sent" : "failed");
    };

    function start_over() {
        reset({ images: [] });
        set_picker_key((k) => k + 1);
        set_step(0);
        set_state("editing");
    }

    if (state == "sent") {
        return (
            <div className="flex-center flex-col gap-4 text-center py-16" id="form" role="status">
                <h3 className="font-medium font-secondary text-gold">{t("success.heading")}</h3>
                <p className="text-shine max-w-150">{t("success.text")}</p>
                <button type="button" className="button2 px-4 py-2 underline" onClick={start_over}>
                    {t("success.again")}
                </button>
            </div>
        );
    }

    return (
        <div className="flex-center flex-col gap-4" id="form">
            <h3 className="font-medium font-secondary">{t("heading")}</h3>
            <p className="text-shine">{t("intro")}</p>

            <div className="flex justify-between items-center w-full mt-10 gap-2 max-w-150">
                <h6 className="text-sm! text-center">{t("sections.personalInformation")}</h6>
                <span className={`w-10 sm:w-20 h-0.5 bg-foreground transition-default ${step >= 1 ? "opacity-100" : "opacity-50"}`}></span>
                <h6 className={`text-sm! text-center transition-default ${step >= 1 ? "opacity-100" : "opacity-50"}`}>{t("sections.salePreference")}</h6>
                <span className={`w-10 sm:w-20 h-0.5 bg-foreground transition-default ${step >= 2 ? "opacity-100" : "opacity-50"}`}></span>
                <h6 className={`text-sm! text-center transition-default ${step >= 2 ? "opacity-100" : "opacity-50"}`}>{t("sections.watchDetails")}</h6>
            </div>

            <form onSubmit={handleSubmit(onValid)} className="w-full h-fit p-4 flex-center flex-col gap-6">
            <Honeypot />
                <div className={`sm:w-full w-dvw h-fit ${step == 2 ? "min-h-210" : step == 1 ? "sm:min-h-50 min-h-30" : "sm:min-h-50 min-h-100"} relative flex-center overflow-hidden`}>
                    <div className="w-full px-4 sm:px-0 sm:max-w-200 absolute inset-s-1/2 top-1/2 -translate-1/2 gap-4 sm:grid-cols-2 grid-cols-1 grid transition-default" style={{ transform: `translateX(${step * -100}dvw)` }}>
                        <div className="flex-center flex-col w-full">
                            <Input {...register("firstName")} label={t_fields("firstName")} type={"text"} />
                            {errors.firstName && <p className="text-red-400 text-sm w-full">{errors.firstName.message}</p>}
                        </div>
                        <div className="flex-center flex-col w-full">
                            <Input {...register("lastName")} label={t_fields("lastName")} type={"text"} />
                            {errors.lastName && <p className="text-red-400 text-sm w-full">{errors.lastName.message}</p>}
                        </div>
                        <div className="flex-center flex-col w-full">
                            <Input {...register("email")} label={t_fields("email")} type={"email"} />
                            {errors.email && <p className="text-red-400 text-sm w-full">{errors.email.message}</p>}
                        </div>
                        <div className="flex-center flex-col w-full">
                            <Input {...register("phone")} label={t_fields("phone")} type={"tel"} />
                            {errors.phone && <p className="text-red-400 text-sm w-full">{errors.phone.message}</p>}
                        </div>
                    </div>

                    <div className="w-full px-4 sm:px-0 sm:max-w-200 absolute inset-s-1/2 top-1/2 -translate-1/2 gap-4 grid transition-default" style={{ transform: `translateX(${step * -100 + 100}dvw)` }}>
                        <Input {...register("intent")} label={t("salePreferenceOptions.consignment")} type={"radio"} value="consign" />
                        <Input {...register("intent")} label={t("salePreferenceOptions.sell")} type={"radio"} value="sell" />
                        {errors.intent && <p className="text-red-400 text-sm w-full">{errors.intent.message}</p>}
                    </div>

                    <div className="w-full px-4 sm:px-0 sm:max-w-200 max-w-[90dvw] absolute inset-s-1/2 top-1/2 -translate-1/2 gap-4 flex-center flex-col transition-default" style={{ transform: `translateX(${step * -100 + 200}dvw)` }}>
                        <Input {...register("brand")} label={t("fields.brand")} type={"text"} />
                        {errors.brand && <p className="text-red-400 text-sm w-full">{errors.brand.message}</p>}

                        <Input {...register("price")} label={t("fields.askingPrice")} type={"number"} />
                        {errors.price && <p className="text-red-400 text-sm w-full">{errors.price.message}</p>}

                        <Input {...register("model")} label={t("fields.model")} type={"text"} />
                        <Input {...register("refNum")} label={t("fields.referenceNumber")} type={"text"} />

                        <div className="w-full flex flex-wrap gap-4 justify-start items-start">
                            <p className="w-full">{t("fields.boxPapersQuestion")}</p>
                            <div className="flex gap-20">
                                <Controller name="box" control={control} render={({ field }) => <CheckBox label={t("fields.box")} active={!!field.value} action={field.onChange} name="box" />} />
                                <Controller name="papers" control={control} render={({ field }) => <CheckBox label={t("fields.paper")} active={!!field.value} action={field.onChange} name="papers" />} />
                            </div>
                        </div>

                        <div className="w-full flex flex-wrap gap-4 justify-start items-start">
                            <p className="w-full">{t("fields.condition")}</p>
                            <div className="flex gap-4 sm:gap-20 w-full">
                                <Input {...register("condition")} label={t("fields.conditionNew")} type={"radio"} value="new" />
                                <Input {...register("condition")} label={t("fields.conditionMint")} type={"radio"} value="mint" />
                                <Input {...register("condition")} label={t("fields.conditionPreOwned")} type={"radio"} value="pre-owned" />
                            </div>
                            {errors.condition && <p className="text-red-400 text-sm w-full">{errors.condition.message}</p>}
                        </div>

                        <div className="max-w-full w-full sm:w-full flex flex-col gap-4">
                            <p>{t_fields("attachImages")}</p>
                            <ImagePicker key={picker_key} kind="sell" max={MAX_SELL_IMAGES} onChange={on_images} />
                            {errors.images && <p className="text-red-400 text-sm w-full">{errors.images.message as string}</p>}
                        </div>

                        <div className="w-full flex flex-col gap-4">
                            <p>{t_fields("message")}</p>
                            <textarea {...register("message")} className="w-full min-h-10 max-h-40 border-b outline-0 border-secondary p-1" id="messages" placeholder={t("fields.messagePlaceholder")}></textarea>
                        </div>
                    </div>
                </div>

                <div className="flex-center gap-4">
                    <button type="button" className={`button2 px-4 py-2 ${step == 0 ? "opacity-20 cursor-not-allowed!" : "opacity-100"}`} onClick={prevStep}>
                        {t_btns("previous")}
                    </button>
                    {step == 2 ? (
                        <button type="submit" disabled={state == "sending" || uploading} className={`button px-4 py-2 ${state == "sending" || uploading ? "disabled" : ""}`}>
                            {state == "sending" ? t("sending") : t_btns("submit")}
                        </button>
                    ) : (
                        <button type="button" className="button px-4 py-2" onClick={nextStep}>
                            {t_btns("next")}
                        </button>
                    )}
                </div>
                {uploading && step == 2 && <p className="text-sm text-secondary">{t("waitForUploads")}</p>}
                {state == "failed" && (
                    <p role="alert" className="text-red-400 text-sm">
                        {rate_limited ? t_errors("rateLimited") : t("error")}
                    </p>
                )}
            </form>
        </div>
    );
}

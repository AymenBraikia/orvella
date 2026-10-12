"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Input from "@/app/components/elements/input";
import CheckBox from "@/app/components/elements/checkbox";
import Submit from "./submit";
import { useTranslations } from "next-intl";

const formSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(1, "Phone number is required"),

    intent: z.enum(["consign", "sell"], {
        error: "Select consignment or sell",
    }),

    brand: z.string().min(1, "Brand is required"),
    price: z.coerce.number({ error: "Enter a valid price" }).positive("Price must be greater than 0"),
    model: z.string().optional(),
    refNum: z.string().optional(),
    box: z.boolean().optional(),
    papers: z.boolean().optional(),
    condition: z.enum(["new", "mint", "pre-owned"], {
        error: "Select a condition",
    }),
    images: z.any().refine((files: FileList | undefined) => !files || files.length <= 2, "Max 2 images allowed"),
    message: z.string().optional(),
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

export default function Form() {
    const t = useTranslations("sell.form");
    const t_fields = useTranslations("common.formFields");
    const t_btns = useTranslations("common.buttons");

    const stepFields: Record<number, (keyof FormInput)[]> = {
        0: ["firstName", "lastName", "email", "phone"],
        1: ["intent"],
        2: ["brand", "price", "model", "refNum", "condition", "images", "message"],
    };

    const [step, set_step] = useState<number>(0);

    const [results, set_results] = useState<boolean>(false);

    const {
        register,
        control,
        handleSubmit,
        trigger,
        formState: { errors },
    } = useForm<FormInput, unknown, FormOutput>({
        resolver: zodResolver(formSchema),
        mode: "onSubmit",
    });

    const nextStep = async () => {
        const valid = await trigger(stepFields[step]);
        if (valid) set_step((p) => Math.min(p + 1, 2));
    };

    const prevStep = () => set_step((p) => Math.max(p - 1, 0));

    const onValid = async (data: FormOutput) => set_results(await Submit({ ...data, id: crypto.randomUUID() }));
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
                            <input {...register("images")} type="file" id="images" multiple accept="image/*" className="button w-full" />
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
                        <button type="submit" className="button px-4 py-2">
                            {t_btns("submit")}
                        </button>
                    ) : (
                        <button type="button" className="button px-4 py-2" onClick={nextStep}>
                            {t_btns("next")}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

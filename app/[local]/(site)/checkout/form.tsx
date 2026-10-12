"use client";

import Input from "@/app/components/elements/input";
import { useAuth } from "../context/authContext";
import Select from "@/app/components/elements/select";
import { Activity, ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from "react";
import shipping from "@/app/shipping.json";
import CheckBox from "@/app/components/elements/checkbox";
import updateUser from "@/app/server/update_user";
import { useTranslations } from "next-intl";

const region_options = Object.values(shipping).map((e) => e.country_name);

export default function Form() {
    const { session } = useAuth();
    if (!session) return <></>;

    const t = useTranslations("common.formFields");

    const [country, set_country] = useState<string>(session.address.country);
    const [address1, set_address1] = useState<string | undefined>(session.address.address1);
    const [address2, set_address2] = useState<string | undefined>(session.address.address2);
    const [city, set_city] = useState<string | undefined>(session.address.city);
    const [phone, set_phone] = useState<string | undefined>(session.address.phone);
    const [postCode, set_postCode] = useState<string | undefined>(session.address.postCode);

    const [diff_addr, set_diff_addr] = useState<boolean>(false);

    useEffect(() => {
        const address = { country, address1, address2, city, phone, postCode };
        updateUser({ address });
    }, [country, address1, address2, city, phone, postCode]);

    const [diff_country, set_diff_country] = useState<string>("Germany");
    const [diff_address1, set_diff_address1] = useState<string | undefined>(undefined);
    const [diff_address2, set_diff_address2] = useState<string | undefined>(undefined);
    const [diff_city, set_diff_city] = useState<string | undefined>(undefined);
    const [diff_phone, set_diff_phone] = useState<string | undefined>(undefined);
    const [diff_postCode, set_diff_postCode] = useState<string | undefined>(undefined);

    useEffect(() => {
        const diff_address = { active: diff_addr, country: diff_country, address1: diff_address1, address2: diff_address2, city: diff_city, phone: diff_phone, postCode: diff_postCode };

        updateUser({ diff_address });
    }, [diff_country, diff_address1, diff_address2, diff_city, diff_phone, diff_postCode, diff_addr]);

    function handle_onChange(e: ChangeEvent<HTMLInputElement>, set: Dispatch<SetStateAction<string | undefined>>) {
        const newVal = e.target.value;
        set(newVal);
        console.log(newVal);
    }
    function handle_diff_onChange(e: ChangeEvent<HTMLInputElement>, set: Dispatch<SetStateAction<string | undefined>>) {
        const newVal = e.target.value;
        diff_addr && set(newVal);
    }

    return (
        <form className="w-full h-fit flex justify-start items-start flex-col gap-6 py-4" action={() => {}}>
            <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                <Input label={t("firstName")} type="text" name="firstName" required def_value={session.first_name} />
                <Input label={t("lastName")} type="text" name="lastName" required def_value={session.last_name} />
            </div>

            <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                <Input label={t("companyName")} type="text" name="copmanyName" />
                <Select options={region_options} set_value={set_country} value={country} label={t("countryRegion") + ": "} />
            </div>

            <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                <Input onChange={(e) => handle_onChange(e, set_address1)} value={address1} allowed={!session.local_pickup} label={`${t("streetAddress")} 1`} type="text" name="street1" required />
                <Input onChange={(e) => handle_onChange(e, set_address2)} value={address2} allowed={!session.local_pickup} label={`${t("streetAddress")} 2`} type="text" name="street2" />
            </div>
            <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                <Input onChange={(e) => handle_onChange(e, set_postCode)} value={postCode} allowed={!session.local_pickup} label={t("postCode")} type="text" name="postCode" required />
                <Input onChange={(e) => handle_onChange(e, set_city)} value={city} allowed={!session.local_pickup} label={t("townCity")} type="text" name="city" required />
            </div>
            <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                <Input onChange={(e) => handle_onChange(e, set_phone)} value={phone} label={t("phone")} type="tel" name="phone" required />
                <Input label={t("email")} type="text" name="email" def_value={session.email} required />
            </div>

            {!session.local_pickup && <CheckBox label={t("diffAddress")} active={diff_addr} action={set_diff_addr} name="different_address" />}
            {
                <Activity mode={diff_addr && !session.local_pickup ? "visible" : "hidden"}>
                    <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                        <Input label={t("firstName")} type="text" name="firstName" required def_value={session.first_name} />
                        <Input label={t("lastName")} type="text" name="lastName" required def_value={session.last_name} />
                    </div>

                    <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                        <Input label={t("companyName")} type="text" name="copmanyName" />
                        <Select options={region_options} set_value={set_diff_country} value={diff_country} label={t("countryRegion")} />
                    </div>

                    <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                        <Input onChange={(e) => handle_diff_onChange(e, set_diff_address1)} value={diff_address1} label={`${t("streetAddress")} 1`} type="text" name="diff_street1" required />
                        <Input onChange={(e) => handle_diff_onChange(e, set_diff_address2)} value={diff_address2} label={`${t("streetAddress")} 2`} type="text" name="diff_street2" />
                    </div>
                    <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                        <Input onChange={(e) => handle_diff_onChange(e, set_diff_postCode)} value={diff_postCode} label={t("postCode")} type="text" name="diff_postCode" required />
                        <Input onChange={(e) => handle_diff_onChange(e, set_diff_city)} value={diff_city} label={t("townCity")} type="text" name="diff_city" required />
                    </div>
                    <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                        <Input onChange={(e) => handle_diff_onChange(e, set_diff_phone)} value={diff_phone} label={t("phone")} type="tel" name="diff_phone" required />
                        <Input label={t("email")} type="text" name="diff_email" def_value={session.email} required />
                    </div>
                    <div className="w-full">
                        <label htmlFor="note">{t("orderNotes")}</label>
                        <textarea name="note" id="note" className="min-w-full max-h-50 min-h-10 border-b outline-none text-sm tracking-wider leading-8 bg-primary px-2" placeholder={t("orderNoteExample")}></textarea>
                    </div>
                </Activity>
            }
        </form>
    );
}

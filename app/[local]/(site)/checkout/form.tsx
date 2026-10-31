"use client";

import Input from "@/app/components/elements/input";
import Select from "@/app/components/elements/select";
import CheckBox from "@/app/components/elements/checkbox";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import shipping from "@/app/shipping.json";
import updateUser from "@/app/server/update_user";
import { useTranslations } from "next-intl";
import type { CheckoutCustomer } from "@/app/server/cart";

const region_options = Object.values(shipping).map((e) => e.country_name);

type Address = CheckoutCustomer["address"];
type AddressKey = "address1" | "address2" | "postCode" | "city" | "phone";

const SAVE_DELAY_MS = 500;
const is_email = (value: string) => value == "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * Saves shortly after the last change. Saving on blur is not enough: browser autofill fills every
 * field without focusing them, so the form would look complete while nothing reached the server.
 */
function useAutosave<T>(value: T, save: (value: T) => void) {
    const saved = useRef(value);

    useEffect(() => {
        if (saved.current === value) return;

        const timer = setTimeout(() => {
            saved.current = value;
            save(value);
        }, SAVE_DELAY_MS);

        return () => clearTimeout(timer);
    }, [value, save]);
}

/**
 * Billing / delivery details for signed-in customers and guests. The order is always built from
 * what was saved on the server.
 */
export default function Form({ customer }: { customer: CheckoutCustomer }) {
    const t = useTranslations("common.formFields");
    const t_checkout = useTranslations("checkout");
    const router = useRouter();

    const [contact, set_contact] = useState({ email: customer.email, firstName: customer.firstName, lastName: customer.lastName });
    const [address, set_address] = useState<Address>(customer.address);
    const [diff, set_diff] = useState(customer.diff_address);
    const [email_error, set_email_error] = useState(false);

    const pickup = customer.local_pickup;

    const save_contact = useCallback(
        async (next: typeof contact) => {
            if (!customer.guest) return;

            const email = next.email.trim();
            // A half-typed email stays out of the saved details; the error shows on leaving the field.
            const fields = { firstName: next.firstName.trim(), lastName: next.lastName.trim(), ...(is_email(email) ? { email } : {}) };
            if (await updateUser(fields)) router.refresh();
        },
        [customer.guest, router],
    );

    const save_address = useCallback(
        async (next: Address) => {
            if (await updateUser({ address: next })) router.refresh();
        },
        [router],
    );

    const save_diff = useCallback(
        async (next: typeof diff) => {
            if (await updateUser({ diff_address: next })) router.refresh();
        },
        [router],
    );

    useAutosave(contact, save_contact);
    useAutosave(address, save_address);
    useAutosave(diff, save_diff);

    const address_input = (key: AddressKey, label: string, required = true, type: "text" | "tel" = "text") => (
        <Input
            label={label}
            type={type}
            name={key}
            required={required}
            allowed={key == "phone" || !pickup}
            value={address[key] ?? ""}
            onChange={(e) => set_address((a) => ({ ...a, [key]: e.target.value }))}
        />
    );

    const diff_input = (key: AddressKey, label: string, required = true, type: "text" | "tel" = "text") => (
        <Input label={label} type={type} name={`diff_${key}`} required={required} value={diff[key] ?? ""} onChange={(e) => set_diff((a) => ({ ...a, [key]: e.target.value }))} />
    );

    return (
        <form className="w-full h-fit flex justify-start items-start flex-col gap-6 py-4" onSubmit={(e) => e.preventDefault()}>
            {customer.guest && <p className="text-sm text-secondary">{t_checkout("guestNote")}</p>}

            <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                <Input label={t("firstName")} type="text" name="firstName" required allowed={customer.guest} value={contact.firstName} onChange={(e) => set_contact((c) => ({ ...c, firstName: e.target.value }))} />
                <Input label={t("lastName")} type="text" name="lastName" required allowed={customer.guest} value={contact.lastName} onChange={(e) => set_contact((c) => ({ ...c, lastName: e.target.value }))} />
            </div>

            <div className="w-full flex md:flex-row flex-col justify-between items-start gap-4">
                <div className="w-full">
                    <Input label={t("email")} type="email" name="email" required allowed={customer.guest} value={contact.email} onChange={(e) => set_contact((c) => ({ ...c, email: e.target.value }))} onBlur={() => set_email_error(!is_email(contact.email.trim()))} />
                    {email_error && <p className="text-red-400 text-sm">{t("invalidEmail")}</p>}
                </div>
                {address_input("phone", t("phone"), true, "tel")}
            </div>

            <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                <Select
                    options={region_options}
                    set_value={
                        ((country: string) => set_address((a) => ({ ...a, country }))) as never
                    }
                    value={address.country}
                    label={t("countryRegion") + ": "}
                />
            </div>

            <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                {address_input("address1", `${t("streetAddress")} 1`)}
                {address_input("address2", `${t("streetAddress")} 2`, false)}
            </div>
            <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                {address_input("postCode", t("postCode"))}
                {address_input("city", t("townCity"))}
            </div>

            {!pickup && (
                <CheckBox
                    label={t("diffAddress")}
                    active={diff.active}
                    action={(active: boolean) => set_diff((d) => ({ ...d, active }))}
                    name="different_address"
                />
            )}

            {diff.active && !pickup && (
                <div className="w-full flex flex-col gap-6">
                    <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                        <Select
                            options={region_options}
                            set_value={
                                ((country: string) => set_diff((d) => ({ ...d, country }))) as never
                            }
                            value={diff.country}
                            label={t("countryRegion")}
                        />
                    </div>
                    <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                        {diff_input("address1", `${t("streetAddress")} 1`)}
                        {diff_input("address2", `${t("streetAddress")} 2`, false)}
                    </div>
                    <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">
                        {diff_input("postCode", t("postCode"))}
                        {diff_input("city", t("townCity"))}
                    </div>
                    <div className="w-full flex md:flex-row flex-col justify-between items-center gap-4">{diff_input("phone", t("phone"), true, "tel")}</div>
                </div>
            )}
        </form>
    );
}

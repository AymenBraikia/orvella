import { get_settings } from "@/app/server/settings";
import { PageHeader } from "../_components/ui";
import SettingsForm from "./settings_form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
    const settings = await get_settings();
    const { updated_at, ...values } = settings;

    return (
        <>
            <PageHeader title="Settings" subtitle={updated_at ? `Last saved ${new Date(updated_at).toLocaleString("en-GB")}` : "Not saved yet — the shop is using placeholder details."} />
            <SettingsForm initial={values} stripe_configured={Boolean(process.env.STRIPE_SECRET_KEY)} />
        </>
    );
}

import { randomUUID } from "node:crypto";
import { PageHeader } from "../../_components/ui";
import DemoForm from "../_components/demo_form";

export const metadata = { title: "New private demo" };

export default function NewDemoPage() {
    // The id exists before the first save so photos can be uploaded for it straight away.
    return (
        <>
            <PageHeader title="New private demo" subtitle="It goes live at its address as soon as you create it. Nothing links to it; share the link yourself." />
            <DemoForm id={randomUUID()} initial={null} is_new />
        </>
    );
}

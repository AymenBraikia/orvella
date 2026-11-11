"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import ConfirmButton from "../../_components/confirm_button";
import { delete_private_demo, set_private_demo_enabled } from "../../actions/private_demos";

/** Turn a demo on or off (off = its link shows a 404), or delete it for good. */
export default function DemoControls({ id, enabled }: { id: string; enabled: boolean }) {
    const router = useRouter();
    const [pending, start] = useTransition();

    return (
        <>
            <button
                type="button"
                disabled={pending}
                onClick={() =>
                    start(async () => {
                        await set_private_demo_enabled(id, !enabled);
                        router.refresh();
                    })
                }
                className={`button2 px-3! py-1! text-xs ${pending ? "disabled" : ""}`}
            >
                {pending ? "Working…" : enabled ? "Disable" : "Enable"}
            </button>
            <ConfirmButton
                label="Delete"
                confirm_label="Delete the demo, its photos and enquiries?"
                danger
                action={async () => {
                    await delete_private_demo(id);
                    router.push("/admin/demos");
                }}
            />
        </>
    );
}

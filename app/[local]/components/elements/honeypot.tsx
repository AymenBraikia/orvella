import type { Ref } from "react";

/**
 * Spam trap: a field people never see (off-screen, skipped by keyboard and screen readers) but
 * form-filling bots do fill in. The server silently drops submissions where it has a value.
 */
export default function Honeypot({ ref }: { ref?: Ref<HTMLInputElement> }) {
    return (
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
            <label>
                Website
                <input ref={ref} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
        </div>
    );
}

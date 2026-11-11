/**
 * Spam trap: a field people never see (off-screen, skipped by keyboard and screen readers) but
 * form-filling bots do fill in. The server silently drops submissions where it has a value.
 */
export default function Honeypot() {
    return (
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
            <label>
                Website
                <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
        </div>
    );
}

/** The trap's value from a submit event (react-hook-form passes it as the second argument). */
export function honeypot_value(event?: { target?: unknown }): string {
    const form = event?.target;
    return form instanceof HTMLFormElement ? String(new FormData(form).get("website") ?? "") : "";
}

import "server-only";

/*
 * Sending email, behind one function so the provider can be swapped (Resend today).
 *
 *   RESEND_API_KEY  — API key from resend.com (domain verified there)
 *   EMAIL_FROM      — e.g. "Orvella <orders@your-domain.com>"
 *
 * Without RESEND_API_KEY nothing is sent; in development (or with EMAIL_LOG=1) the email is logged instead.
 * Never throws: a failed email must not break an order or a form submission.
 */

export type Email = {
    to: string | string[];
    subject: string;
    html: string;
    text: string;
    reply_to?: string;
};

export async function send_email(email: Email): Promise<boolean> {
    const to = (Array.isArray(email.to) ? email.to : [email.to]).filter(Boolean);
    if (!to.length) return false;

    const key = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!key || !from) {
        // EMAIL_LOG=1 prints unsent emails in production too (handy before Resend is set up).
        if (process.env.NODE_ENV !== "production" || process.env.EMAIL_LOG === "1") console.info(`[email not sent — RESEND_API_KEY/EMAIL_FROM missing] to=${to.join(", ")} subject="${email.subject}"\n${email.text}`);
        else console.warn(`Email "${email.subject}" not sent: RESEND_API_KEY or EMAIL_FROM is not configured`);
        return false;
    }

    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from, to, subject: email.subject, html: email.html, text: email.text, ...(email.reply_to ? { reply_to: email.reply_to } : {}) }),
        });

        if (!res.ok) {
            console.error(`Email "${email.subject}" to ${to.join(", ")} failed (${res.status}): ${await res.text()}`);
            return false;
        }
        return true;
    } catch (error) {
        console.error(`Email "${email.subject}" to ${to.join(", ")} failed`, error);
        return false;
    }
}

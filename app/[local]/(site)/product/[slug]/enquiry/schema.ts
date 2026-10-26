import { z } from "zod";

export type EnquiryMessages = { required: string; invalidEmail: string };

/** Product enquiry form, shared by the browser and the server action. */
export function enquiry_schema(m: EnquiryMessages = { required: "required", invalidEmail: "invalid email" }) {
    return z.object({
        slug: z.string().min(1).max(200),
        type: z.enum(["question", "reservation"]),
        name: z.string().trim().min(1, m.required).max(120),
        email: z.string().trim().email(m.invalidEmail).max(200),
        phone: z.string().trim().max(40).optional(),
        message: z.string().trim().max(3000).optional(),
    });
}

export type EnquiryInput = z.input<ReturnType<typeof enquiry_schema>>;

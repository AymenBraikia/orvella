import ForgotPage from "@/app/(auth)/auth/forgot/page";
import { require_demo } from "@/app/server/storefront";

/** The store's /auth/forgot page inside a lead demo. */
export default async function DemoForgotPage({ params }: PageProps<"/[local]/[demo]/auth/forgot">) {
    await require_demo(params, "/auth/forgot");
    return <ForgotPage />;
}

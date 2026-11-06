import SignUpPage from "@/app/(auth)/auth/sign_up/page";
import { require_demo } from "@/app/server/storefront";

/** The store's /auth/sign_up page inside a lead demo. */
export default async function DemoSignUpPage({ params, searchParams }: PageProps<"/[local]/[demo]/auth/sign_up">) {
    await require_demo(params, "/auth/sign_up");
    return <SignUpPage searchParams={searchParams as Promise<Record<string, string>>} />;
}

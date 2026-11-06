import LoginPage from "@/app/(auth)/auth/log_in/page";
import { require_demo } from "@/app/server/storefront";

/** The store's /auth/log_in page inside a lead demo. */
export default async function DemoLoginPage({ params, searchParams }: PageProps<"/[local]/[demo]/auth/log_in">) {
    await require_demo(params, "/auth/log_in");
    return <LoginPage searchParams={searchParams as Promise<Record<string, string>>} />;
}

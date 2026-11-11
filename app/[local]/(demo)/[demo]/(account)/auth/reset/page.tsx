import ResetPage from "@/app/(auth)/auth/reset/page";
import { require_demo } from "@/app/server/storefront";

/** The store's /auth/reset page inside a lead demo. */
export default async function DemoResetPage({ params, searchParams }: PageProps<"/[local]/[demo]/auth/reset">) {
    await require_demo(params, "/auth/reset");
    return <ResetPage searchParams={searchParams as Promise<Record<string, string>>} />;
}

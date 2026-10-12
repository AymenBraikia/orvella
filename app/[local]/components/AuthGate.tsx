import getUser from "@/app/server/get_user";
import AuthShell from "./AuthShell";

export default async function AuthGate({ children }: { children: React.ReactNode }) {
    const session = await getUser();
    return <AuthShell session={session}>{children}</AuthShell>;
}

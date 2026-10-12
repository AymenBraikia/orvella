export function read_cookie(name: string) {
    const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));

    return match?.split("=")[1];
}

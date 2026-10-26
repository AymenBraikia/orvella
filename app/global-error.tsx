"use client";

import Link from "next/link";

export default function GlobalError() {
    return (
        <html lang="en">
            <body>
                <main
                    style={{
                        minHeight: "100vh",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "16px",
                        padding: "24px",
                        fontFamily: "sans-serif",
                    }}
                >
                    <h1>Something went wrong!</h1>

                    <p>An unexpected error occurred.</p>

                    <button onClick={() => window.location.reload()}>Try again</button>

                    <Link href="/">Return home</Link>
                </main>
            </body>
        </html>
    );
}

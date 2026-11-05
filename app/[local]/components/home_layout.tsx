/** A home page: the fixed full-screen hero, with the sections (`children`) scrolling up over it. */
export default function HomeLayout({ before, hero, children }: { before?: React.ReactNode; hero: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex-col flex-center w-dvw">
            {before}
            {hero}

            <div className="mt-[100dvh] flex-col flex-center w-dvw bg-background z-10">{children}</div>
        </div>
    );
}

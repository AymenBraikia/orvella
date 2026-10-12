import WatchForm from "../../components/watch_form";

export const metadata = { title: "Add a watch" };

export default function NewWatch() {
    return (
        <>
            <header className="mb-8">
                <h1 className="text-2xl font-secondary">Add a watch</h1>
                <p className="opacity-50 text-sm mt-1">It appears in the shop as soon as you save.</p>
            </header>

            <WatchForm />
        </>
    );
}

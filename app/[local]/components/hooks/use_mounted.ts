import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** true on the client after hydration, false during SSR — without a setState-in-effect round trip */
export function useMounted(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );
}

/** Where a private demo photo is served (app/api/demo-photos/[id]). */
export function demo_photo_url(id: string): string {
    return `/api/demo-photos/${encodeURIComponent(id)}`;
}

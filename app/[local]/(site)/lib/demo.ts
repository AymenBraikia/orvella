/**
 * DEMO_MODE=true marks a public demo deployment: noindex, a demo banner, placeholder legal details,
 * sandbox / test payments only. Off (a real dealer's shop), none of that appears.
 * Mapped through next.config so client components can read it too (changing it needs a redeploy).
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

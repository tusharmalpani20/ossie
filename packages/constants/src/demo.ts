export const DEMO_HOTSPOT_TYPES = [
  "click",
  "info",
  "next",
] as const;
export type DemoHotspotType = (typeof DEMO_HOTSPOT_TYPES)[number];

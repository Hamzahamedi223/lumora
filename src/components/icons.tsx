import type { SVGProps } from "react";

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const IconBag = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const IconMenu = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h10" /></svg>
);
export const IconX = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconArrow = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconTruck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>
);
export const IconLeaf = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" /><path d="M5 19c3-4 6-6 10-8" /></svg>
);
export const IconHand = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5v-6a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 16l-1-3a1.5 1.5 0 0 1 2.6-1.4L8 14" /></svg>
);
export const IconShield = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IconSpark = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></svg>
);
export const IconMinus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 12h14" /></svg>
);
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconTrash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m5 12 5 5 9-10" /></svg>
);
export const IconInstagram = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></svg>
);
export const IconFacebook = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z" /></svg>
);
export const IconWhatsapp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 20l1.3-4A8 8 0 1 1 8 18.8z" /><path d="M9.5 8.5c0 3 3 6 6 6l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z" /></svg>
);
export const IconUpload = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" /></svg>
);

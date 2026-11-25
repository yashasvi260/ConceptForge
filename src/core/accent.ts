import type { AccentColor } from "./types";

/** Literal Tailwind class strings per accent, so the compiler can see every class. */
export interface AccentClasses {
  text: string;
  bg: string;
  softBg: string;
  border: string;
  ring: string;
  solid: string;
  hex: string;
}

export const ACCENTS: Record<AccentColor, AccentClasses> = {
  sky: {
    text: "text-sky-300",
    bg: "bg-sky-500",
    softBg: "bg-sky-500/10",
    border: "border-sky-500/40",
    ring: "ring-sky-400",
    solid: "bg-sky-500 hover:bg-sky-400 text-slate-950",
    hex: "#38bdf8",
  },
  emerald: {
    text: "text-emerald-300",
    bg: "bg-emerald-500",
    softBg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    ring: "ring-emerald-400",
    solid: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
    hex: "#34d399",
  },
  amber: {
    text: "text-amber-300",
    bg: "bg-amber-500",
    softBg: "bg-amber-500/10",
    border: "border-amber-500/40",
    ring: "ring-amber-400",
    solid: "bg-amber-500 hover:bg-amber-400 text-slate-950",
    hex: "#fbbf24",
  },
  violet: {
    text: "text-violet-300",
    bg: "bg-violet-500",
    softBg: "bg-violet-500/10",
    border: "border-violet-500/40",
    ring: "ring-violet-400",
    solid: "bg-violet-500 hover:bg-violet-400 text-slate-950",
    hex: "#a78bfa",
  },
  rose: {
    text: "text-rose-300",
    bg: "bg-rose-500",
    softBg: "bg-rose-500/10",
    border: "border-rose-500/40",
    ring: "ring-rose-400",
    solid: "bg-rose-500 hover:bg-rose-400 text-slate-950",
    hex: "#fb7185",
  },
};

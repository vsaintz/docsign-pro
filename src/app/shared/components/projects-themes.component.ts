export const THEMES = [
  {
    label: "Blue",
    bg: "bg-[oklch(0.91_0.05_240)]",
    stroke: "oklch(0.55 0.07 240)",
    fill: "oklch(0.91 0.05 240 / 0.45)",
  },
  {
    label: "Sand",
    bg: "bg-[oklch(0.94_0.04_55)]",
    stroke: "oklch(0.63 0.10 52)",
    fill: "oklch(0.94 0.04 55 / 0.45)",
  },
  {
    label: "Terra",
    bg: "bg-[oklch(0.93_0.05_35)]",
    stroke: "oklch(0.61 0.11 32)",
    fill: "oklch(0.93 0.05 35 / 0.45)",
  },
  {
    label: "Honey",
    bg: "bg-[oklch(0.93_0.04_75)]",
    stroke: "oklch(0.64 0.10 78)",
    fill: "oklch(0.93 0.04 75 / 0.45)",
  },
  {
    label: "Clay",
    bg: "bg-[oklch(0.93_0.03_20)]",
    stroke: "oklch(0.60 0.08 18)",
    fill: "oklch(0.93 0.03 20 / 0.45)",
  },
  {
    label: "Moss",
    bg: "bg-[oklch(0.93_0.03_100)]",
    stroke: "oklch(0.62 0.08 103)",
    fill: "oklch(0.93 0.03 100 / 0.45)",
  },
  {
    label: "Sage",
    bg: "bg-[oklch(0.93_0.02_200)]",
    stroke: "oklch(0.59 0.05 200)",
    fill: "oklch(0.93 0.02 200 / 0.45)",
  },
]

export const COLOR_MAP = new Map(THEMES.map((t) => [t.bg, t]))

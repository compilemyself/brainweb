export const THEMES = {
  BRAINWEB: { name: "BRAINWEB", primary: "#48abb3", secondary: "#0f2f33" },
  GASAI: { name: "GASAI", primary: "#12e09c", secondary: "#d889a2" },
  FLORA: { name: "FLORA", primary: "#43e486", secondary: "#b39e65f1" },
  WORMS: { name: "WORMS", primary: "#ffb3d1", secondary: "#9caf55" },
  ANDROGYNOUS: { name: "ANDROGYNOUS", primary: "#f1db10", secondary: "#723cb1" },
  MUD: { name: "MUD", primary: "#d3a373", secondary: "#7c97af" },
  BASIC: { name: "BASIC", primary: "#e6ce9980", secondary: "#947e704b" }, 
  SPAWN: { name: "SPAWN", primary: "#b34747", secondary: "#1F1F1F" },
  PANTHERESS: { name: "PANTHERESS", primary: "#ff97b7f3", secondary: "#ecb3cf" },
  JM: { name: "JM", primary: "#8d47b3", secondary: "#C369B6" },
  EVA: { name: "EVA", primary: "#adf309", secondary: "#674094" },
  DAWN: { name: "DAWN", primary: "#4768b3", secondary: "#9e9bccea" },
  URSULA: { name: "URSULA", primary: "#C75858", secondary: "#ddb8b4" },
  INVINCIBLE: { name: "INVINCIBLE", primary: "#ffe033ec", secondary: "#66bfd8f8" },
  NEON: { name: "NEON", primary: "#46dae7", secondary: "#8e6cda" },
  "custom 1": { name: "custom 1", primary: null, secondary: null },
  "custom 2": { name: "custom 2", primary: null, secondary: null },
};

export function resolveTheme(config = {}) {
  const key = config.cor_mapa || "BRAINWEB";
  const base = THEMES[key] || THEMES.BRAINWEB;
  if (key === "custom 1") return { ...base, primary: config.custom_1_primaria || THEMES.BRAINWEB.primary, secondary: config.custom_1_secundaria || THEMES.BRAINWEB.secondary };
  if (key === "custom 2") return { ...base, primary: config.custom_2_primaria || THEMES.BRAINWEB.primary, secondary: config.custom_2_secundaria || THEMES.BRAINWEB.secondary };
  return base;
}
export const THEMES = {
  BRAINWEB: { name: "BRAINWEB", primary: "#48abb3", secondary: "#0f2f33" },
  GASAI: { name: "GASAI", primary: "#27ce9c", secondary: "#d3809a" },
  FLORA: { name: "FLORA", primary: "#43e486", secondary: "#b39e65f1" },
  WORMS: { name: "WORMS", primary: "#ffb0cf", secondary: "#96aa4d" },
  ANDROGYNOUS: { name: "ANDROGYNOUS", primary: "#e4c129", secondary: "#6c439b" },
  MUD: { name: "MUD", primary: "#d3a373", secondary: "#7c97af" },
  BASIC: { name: "BASIC", primary: "#e6cd9996", secondary: "#947e70b0" }, 
  SPAWN: { name: "SPAWN", primary: "#b34747", secondary: "#1F1F1F" },
  PANTHERESS: { name: "PANTHERESS", primary: "#ffa9caf3", secondary: "#ffb3d8d2" },
  JM: { name: "JM", primary: "#8d47b3", secondary: "#C369B6" },
  EVA: { name: "EVA", primary: "#adf309", secondary: "#674094" },
  DAWN: { name: "DAWN", primary: "#4768b3", secondary: "#9e9bccea" },
  URSULA: { name: "URSULA", primary: "#C75858", secondary: "#ddb8b4" },
  INVINCIBLE: { name: "INVINCIBLE", primary: "#ffe033ec", secondary: "#66bfd8f8" },
  NEON: { name: "NEON", primary: "#96cfd4", secondary: "#8e6cda" },
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
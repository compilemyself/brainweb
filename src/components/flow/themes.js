export const THEMES = {
  BRAINWEB: { name: "BRAINWEB", primary: "#48abb3", secondary: "#0f2f33" },
  GASAI: { name: "GASAI", primary: "#47b393", secondary: "#cf7b96" },
  FLORA: { name: "FLORA", primary: "#47b36d", secondary: "#bdb066" },
  WORMS: { name: "WORMS", primary: "#ffc4e0", secondary: "#acb868" },
  ANDROGYNOUS: { name: "ANDROGYNOUS", primary: "#e7cb4e", secondary: "#7440af" },
  MUD: { name: "MUD", primary: "#b88f66", secondary: "#839bb1" },
  BASIC: { name: "BASIC", primary: "#d6b48c", secondary: "#8d7c71" }, 
  SPAWN: { name: "SPAWN", primary: "#b34747", secondary: "#1F1F1F" },
  PANTHERESS: { name: "PANTHERESS", primary: "#ff8eb0", secondary: "#ffc2d3" },
  JM: { name: "JM", primary: "#8d47b3", secondary: "#C369B6" },
  EVA: { name: "EVA", primary: "#9bdb34", secondary: "#7752a1" },
  DAWN: { name: "DAWN", primary: "#4768b3", secondary: "#9E9BCC" },
  URSULA: { name: "URSULA", primary: "#C75858", secondary: "#ddb8b4" },
  INVINCIBLE: { name: "INVINCIBLE", primary: "#ffe75c", secondary: "#66bfd8" },
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
export const THEMES = {
  BRAINWEB: { name: "BRAINWEB", primary: "#48abb3", secondary: "#0f2f33" },
  GASAI: { name: "GASAI", primary: "#47b393", secondary: "#cf7b96" },
  FLORA: { name: "FLORA", primary: "#44bd6e", secondary: "#ccc287" },
  WORMS: { name: "WORMS", primary: "#ffa8d0", secondary: "#9cb458" },
  ANDROGYNOUS: { name: "ANDROGYNOUS", primary: "#f1ce31", secondary: "#734ca0" },
  MUD: { name: "MUD", primary: "#d3a373", secondary: "#7c97af" },
  BASIC: { name: "BASIC", primary: "#e9c397be", secondary: "#8d7c71" }, 
  SPAWN: { name: "SPAWN", primary: "#b34747", secondary: "#1F1F1F" },
  PANTHERESS: { name: "PANTHERESS", primary: "#ff9fbcf3", secondary: "#ffcae4" },
  JM: { name: "JM", primary: "#8d47b3", secondary: "#C369B6" },
  EVA: { name: "EVA", primary: "#c2eb0b", secondary: "#674094" },
  DAWN: { name: "DAWN", primary: "#4768b3", secondary: "#9E9BCC" },
  URSULA: { name: "URSULA", primary: "#C75858", secondary: "#ddb8b4" },
  INVINCIBLE: { name: "INVINCIBLE", primary: "#ffe552f5", secondary: "#66bfd8" },
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
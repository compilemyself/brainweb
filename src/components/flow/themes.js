export const THEMES = {
  BRAINWEB: { name: "BRAINWEB", primary: "#48abb3", secondary: "#0f2f33" },
  GASAI: { name: "GASAI", primary: "#09d692", secondary: "#d889a2" },
  FLORA: { name: "FLORA", primary: "#3fb871", secondary: "#9c8c5e" },
  WORMS: { name: "WORMS", primary: "#ffadce", secondary: "#a1b364" },
  ANDROGYNOUS: { name: "ANDROGYNOUS", primary: "#f0e263", secondary: "#63338a" },
  MUD: { name: "MUD", primary: "#d3a373", secondary: "#7c97af" },
  BASIC: { name: "BASIC", primary: "#a59574", secondary: "#7a6b62" }, 
  SPAWN: { name: "SPAWN", primary: "#b34747", secondary: "#1F1F1F" },
  PANTHERESS: { name: "PANTHERESS", primary: "#fd90b1", secondary: "#ffbae2" },
  JM: { name: "JM", primary: "#8d47b3", secondary: "#C369B6" },
  EVA: { name: "EVA", primary: "#8bd450", secondary: "#734f9a" },
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
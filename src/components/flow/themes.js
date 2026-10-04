export const THEMES = {
  BRAINWEB: { name: "BRAINWEB", primary: "#48abb3", secondary: "#0f2f33" },
  GASAI: { name: "GASAI", primary: "#47b393", secondary: "#CC6C8B" },
  FLORA: { name: "FLORA", primary: "#47b36d", secondary: "#B3A347" },
  WORMS: { name: "WORMS", primary: "#FFBADA", secondary: "#AEBD5C" },
  ANDROGYNOUS: { name: "ANDROGYNOUS", primary: "#b3af47", secondary: "#7947B3" },
  MUD: { name: "MUD", primary: "#B58657", secondary: "#86A3BD" },
  BASIC: { name: "BASIC", primary: "#D6BBA5", secondary: "#BDACA4" }, 
  SPAWN: { name: "SPAWN", primary: "#b34747", secondary: "#1F1F1F" },
  PANTHERESS: { name: "PANTHERESS", primary: "#F598C6", secondary: "#FFBDCF" },
  JM: { name: "JM", primary: "#8d47b3", secondary: "#C369B6" },
  EVA: { name: "EVA", primary: "#41bb42", secondary: "#765899" },
  DAWN: { name: "DAWN", primary: "#4768b3", secondary: "#9E9BCC" },
  URSULA: { name: "URSULA", primary: "#C75858", secondary: "#E0B3AD" },
  INVINCIBLE: { name: "INVINCIBLE", primary: "#ffe556", secondary: "#00bcf0" },
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
// Configuration des effets aléatoires du jeu.
export const GLITCH_CONFIG = {
  swapProb: 0.02,
  reverseProb: 0.02,
  triggerSwap: false,
  triggerReverse: false,
};

// Réponses affichées lorsqu'un fichier propre est ouvert.
export const CLEAN_REPLIES = [
  "Non, pas là...",
  "Rien ici.",
  "Fichier propre.",
  "Fausse piste.",
  "Trop évident.",
  "Nan. Cherche encore.",
  "Haha. Non.",
  "Propre. Trop propre.",
  "Noms bizarres uniquement.",
  "Perte de temps.",
  "Je te regarde...",
  "Vide.",
  "Erreur 404 talent.",
  "Rien d'utile.",
  "Mauvaise pioche.",
  "0 octet d'intérêt.",
  "Perdu ?",
  "Essaye l'autre.",
  "Coup pour rien.",
];

// Réponses affichées lorsqu'un dossier est ouvert.
export const DIR_REPLIES = [
  "Intéressant... regarde là.",
  "Peut-être ici.",
  "Continue de chercher.",
  "Ce dossier... fouille-le.",
  "Chaud, chaud... Froid.",
  "Ouvre. Pour voir.",
  "C'est profond, non ?",
  "Tu t'enfonces.",
  "La suite est là.",
  "Regarde derrière toi.",
  "Vide. Ou pas.",
  "Curieux, n'est-ce pas ?",
  "Fouille encore.",
  "Rien... pour l'instant.",
  "C'est un labyrinthe.",
  "Perdu dans les dossiers ?",
  "C'est par ici.",
  "Tu touches au but.",
  "C'est sombre là-dedans.",
  "Mauvais chemin.",
  "Fais demi-tour.",
  "Cache-cache.",
  "Tu as peur ?",
  "C'est verrouillé ?",
  "Pas par là.",
];

// Les validateurs sont volontairement simples : ce mini-jeu vérifie des corrections
// plausibles, il ne remplace pas un véritable analyseur de code.
function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

export const CORRUPTED_FILES = {
  "ghost_var.js": {
    name: "ghost_var.js",
    code: `// Corrigez la déclaration de variable
function saluer(nom) {
  message = "Accès autorisé, " + nom;
  return message;
}`,
    reply: "Variable globale non déclarée. Fuite mémoire détectée.",
    solution: "Variable déclarée. Fuite colmatée.",
    validate: (code) => {
      const source = stripComments(code);
      return (
        /\b(?:let|const|var)\s+message\s*=/.test(source) &&
        /return\s+message\s*;/.test(source)
      );
    },
  },

  "inf_loop.sh": {
    name: "inf_loop.sh",
    code: `// Boucle potentiellement infinie : modifiez n ou ajoutez une sortie.
function bouboucle(n) {
  while (n == 1) {
    console.log(n);
  }
}`,
    reply: "Attention, boucle infinie ! Le CPU va fondre.",
    solution: "Boucle stabilisée. Température CPU normale.",
    validate: (code) => {
      const source = stripComments(code);
      return (
        /\bbreak\s*;?/.test(source) ||
        /\bn\s*(?:\+\+|--)/.test(source) ||
        /\bn\s*(?:\+=|-=)\s*\d+/.test(source) ||
        /\bn\s*=\s*(?:0|n\s*[+-]\s*\d+)/.test(source)
      );
    },
  },

  "scope_err.sys": {
    name: "scope_err.sys",
    code: `// Problème de portée (scope)
function scope() {
  let x = 5;
}
console.log(x);`,
    reply: "Erreur de portée (scope). La variable x est inaccessible ici.",
    solution: "Portée corrigée. L'accès mémoire est rétabli.",
    validate: (code) => {
      const source = stripComments(code);
      const functionMatch = source.match(
        /function\s+scope\s*\(\s*\)\s*\{([\s\S]*?)\}/,
      );
      const functionBody = functionMatch?.[1] ?? "";
      const declarationInside = /\blet\s+x\s*=\s*5\s*;/.test(functionBody);
      const logInside = /console\s*\.\s*log\s*\(\s*x\s*\)\s*;/.test(functionBody);

      // Solution 1 : déclarer x et l'utiliser dans la même fonction.
      if (declarationInside && logInside) return true;

      // Solution 2 : déclarer x à l'extérieur de la fonction.
      const declarationIndex = source.search(/\b(?:let|const|var)\s+x\s*=\s*5\s*;/);
      const functionIndex = source.search(/function\s+scope\s*\(/);
      const logIndex = source.search(/console\s*\.\s*log\s*\(\s*x\s*\)\s*;/);

      return (
        declarationIndex >= 0 &&
        functionIndex >= 0 &&
        declarationIndex < functionIndex &&
        logIndex >= 0
      );
    },
  },

  "typo_log.bin": {
    name: "typo_log.bin",
    code: `// Il manque une lettre
function unPtitTrucEnMoins(x) {
  console.lg(x);
}`,
    reply: "Erreur de syntaxe. Une fonction système est mal orthographiée.",
    solution: "Syntaxe corrigée. Affichage système opérationnel.",
    validate: (code) => /console\s*\.\s*log\s*\(\s*x\s*\)/.test(stripComments(code)),
  },
};

// Tous les fichiers corrompus sont présents dans l'arborescence.
export const FILE_SYSTEM = [
  {
    type: "dir",
    name: "bin",
    children: [
      { type: "file", name: "ls" },
      { type: "file", name: "chmod" },
      { type: "file", name: "typo_log.bin", corrupted: true, fileId: "typo_log.bin" },
      { type: "file", name: "inf_loop.sh", corrupted: true, fileId: "inf_loop.sh" },
    ],
  },
  {
    type: "dir",
    name: "etc",
    children: [
      { type: "file", name: "hosts" },
      { type: "file", name: "passwd" },
      { type: "file", name: "network" },
      { type: "file", name: "ghost_var.js", corrupted: true, fileId: "ghost_var.js" },
    ],
  },
  {
    type: "dir",
    name: "lib",
    children: [
      { type: "file", name: "libc.so" },
      { type: "file", name: "libm.so" },
      { type: "file", name: "scope_err.sys", corrupted: true, fileId: "scope_err.sys" },
    ],
  },
  {
    type: "dir",
    name: "home",
    children: [{ type: "file", name: "operator.gov" }],
  },
  {
    type: "dir",
    name: "tmp",
    children: [
      { type: "file", name: "session.lock" },
      { type: "file", name: "cache" },
    ],
  },
];
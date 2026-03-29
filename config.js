// ── CONFIG ─────────────────────────────────────────────────────────────

// EXPOSÉ POUR TA DÉMO : Ouvre la console de ton navigateur et tape :
// GLITCH_CONFIG.triggerSwap = true;    (pour forcer l'échange de 2 fichiers au prochain clic)
// GLITCH_CONFIG.triggerReverse = true; (pour forcer l'inversion du nom au prochain clic)
window.GLITCH_CONFIG = {
  swapProb: 0.02, // 2% de chance que ça arrive naturellement
  reverseProb: 0.02, // 2% de chance que ça arrive naturellement
  triggerSwap: false,
  triggerReverse: false,
};

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

export const CORRUPTED_FILES = {
  "boucleprob.dhd": {
    "boucleprob.dhd": {
      name: "boucleprob.dhd",
      code: `// Corrigez la condition d'arrêt
function compter(n) {
  let i = 0;
  while (i = n) {
    console.log(i);
    i++;
  }
}`,
      reply: "La condition est cassée. Tu vois le bug ?",
      solution: "Boucle corrigée. Buffer libéré.",
      validate: (c) => c.includes("i < n") || c.includes("i<n"),
    },
    "c0r3dump.xvz": {
      name: "c0r3dump.xvz",
      code: `// Ajoutez le cas de base manquant
function factorielle(n) {
  // cas de base manquant !
  return n * factorielle(n - 1);
}`,
      reply: "Stack overflow garanti. Cas de base manquant.",
      solution: "Récursion stabilisée. Stack overflow évité.",
      validate: (c) => /n\s*[=<]=?\s*[01]/.test(c) && c.includes("return"),
    },
    "net_ghost.!!x": {
      name: "net_ghost.!!x",
      code: `// Corrigez la déclaration de variable
function saluer(nom) {
  message = "Accès autorisé, " + nom;
  return message;
}`,
      reply: "Variable globale non déclarée. Fuite mémoire.",
      solution: "Variable déclarée. Fuite colmatée.",
      validate: (c) => /\b(let|const|var)\s+message/.test(c),
    },
    "sys_krnl.0x9f": {
      name: "sys_krnl.0x9f",
      code: `// Protégez contre la division par zéro

function diviser(a, b) {
  return a / b;
}`,
      reply: "Division par zéro possible. Protège ça.",
      solution: "Division sécurisée. Noyau stabilisé.",
      validate: (c) => /b\s*[!=]=+\s*0/.test(c) && c.includes("return"),
    },
    "stack_overflow.lua": {
      name: "stack_overflow.lua",
      code: `-- Ajoutez un return pour éviter le débordement
-- Solution : Cas de base ajouté, stack stabilisé.
function recurse(n)
  return recurse(n - 1)
end`,
      reply: "Pas de cas de base, stack overflow imminent.",
      solution: "Cas de base ajouté, stack stabilisé.",
      validate: (c) => c.includes("if n <= 1") && c.includes("return"),
    },
    "null_ref.obj": {
      name: "null_ref.obj",
      code: `// Vérifiez que l'objet n'est pas null
// Solution : Vérification ajoutée pour null.
function getValue(obj) {
  return obj.value;
}`,
      reply: "Accès possible à null. Crash probable.",
      solution: "Vérification ajoutée pour null.",
      validate: (c) => c.includes("if(obj") && c.includes("return obj.value"),
    },
  },
};

export const FILE_SYSTEM = [
  {
    type: "dir",
    name: "bin",
    children: [
      { type: "file", name: "ls" },
      { type: "file", name: "chmod" },
      {
        type: "file",
        name: "c0r3dump.xvz",
        corrupted: true,
        fileId: "c0r3dump.xvz",
      },
    ],
  },
  {
    type: "dir",
    name: "etc",
    children: [
      { type: "file", name: "hosts" },
      { type: "file", name: "passwd" },
      {
        type: "file",
        name: "net_ghost.!!x",
        corrupted: true,
        fileId: "net_ghost.!!x",
      },
      {
        type: "dir",
        name: "network",
        children: [
          { type: "file", name: "interfaces" },
          { type: "file", name: "resolv.conf" },
        ],
      },
    ],
  },
  {
    type: "dir",
    name: "lib",
    children: [
      { type: "file", name: "libc.so" },
      { type: "file", name: "libm.so" },
      {
        type: "file",
        name: "sys_krnl.0x9f",
        corrupted: true,
        fileId: "null_ref.obj",
      },
      {
        type: "file",
        name: "stack_overflow.lua",
        corrupted: true,
        fileId: "stack_overflow.lua",
      },
      {
        type: "file",
        name: "null_ref.obj",
        corrupted: true,
        fileId: "null_ref.obj",
      },
    ],
  },
  {
    type: "dir",
    name: "home",
    children: [
      {
        type: "dir",
        name: "operator",
        children: [
          { type: "file", name: ".bashrc" },
          {
            type: "file",
            name: "boucleprob.dhd",
            corrupted: true,
            fileId: "boucleprob.dhd",
          },
        ],
      },
      {
        type: "file",
        name: "stack_overflow.lua",
        corrupted: true,
        fileId: "stack_overflow.lua",
      },
    ],
  },
  {
    type: "dir",
    name: "tmp",
    children: [
      { type: "file", name: "session.lock" },
      { type: "file", name: "cache" },
      {
        type: "file",
        name: "sys_krnl.0x9f",
        corrupted: true,
        fileId: "sys_krnl.0x9f",
      },
    ],
  },
];

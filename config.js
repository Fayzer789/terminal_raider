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
  "Niet. Continue.",
  "Noms bizarres uniquement.",
  "Perte de temps.",
  "Je te regarde...",
  "Vide.",
  "Erreur 404 talent.",
  "Essaye encore, débutant.",
  "Même pas drôle.",
  "Rien d'utile.",
  "Passe ton tour.",
  "Mauvaise pioche.",
  "0 octet d'intérêt.",
  "Circulez.",
  "Pas ce soir.",
  "T'es loin du but.",
  "C'est tout ?",
  "Fichier système sain.",
  "Rien à voir.",
  "Perdu ?",
  "Refroidissement...",
  "Toujours rien.",
  "Essaye l'autre.",
  "Coup pour rien.",
  "Pas de chance.",
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
  "Encore un étage.",
  "Tu brûles.",
  "Fouille encore.",
  "Rien... pour l'instant.",
  "C'est un labyrinthe.",
  "Perdu dans les dossiers ?",
  "Regarde plus bas.",
  "C'est par ici.",
  "Tu touches au but.",
  "C'est sombre là-dedans.",
  "Mauvais chemin.",
  "Fais demi-tour.",
  "Tout au fond.",
  "Cache-cache.",
  "Tu as peur ?",
  "Rien de spécial.",
  "Cherche le détail.",
  "Encore un effort.",
  "C'est verrouillé ?",
  "Pas par là.",
];

export const CORRUPTED_FILES = {
  "boucleprob.dhd": {
    name: "boucleprob.dhd",
    code: `// Corrigez la condition d'arrêt\n\nfunction compter(n) {\n  let i = 0;\n  while (i = n) {   // <- bug ici\n    console.log(i);\n    i++;\n  }\n}`,
    reply: "La condition est cassée. Tu vois le bug ?",
    solution: "Boucle corrigée. Buffer libéré.",
    validate: (c) => c.includes("i < n") || c.includes("i<n"),
  },
  "c0r3dump.xvz": {
    name: "c0r3dump.xvz",
    code: `// Ajoutez le cas de base manquant\n\nfunction factorielle(n) {\n  // cas de base manquant !\n  return n * factorielle(n - 1);\n}`,
    reply: "Stack overflow garanti. Cas de base manquant.",
    solution: "Récursion stabilisée. Stack overflow évité.",
    validate: (c) => /n\s*[=<]=?\s*[01]/.test(c) && c.includes("return"),
  },
  "net_ghost.!!x": {
    name: "net_ghost.!!x",
    code: `// Corrigez la déclaration de variable\n\nfunction saluer(nom) {\n  message = "Accès autorisé, " + nom;\n  return message;\n}`,
    reply: "Variable globale non déclarée. Fuite mémoire.",
    solution: "Variable déclarée. Fuite colmatée.",
    validate: (c) => /\b(let|const|var)\s+message/.test(c),
  },
  "sys_krnl.0x9f": {
    name: "sys_krnl.0x9f",
    code: `// Protégez contre la division par zéro\n\nfunction diviser(a, b) {\n  return a / b;\n}`,
    reply: "Division par zéro possible. Protège ça.",
    solution: "Division sécurisée. Noyau stabilisé.",
    validate: (c) => /b\s*[!=]=+\s*0/.test(c) && c.includes("return"),
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
        fileId: "sys_krnl.0x9f",
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
    ],
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

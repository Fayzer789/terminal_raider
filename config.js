window.GLITCH_CONFIG = {
  swapProb: 0.02,
  reverseProb: 0.02,
  triggerSwap: false,
  triggerReverse: false,
};

// ── CONFIG ─────────────────────────────────────────────────────────────

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
  "ghost_var.js": {
    name: "ghost_var.js",
    code: `// Corrigez la déclaration de variable\nfunction saluer(nom) {\n  message = "Accès autorisé, " + nom;\n  return message;\n}`,
    reply: "Variable globale non déclarée. Fuite mémoire détectée.",
    solution: "Variable déclarée. Fuite colmatée.",
    // Validation: on cherche "let message", "const message" ou "var message"
    validate: (c) => /\b(let|const|var)\s+message/.test(c),
  },
  "inf_loop.sh": {
    name: "inf_loop.sh",
    code: `// boucle infinie!!!!\nfunction bouboucle(n) {\n  while(n == 1) {\n    console.log(n);\n  }\n}`,
    reply: "Attention, boucle infinie ! Le CPU va fondre.",
    solution: "Boucle stabilisée. Température CPU normale.",
    // Validation: on accepte si le joueur incrémente (n++), décrémente (n--), ajoute un break, ou modifie n (n =) // ERREUR !! mauvaise validation...
    validate: (c) =>
      c.includes("n++") ||
      c.includes("n--") ||
      c.includes("break") ||
      /n\s*=/.test(c),
  },
  "scope_err.sys": {
    name: "scope_err.sys",
    code: `// probleme de scope\nfunction scope() {\n  let x = 5;\n}\nconsole.log(x);`,
    reply: "Erreur de portée (scope). La variable x est inaccessible ici.",
    solution: "Portée corrigée. L'accès mémoire est rétabli.",
    // Validation: le joueur doit soit placer le console.log avant l'accolade fermante, soit sortir le "let x" de la fonction.
    validate: (c) =>
      /let\s+x\s*=\s*5;\s*console\.log\(x\);\s*\}/.test(c) ||
      /let\s+x\s*=\s*5;\s*function/.test(c) ||
      c.includes("return x"),
  },
  "typo_log.bin": {
    name: "typo_log.bin",
    code: `//il manque un truc\nfunction unPtitTrucEnMoins(x) {\n  console.lg(x);\n}`,
    reply: "Erreur de syntaxe. Une fonction système est mal orthographiée.",
    solution: "Syntaxe corrigée. Affichage système opérationnel.",
    // Validation: on vérifie juste que le "o" de "log" a été ajouté
    validate: (c) => c.includes("console.log(x)"),
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
        name: "typo_log.bin",
        corrupted: true,
        fileId: "typo_log.bin",
      },
    ],
  },
  {
    type: "dir",
    name: "etc",
    children: [
      { type: "file", name: "hosts" },
      { type: "file", name: "passwd" },
      { type: "file", name: "network" },
      {
        type: "file",
        name: "ghost_var.js",
        corrupted: true,
        fileId: "ghost_var.js",
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
        name: "scope_err.sys",
        corrupted: true,
        fileId: "scope_err.sys",
      },
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

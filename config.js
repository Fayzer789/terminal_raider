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

export const CLEAN_REPLIES_EN = [
  "Not here...",
  "Nothing here.",
  "Clean file.",
  "False lead.",
  "Too obvious.",
  "Nope. Keep looking.",
  "Haha. No.",
  "Clean. Too clean.",
  "Only weird names.",
  "Waste of time.",
  "I'm watching you...",
  "Empty.",
  "Error 404: talent not found.",
  "Nothing useful.",
  "Wrong file.",
  "0 bytes of interest.",
  "Lost?",
  "Try the other one.",
  "Nothing to see here.",
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

export const DIR_REPLIES_EN = [
  "Interesting... look there.",
  "Maybe this way.",
  "Keep searching.",
  "This folder... dig deeper.",
  "Getting warmer... colder.",
  "Open it. See for yourself.",
  "It goes deep, doesn't it?",
  "You're going deeper.",
  "The path continues.",
  "Look behind you.",
  "Empty. Or is it?",
  "Curious, isn't it?",
  "Keep digging.",
  "Nothing... for now.",
  "It's a maze.",
  "Lost in the folders?",
  "This way.",
  "You're getting close.",
  "It's dark in here.",
  "Wrong way.",
  "Turn back.",
  "Hide and seek.",
  "Are you scared?",
  "Locked?",
  "Not this way.",
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
    code: `# Ajoutez la variable message avant return
def saluer(nom):
    return message`,
    codeEn: `# Add the message variable before return
  def greet(name):
    return message`,
    reply: "La variable message doit être créée avant de l'utiliser.",
    replyEn: "The message variable must be created before it is used.",
    solution: "Variable Python corrigée.",
    solutionEn: "Python variable fixed.",
    validate: (code) => {
      const source = stripComments(code);
      return (
        /\bmessage\s*=/.test(source) &&
        /\breturn\s+message\b/.test(source)
      );
    },
  },

  "inf_loop.sh": {
    name: "inf_loop.sh",
    code: `# Ajoutez une ligne pour faire avancer la boucle
n = 0
while n < 3:
    print(n)`,
    codeEn: `# Add a line to move the loop forward
  n = 0
  while n < 3:
    print(n)`,
    reply: "Attention, cette boucle Python ne progresse pas.",
    replyEn: "Warning: this Python loop never moves forward.",
    solution: "Boucle Python corrigée.",
    solutionEn: "Python loop fixed.",
    validate: (code) => {
      const source = stripComments(code);
      return /\bn\s*(?:\+=|-=)\s*\d+/.test(source);
    },
  },

  "scope_err.sys": {
    name: "scope_err.sys",
    code: `# Placez print dans la fonction
def afficher_nombre():
    nombre = 5
print(nombre)`,
    codeEn: `# Put print inside the function
  def show_number():
    number = 5
print(number)`,
    reply: "Erreur de portée : nombre n'est pas accessible ici.",
    replyEn: "Scope error: number is not accessible here.",
    solution: "Portée Python corrigée.",
    solutionEn: "Python scope fixed.",
    validate: (code) => {
      const source = stripComments(code);
      return /def\s+(?:afficher_nombre|show_number)\s*\(\s*\)\s*:\s*\n(?:[ \t]+[^\n]*\n)*[ \t]+print\s*\(\s*(?:nombre|number)\s*\)/.test(source);
    },
  },

  "typo_log.bin": {
    name: "typo_log.bin",
    code: `# Corrigez le nom de la fonction
def afficher(message):
    print(messagee)`,
    codeEn: `# Fix the variable name
  def show(message):
    print(messagee)`,
    reply: "Erreur Python : le nom de la variable est mal écrit.",
    replyEn: "Python error: the variable name is misspelled.",
    solution: "Syntaxe Python corrigée.",
    solutionEn: "Python syntax fixed.",
    validate: (code) => /\bprint\s*\(\s*message\s*\)/.test(stripComments(code)),
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
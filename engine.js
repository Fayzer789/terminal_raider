import {
  CLEAN_REPLIES,
  CLEAN_REPLIES_EN,
  DIR_REPLIES,
  DIR_REPLIES_EN,
  CORRUPTED_FILES,
  FILE_SYSTEM,
  GLITCH_CONFIG,
} from "./config.js";

// ── AUDIO ───────────────────────────────────────────────────────────────
const SOUND_PATH = "./sounds/";
const VOLUME = {
  background: 0.12,
  typing: 0.045,
  navigation: 0.075,
  hover: 0.04,
  normal: 0.12,
  error: 0.10,
  success: 0.12,
  bug: 0.10,
  buzz: 0.09,
  power: 0.12,
};

let audioUnlocked = false;
const keySounds = Array.from({ length: 10 }, (_, index) => {
  const sound = new Audio(`${SOUND_PATH}k${index + 1}.ogg`);
  sound.preload = "auto";
  return sound;
});
const sndEnter = new Audio(`${SOUND_PATH}kenter.ogg`);
const sndBad = new Audio(`${SOUND_PATH}passbad.ogg`);
const sndGood = new Audio(`${SOUND_PATH}passgood.ogg`);
const sndPowerOn = new Audio(`${SOUND_PATH}poweron.ogg`);
const sndPowerOff = new Audio(`${SOUND_PATH}poweroff.ogg`);
const sndBackground = new Audio(`${SOUND_PATH}background_sound.mp3`);
const sndBug = new Audio(`${SOUND_PATH}bugEffect.mp3`);
const sndBuzz = new Audio(`${SOUND_PATH}buzzSound.mp3`);

sndBackground.loop = true;
sndBackground.volume = VOLUME.background;
sndBackground.preload = "auto";
sndBug.preload = "auto";
sndBuzz.preload = "auto";

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  sndBackground.currentTime = 0;
  sndBackground.volume = VOLUME.background;
  sndBackground.play().catch(() => {});
}

function playSound(audio, volume = VOLUME.normal) {
  if (!audioUnlocked || !audio) return;

  // Un clone permet de superposer brièvement plusieurs effets sans couper l'ancien.
  const sound = audio.cloneNode(true);
  sound.volume = Math.max(0, Math.min(1, volume));
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function playKey(volume = VOLUME.typing) {
  const sound = keySounds[Math.floor(Math.random() * keySounds.length)];
  playSound(sound, volume);
}

function playNav() {
  const sound = keySounds[Math.floor(Math.random() * 3)];
  playSound(sound, VOLUME.navigation);
}

function playLanguageKey() {
  const sound = keySounds[0].cloneNode(true);
  sound.volume = VOLUME.navigation;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function playHover() {
  playSound(keySounds[0], VOLUME.hover);
}

// ── DOM ─────────────────────────────────────────────────────────────────
const hackerLine = document.getElementById("hacker-line");
const screenEl = document.getElementById("screen");
const hoverName = document.getElementById("hover-name");
const integrityEl = document.getElementById("integrity-bar");
const breadcrumb = document.getElementById("breadcrumb");
const crtScreen = document.querySelector(".crt-screen");
const powerButton = document.getElementById("power-btn");
const startSub = document.getElementById("start-sub");
const startHint = document.getElementById("start-hint");
const headerTitle = document.getElementById("header-title");
const languageFrButton = document.getElementById("language-fr");
const languageEnButton = document.getElementById("language-en");

if (!hackerLine || !screenEl || !hoverName || !integrityEl || !breadcrumb || !crtScreen || !powerButton) {
  throw new Error("ROBCO TERMLINK : un ou plusieurs éléments HTML requis sont manquants.");
}

// ── ÉTAT DU JEU ─────────────────────────────────────────────────────────
let navStack = [];
let gameFileSystem = structuredClone(FILE_SYSTEM);
let curNodes = gameFileSystem;
let integrity = 100;
let selectedIdx = 0;
let gameOver = false;
let gameWon = false;
let started = false;
let typingTimer = null;
let sessionID = 0;
let introRunning = false;
let language = "fr";
const fixedFiles = Object.create(null);

const TYPING_SPEED = 45;
const INTRO_DELAY = 3000;
const ERROR_PENALTY = 25;
const REPAIR_REWARD = 15;

const UI_TEXT = {
  fr: {
    header: "ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL",
    startSub: "Choisissez votre langue",
    startHint: "Appuyez sur POWER pour démarrer",
    integrity: "INTÉGRITÉ",
    back: "[ retour ]",
    reverseError: "ERREUR : index de fichier corrompu...",
    swapError: "ERREUR : décalage du secteur mémoire...",
    missingFile: "ERREUR : fichier de correction introuvable.",
    correctionRequired: "CORRECTION REQUISE",
    execute: "[ EXÉCUTER ]",
    reset: "[ RESET ]",
    return: "[ RETOUR ]",
    valid: "✓ VALIDÉ",
    invalid: "✗ INVALIDE",
    retry: "Correction incorrecte. Réessaie.",
    introTitle: "// INTRUSION TERMINAL_RAIDER //",
    intro: [
      "Un nouvel administrateur ? Pitoyable.",
      "Tes systèmes de sécurité sont obsolètes.",
      "Laisse-moi faire un peu de ménage dans tes fichiers...",
    ],
    compromised: "SYSTÈME COMPROMIS. VEUILLEZ RÉPARER LES FICHIERS.",
    gameOverTitle: "// SYSTÈME COMPROMIS //",
    gameOver: [
      "rm -rf /* en cours...",
      "Tu étais trop lent.",
      "Tous tes fichiers appartiennent à GHOST_CORE maintenant.",
      "[ Appuie sur POWER pour recommencer ]",
    ],
    reboot: ["REBOOTING TERMLINK...", "CLEARING MEMORY BANKS...", "REINITIALIZING..."],
    victorySubtitle: "TERMLINK // PROTOCOLE DE RÉCUPÉRATION",
    progressStart: "INITIALISATION DU PROTOCOLE...",
    progress: "RÉPARATION DU SYSTÈME",
    progressDone: "RÉCUPÉRATION TERMINÉE : 100 %",
    restored: "// SYSTÈME RESTAURÉ //",
    restart: "[ APPUIE SUR POWER POUR RECOMMENCER ]",
    victoryLogs: [
      "INITIALISATION DU PROTOCOLE ROBCO...",
      "AUTHENTIFICATION OPÉRATEUR ........ OK",
      "ISOLATION DES CONNEXIONS EXTERNES .. OK",
      "ANALYSE DE LA MÉMOIRE SYSTÈME ...... TERMINÉE",
      "RECHERCHE DES ANOMALIES ............ TERMINÉE",
      "PATCH DE ghost_var.js .............. OK",
      "CORRECTION DE inf_loop.sh .......... OK",
      "RÉPARATION DE scope_err.sys ........ OK",
      "RECONSTRUCTION DE typo_log.bin ..... OK",
      "VÉRIFICATION DES SOMMES DE CONTRÔLE . PASS",
      "PURGE DES TRACES GHOST_CORE ......... TERMINÉE",
      "RESTAURATION DES PERMISSIONS ........ OK",
      "RECONSTRUCTION DE L'INDEX ........... OK",
      "TEST D'INTÉGRITÉ FINAL .............. PASS",
      "VÉRIFICATION DES SECTEURS ........... 4/4",
      "STATUT DE SÉCURITÉ ................. NOMINAL",
      "TOUS LES SECTEURS SONT SÉCURISÉS.",
    ],
  },
  en: {
    header: "ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL",
    startSub: "Choose your language",
    startHint: "Press POWER to start",
    integrity: "INTEGRITY",
    back: "[ back ]",
    reverseError: "ERROR: corrupted file index...",
    swapError: "ERROR: memory sector shift...",
    missingFile: "ERROR: repair file not found.",
    correctionRequired: "REPAIR REQUIRED",
    execute: "[ EXECUTE ]",
    reset: "[ RESET ]",
    return: "[ BACK ]",
    valid: "✓ VALID",
    invalid: "✗ INVALID",
    retry: "Incorrect fix. Try again.",
    introTitle: "// TERMINAL_RAIDER INTRUSION //",
    intro: [
      "A new administrator? Pathetic.",
      "Your security systems are obsolete.",
      "Let me clean up your files...",
    ],
    compromised: "SYSTEM COMPROMISED. PLEASE REPAIR THE FILES.",
    gameOverTitle: "// SYSTEM COMPROMISED //",
    gameOver: [
      "rm -rf /* in progress...",
      "You were too slow.",
      "All your files belong to GHOST_CORE now.",
      "[ Press POWER to restart ]",
    ],
    reboot: ["REBOOTING TERMLINK...", "CLEARING MEMORY BANKS...", "REINITIALIZING..."],
    victorySubtitle: "TERMLINK // RECOVERY PROTOCOL",
    progressStart: "INITIALIZING PROTOCOL...",
    progress: "SYSTEM RECOVERY",
    progressDone: "RECOVERY COMPLETE: 100%",
    restored: "// SYSTEM RESTORED //",
    restart: "[ PRESS POWER TO RESTART ]",
    victoryLogs: [
      "INITIALIZING ROBCO PROTOCOL...",
      "OPERATOR AUTHENTICATION ........ OK",
      "ISOLATING EXTERNAL CONNECTIONS .. OK",
      "ANALYZING SYSTEM MEMORY ......... COMPLETE",
      "SEARCHING FOR ANOMALIES ......... COMPLETE",
      "PATCHING ghost_var.js ........... OK",
      "FIXING inf_loop.sh .............. OK",
      "REPAIRING scope_err.sys ......... OK",
      "REBUILDING typo_log.bin ......... OK",
      "VERIFYING CHECKSUMS ............. PASS",
      "PURGING GHOST_CORE TRACES ....... COMPLETE",
      "RESTORING PERMISSIONS ........... OK",
      "REBUILDING INDEX ................ OK",
      "FINAL INTEGRITY TEST ............ PASS",
      "VERIFYING SECTORS ............... 4/4",
      "SECURITY STATUS ................. NOMINAL",
      "ALL SECTORS SECURED.",
    ],
  },
};

function text(key) {
  return UI_TEXT[language][key];
}

function localizedFileText(file, key) {
  return language === "en" ? file[`${key}En`] ?? file[key] : file[key];
}

function applyLanguage() {
  document.documentElement.lang = language;
  headerTitle.textContent = text("header");
  startSub.textContent = text("startSub");
  startHint.textContent = text("startHint");
  languageFrButton.classList.toggle("selected", language === "fr");
  languageEnButton.classList.toggle("selected", language === "en");
}

// ── TEXTE ──────────────────────────────────────────────────────────────
function typeText(text) {
  if (typingTimer) clearTimeout(typingTimer);
  hackerLine.textContent = "";

  let index = 0;
  const cursor = document.createElement("span");
  cursor.className = "cursor";

  function tick() {
    hackerLine.textContent = text.slice(0, index);
    hackerLine.appendChild(cursor);

    if (index < text.length) {
      if (text[index] !== " ") playKey();
      index += 1;
      typingTimer = setTimeout(tick, TYPING_SPEED);
    } else {
      typingTimer = null;
    }
  }

  tick();
}

function cancelTyping() {
  if (typingTimer) clearTimeout(typingTimer);
  typingTimer = null;
}

// ── INTÉGRITÉ ET PROGRESSION ───────────────────────────────────────────
function renderIntegrity() {
  const barCount = 10;
  const safeIntegrity = Math.max(0, Math.min(100, integrity));
  const filledBars = Math.round((safeIntegrity / 100) * barCount);
  integrityEl.textContent = `${text("integrity")} [${"█".repeat(filledBars)}${"░".repeat(barCount - filledBars)}] ${safeIntegrity}%`;
}

function fixedCount() {
  return Object.values(fixedFiles).filter(Boolean).length;
}

function checkAllFixed() {
  return fixedCount() >= Object.keys(CORRUPTED_FILES).length;
}

function changeIntegrity(delta) {
  if (gameOver || gameWon) return;

  integrity = Math.max(0, Math.min(100, integrity + delta));
  renderIntegrity();

  // Atteindre 100 % ne suffit pas à gagner : il faut réparer tous les fichiers.
  if (integrity <= 0) triggerGameOver();
}

// ── NAVIGATION ET CHEMIN ───────────────────────────────────────────────
function buildPath() {
  if (navStack.length === 0) return "/";
  return `/${navStack.map((entry) => entry.dirName || "?").join("/")}/`;
}

function glitch() {
  if (!crtScreen) return;
  crtScreen.classList.add("glitching");
  const currentSession = sessionID;
  setTimeout(() => {
    if (sessionID === currentSession) crtScreen.classList.remove("glitching");
  }, 900);
}

function renderList() {
  screenEl.innerHTML = "";
  const totalItems = curNodes.length + (navStack.length > 0 ? 1 : 0);
  selectedIdx = totalItems === 0 ? 0 : Math.min(selectedIdx, totalItems - 1);
  breadcrumb.textContent = buildPath();

  const list = document.createElement("ul");
  list.id = "file-list";

  curNodes.forEach((node, index) => {
    const item = document.createElement("li");
    item.textContent = `> ${node.type === "dir" ? `${node.name}/` : node.name}`;

    if (node.corrupted && !fixedFiles[node.fileId]) item.classList.add("corrupted");
    if (index === selectedIdx) item.classList.add("selected");

    item.addEventListener("mouseenter", () => {
      hoverName.textContent = node.type === "dir" ? `${node.name}/` : node.name;
      selectedIdx = index;
      refreshSelected();
      playHover();
    });
    item.addEventListener("mouseleave", () => {
      hoverName.textContent = "";
    });
    item.addEventListener("click", () => {
      unlockAudio();
      activateNode(node, index);
    });
    list.appendChild(item);
  });

  if (navStack.length > 0) {
    const backIndex = curNodes.length;
    const backItem = document.createElement("li");
    backItem.textContent = "> ../";
    backItem.className = "back";
    if (selectedIdx === backIndex) backItem.classList.add("selected");

    backItem.addEventListener("mouseenter", () => {
      hoverName.textContent = text("back");
      selectedIdx = backIndex;
      refreshSelected();
      playHover();
    });
    backItem.addEventListener("mouseleave", () => {
      hoverName.textContent = "";
    });
    backItem.addEventListener("click", () => {
      unlockAudio();
      goBack();
    });
    list.appendChild(backItem);
  }

  screenEl.appendChild(list);
}

function refreshSelected() {
  screenEl.querySelectorAll("#file-list li").forEach((item, index) => {
    item.classList.toggle("selected", index === selectedIdx);
  });
}

function scrollSelectedIntoView() {
  const items = screenEl.querySelectorAll("#file-list li");
  items[selectedIdx]?.scrollIntoView({ block: "nearest" });
}

function updateHoverFromSelected() {
  if (selectedIdx < curNodes.length) {
    const node = curNodes[selectedIdx];
    hoverName.textContent = node.type === "dir" ? `${node.name}/` : node.name;
  } else {
    hoverName.textContent = text("back");
  }
}

function activateNode(node, index) {
  if (gameOver || gameWon || introRunning) return;

  const shouldReverse = GLITCH_CONFIG.triggerReverse || Math.random() < GLITCH_CONFIG.reverseProb;
  if (shouldReverse) {
    GLITCH_CONFIG.triggerReverse = false;
    node.name = node.name.split("").reverse().join("");
    renderList();
    glitch();
    playSound(sndBug, VOLUME.bug);
    typeText(text("reverseError"));
    return;
  }

  const shouldSwap = GLITCH_CONFIG.triggerSwap || Math.random() < GLITCH_CONFIG.swapProb;
  if (shouldSwap && curNodes.length > 1) {
    GLITCH_CONFIG.triggerSwap = false;
    let swapIndex = index;
    while (swapIndex === index) swapIndex = Math.floor(Math.random() * curNodes.length);
    [curNodes[index], curNodes[swapIndex]] = [curNodes[swapIndex], curNodes[index]];
    renderList();
    glitch();
    playSound(sndBug, VOLUME.bug);
    typeText(text("swapError"));
    return;
  }
  GLITCH_CONFIG.triggerSwap = false;

  if (node.type === "dir") {
    playSound(sndEnter, VOLUME.normal);
    navStack.push({ nodes: curNodes, dirName: node.name });
    curNodes = node.children;
    selectedIdx = 0;
    renderList();
    typeText(pick(language === "en" ? DIR_REPLIES_EN : DIR_REPLIES));
    return;
  }

  if (node.corrupted && !fixedFiles[node.fileId]) {
    playSound(sndBuzz, VOLUME.buzz);
    openEditor(node.fileId);
    return;
  }

  playSound(sndBad, VOLUME.error);
  typeText(pick(language === "en" ? CLEAN_REPLIES_EN : CLEAN_REPLIES));
}

function goBack() {
  if (navStack.length === 0 || gameOver || gameWon || introRunning) return;
  playSound(sndEnter, VOLUME.normal);
  const previous = navStack.pop();
  curNodes = previous.nodes;
  selectedIdx = 0;
  renderList();
  typeText("...");
}

// ── ÉDITEUR DE FICHIERS ────────────────────────────────────────────────
function openEditor(fileId) {
  glitch();
  const file = CORRUPTED_FILES[fileId];
  if (!file) {
    typeText(text("missingFile"));
    return;
  }

  typeText(localizedFileText(file, "reply"));
  screenEl.innerHTML = "";
  breadcrumb.textContent = `${buildPath()}${file.name} — ${text("correctionRequired")}`;

  const view = document.createElement("div");
  view.id = "editor-view";

  const filename = document.createElement("div");
  filename.id = "editor-filename";
  filename.textContent = file.name;

  const textarea = document.createElement("textarea");
  textarea.id = "code-editor";
  textarea.spellcheck = false;
  textarea.value = localizedFileText(file, "code");

  textarea.addEventListener("keydown", (event) => {
    unlockAudio();
    if (event.key.length === 1 || event.key === "Backspace" || event.key === "Enter") {
      playKey(0.055);
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = `${textarea.value.slice(0, start)}  ${textarea.value.slice(end)}`;
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    }
  });

  const controls = document.createElement("div");
  controls.id = "editor-controls";
  const executeButton = makeButton(text("execute"));
  const resetButton = makeButton(text("reset"));
  const backButton = makeButton(text("return"));
  const status = document.createElement("span");
  status.id = "exec-status";

  executeButton.addEventListener("click", () => {
    unlockAudio();
    if (gameOver || gameWon) return;

    if (file.validate(textarea.value)) {
      playSound(sndGood, VOLUME.success);
      status.textContent = text("valid");
      status.className = "ok";
      textarea.disabled = true;
      executeButton.disabled = true;
      fixedFiles[fileId] = true;
      typeText(localizedFileText(file, "solution"));
      changeIntegrity(REPAIR_REWARD);

      if (!gameOver && checkAllFixed()) triggerWin();
    } else {
      playSound(sndBug, VOLUME.error);
      status.textContent = text("invalid");
      status.className = "err";
      typeText(text("retry"));
      changeIntegrity(-ERROR_PENALTY);
    }
  });

  resetButton.addEventListener("click", () => {
    unlockAudio();
    if (gameOver || gameWon) return;
    playSound(sndEnter, VOLUME.normal);
    textarea.disabled = false;
    executeButton.disabled = false;
    textarea.value = localizedFileText(file, "code");
    status.textContent = "";
    status.className = "";
  });

  backButton.addEventListener("click", () => {
    unlockAudio();
    if (gameOver || gameWon) return;
    playSound(sndEnter, VOLUME.normal);
    renderList();
    typeText("...");
  });

  controls.append(executeButton, resetButton, backButton, status);
  view.append(filename, textarea, controls);
  screenEl.appendChild(view);
}

function makeButton(label) {
  const button = document.createElement("button");
  button.className = "term-btn";
  button.textContent = label;
  button.addEventListener("mouseenter", playHover);
  return button;
}

// ── INTRO DU HACKER ───────────────────────────────────────────────────
function triggerHackerIntro() {
  if (introRunning || gameOver || gameWon) return;
  introRunning = true;
  const currentSession = sessionID;

  hackerLine.style.display = "none";
  breadcrumb.style.display = "none";
  screenEl.style.pointerEvents = "none";
  screenEl.innerHTML = "";
  breadcrumb.textContent = "";

  const overlay = document.createElement("div");
  overlay.id = "overlay-msg";
  const title = document.createElement("div");
  title.className = "big-msg red-alert";
  title.textContent = text("introTitle");
  const speech = document.createElement("div");
  speech.className = "hacker-speech";
  overlay.append(title, speech);
  crtScreen.appendChild(overlay);

  const dialogues = text("intro");
  let step = 0;

  function nextDialogue() {
    if (sessionID !== currentSession || !overlay.isConnected) return;

    if (step < dialogues.length) {
      glitch();
      playSound(sndBug, VOLUME.bug);
      const line = document.createElement("div");
      line.textContent = `> ${dialogues[step]}`;
      speech.appendChild(line);
      // L'introduction est désormais purement scénaristique : elle ne retire plus d'intégrité.
      step += 1;
      setTimeout(nextDialogue, 2500);
      return;
    }

    glitch();
    setTimeout(() => {
      if (sessionID !== currentSession) return;
      overlay.remove();
      introRunning = false;
      integrity = 100;
      renderIntegrity();
      gameOver = false;
      gameWon = false;

      hackerLine.style.display = "block";
      breadcrumb.style.display = "block";
      screenEl.style.pointerEvents = "auto";

      GLITCH_CONFIG.triggerReverse = true;
      GLITCH_CONFIG.triggerSwap = true;
      renderList();
      typeText(text("compromised"));
    }, 1200);
  }

  setTimeout(nextDialogue, 700);
}

// ── FIN DE PARTIE : DÉFAITE ────────────────────────────────────────────
function triggerGameOver() {
  if (gameOver || gameWon) return;
  gameOver = true;
  introRunning = false;
  cancelTyping();
  playSound(sndBad, VOLUME.error);

  const currentSession = sessionID;
  crtScreen.classList.add("glitching");
  const items = screenEl.querySelectorAll("li, div, textarea, button");
  let delay = 100;
  items.forEach((item) => {
    setTimeout(() => {
      if (sessionID !== currentSession) return;
      item.classList.add("deleting");
    }, delay);
    delay += 70;
  });

  setTimeout(() => {
    if (sessionID !== currentSession) return;
    crtScreen.classList.remove("glitching");
    screenEl.innerHTML = "";
    breadcrumb.textContent = "";
    integrity = 0;
    renderIntegrity();

    const overlay = makeEndOverlay(text("gameOverTitle"), text("gameOver"));
    crtScreen.appendChild(overlay);
    hackerLine.textContent = "";
  }, delay + 700);
}


 // ── FIN DE PARTIE : CINÉMATIQUE DE VICTOIRE ──────────────────
function triggerWin() {
  if (gameOver || gameWon) return;

  gameWon = true;
  cancelTyping();

  screenEl.innerHTML = "";
  breadcrumb.textContent = "";
  hackerLine.textContent = "";

  const makeElement = (tag, className, text = "") => {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  };

  // Écran de cinématique
  const overlay = makeElement("div", "robco-victory-screen");
  overlay.setAttribute("role", "status");

  const title = makeElement(
    "div",
    "robco-victory-title",
    "ROBCO INDUSTRIES"
  );

  const subtitle = makeElement(
    "div",
    "robco-victory-subtitle",
    text("victorySubtitle")
  );

  const logBox = makeElement("div", "robco-victory-log");

  const progressLabel = makeElement(
    "div",
    "robco-victory-progress-label",
    text("progressStart")
  );

  const progressTrack = makeElement("div", "robco-victory-progress-track");
  const progressFill = makeElement("div", "robco-victory-progress-fill");
  progressTrack.appendChild(progressFill);

  const finalPanel = makeElement("div", "robco-victory-final");
  finalPanel.style.display = "none";

  finalPanel.append(
    makeElement(
      "div",
      "robco-victory-final-title",
      text("restored")
    ),
    makeElement(
      "div",
      "robco-victory-restart",
      text("restart")
    )
  );

  overlay.append(
    title,
    subtitle,
    logBox,
    progressLabel,
    progressTrack,
    finalPanel
  );

  crtScreen.appendChild(overlay);

  // Lignes du terminal qui défilent pendant la réparation
  const logs = text("victoryLogs");

  let index = 0;

  function runDiagnostic() {
    // Arrête la cinématique si l'écran a été retiré lors d'un redémarrage
    if (!overlay.isConnected) return;

    if (index < logs.length) {
      const line = makeElement(
        "div",
        "robco-victory-logline",
        `[${String(index + 1).padStart(2, "0")}] ${logs[index]}`
      );

      logBox.appendChild(line);
      logBox.scrollTop = logBox.scrollHeight;

      const progress = Math.round(((index + 1) / logs.length) * 100);
      progressFill.style.width = `${progress}%`;
      progressLabel.textContent =
        `${text("progress")}: ${progress}%`;

      index++;
      window.setTimeout(runDiagnostic, 145);
      return;
    }

    // Révélation finale
    overlay.classList.add("robco-victory-complete");
    progressLabel.textContent = text("progressDone");
    finalPanel.style.display = "block";

    playSound(sndGood, VOLUME.success);
  }

  window.setTimeout(runDiagnostic, 500);
}


function makeEndOverlay(titleText, messages) {
  const overlay = document.createElement("div");
  overlay.id = "overlay-msg";
  const scanLine = document.createElement("div");
  scanLine.className = "scan-line";
  scanLine.style.top = "50%";
  const title = document.createElement("div");
  title.className = "big-msg red-alert";
  title.textContent = titleText;
  const speech = document.createElement("div");
  speech.className = "hacker-speech";
  messages.forEach((message, index) => {
    const line = document.createElement("div");
    line.textContent = message;
    if (index === messages.length - 1) line.style.opacity = "0.65";
    speech.appendChild(line);
  });
  overlay.append(scanLine, title, speech);
  return overlay;
}

// ── REBOOT ─────────────────────────────────────────────────────────────
function triggerReboot() {
  if (document.getElementById("reboot-screen")) return;

  sessionID += 1;
  const currentSession = sessionID;
  introRunning = false;
  sndBackground.pause();
  cancelTyping();
  document.getElementById("overlay-msg")?.remove();

  const rebootScreen = document.createElement("div");
  rebootScreen.id = "reboot-screen";
  const title = document.createElement("div");
  title.className = "rb-title";
  title.textContent = "ROBCO INDUSTRIES";
  const lines = text("reboot");
  rebootScreen.appendChild(title);
  lines.forEach((message, index) => {
    const line = document.createElement("div");
    line.className = "rb-line";
    line.style.animationDelay = `${index * 0.4}s`;
    line.textContent = message;
    rebootScreen.appendChild(line);
  });
  crtScreen.appendChild(rebootScreen);

  setTimeout(() => {
    if (sessionID !== currentSession) return;
    rebootScreen.remove();
    resetGame();
  }, 2200);
}

// ── RESET DU JEU ───────────────────────────────────────────────────────
function resetGame() {
  sessionID += 1;
  cancelTyping();
  playSound(sndPowerOn, VOLUME.power);
  if (audioUnlocked) {
    sndBackground.volume = VOLUME.background;
    sndBackground.play().catch(() => {});
  }

  crtScreen.classList.remove("glitching");
  document.getElementById("overlay-msg")?.remove();
  document.getElementById("reboot-screen")?.remove();
  screenEl.querySelectorAll(".deleting").forEach((item) => item.classList.remove("deleting"));

  navStack = [];
  gameFileSystem = structuredClone(FILE_SYSTEM);
  curNodes = gameFileSystem;
  integrity = 100;
  selectedIdx = 0;
  gameOver = false;
  gameWon = false;
  introRunning = false;
  for (const key of Object.keys(fixedFiles)) delete fixedFiles[key];
  GLITCH_CONFIG.triggerReverse = false;
  GLITCH_CONFIG.triggerSwap = false;

  hackerLine.style.display = "block";
  breadcrumb.style.display = "block";
  screenEl.style.pointerEvents = "auto";
  renderIntegrity();
  renderList();
  typeText(language === "en" ? "ROBCO TERMLINK — CONNECTION ESTABLISHED" : "ROBCO TERMLINK — CONNEXION ÉTABLIE");

  const currentSession = sessionID;
  setTimeout(() => {
    if (sessionID === currentSession) triggerHackerIntro();
  }, INTRO_DELAY);
}

// ── CLAVIER ────────────────────────────────────────────────────────────
document.addEventListener("keydown", (event) => {
  unlockAudio();
  if (gameOver || gameWon || introRunning) return;
  if (!screenEl.querySelector("#file-list")) return;

  const total = curNodes.length + (navStack.length > 0 ? 1 : 0);
  if (total === 0) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    selectedIdx = (selectedIdx + 1) % total;
    refreshSelected();
    scrollSelectedIntoView();
    updateHoverFromSelected();
    playNav();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    selectedIdx = (selectedIdx - 1 + total) % total;
    refreshSelected();
    scrollSelectedIntoView();
    updateHoverFromSelected();
    playNav();
  } else if (event.key === "Enter" || event.key === "ArrowRight") {
    event.preventDefault();
    if (selectedIdx < curNodes.length) {
      activateNode(curNodes[selectedIdx], selectedIdx);
    } else if (navStack.length > 0) {
      goBack();
    }
  } else if (event.key === "ArrowLeft" || event.key === "Backspace") {
    event.preventDefault();
    goBack();
  }
});

// ── BOUTON POWER ───────────────────────────────────────────────────────
languageFrButton.addEventListener("click", () => {
  if (started) return;
  playLanguageKey();
  language = "fr";
  applyLanguage();
});

languageEnButton.addEventListener("click", () => {
  if (started) return;
  playLanguageKey();
  language = "en";
  applyLanguage();
});

powerButton.addEventListener("click", () => {
  unlockAudio();

  if (!started) {
    started = true;
    document.getElementById("start-screen")?.style.setProperty("display", "none");
    document.querySelector(".terminal-inner-ui")?.style.setProperty("display", "flex", "important");
    playSound(sndPowerOn, VOLUME.power);
    resetGame();
    return;
  }

  playSound(sndPowerOff, VOLUME.power);
  triggerReboot();
});

// ── UTILITAIRE ─────────────────────────────────────────────────────────
function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

// Affiche immédiatement la valeur initiale, même avant le premier redémarrage.
applyLanguage();
renderIntegrity();

if (new URLSearchParams(window.location.search).has("debug-win")) {
  started = true;
  document.getElementById("start-screen")?.style.setProperty("display", "none");
  document.querySelector(".terminal-inner-ui")?.style.setProperty("display", "flex", "important");
  resetGame();
  window.setTimeout(triggerWin, 0);
}
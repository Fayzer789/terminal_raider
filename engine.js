import {
  CLEAN_REPLIES,
  DIR_REPLIES,
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
const fixedFiles = Object.create(null);

const TYPING_SPEED = 45;
const INTRO_DELAY = 3000;
const ERROR_PENALTY = 25;
const REPAIR_REWARD = 15;

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
  integrityEl.textContent = `INTÉGRITÉ [${"█".repeat(filledBars)}${"░".repeat(barCount - filledBars)}] ${safeIntegrity}%`;
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
      hoverName.textContent = "[ retour ]";
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
    hoverName.textContent = "[ retour ]";
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
    typeText("ERREUR : index de fichier corrompu...");
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
    typeText("ERREUR : décalage du secteur mémoire...");
    return;
  }
  GLITCH_CONFIG.triggerSwap = false;

  if (node.type === "dir") {
    playSound(sndEnter, VOLUME.normal);
    navStack.push({ nodes: curNodes, dirName: node.name });
    curNodes = node.children;
    selectedIdx = 0;
    renderList();
    typeText(pick(DIR_REPLIES));
    return;
  }

  if (node.corrupted && !fixedFiles[node.fileId]) {
    playSound(sndBuzz, VOLUME.buzz);
    openEditor(node.fileId);
    return;
  }

  playSound(sndBad, VOLUME.error);
  typeText(pick(CLEAN_REPLIES));
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
    typeText("ERREUR : fichier de correction introuvable.");
    return;
  }

  typeText(file.reply);
  screenEl.innerHTML = "";
  breadcrumb.textContent = `${buildPath()}${file.name} — CORRECTION REQUISE`;

  const view = document.createElement("div");
  view.id = "editor-view";

  const filename = document.createElement("div");
  filename.id = "editor-filename";
  filename.textContent = file.name;

  const textarea = document.createElement("textarea");
  textarea.id = "code-editor";
  textarea.spellcheck = false;
  textarea.value = file.code;

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
  const executeButton = makeButton("[ EXÉCUTER ]");
  const resetButton = makeButton("[ RESET ]");
  const backButton = makeButton("[ RETOUR ]");
  const status = document.createElement("span");
  status.id = "exec-status";

  executeButton.addEventListener("click", () => {
    unlockAudio();
    if (gameOver || gameWon) return;

    if (file.validate(textarea.value)) {
      playSound(sndGood, VOLUME.success);
      status.textContent = "✓ VALIDÉ";
      status.className = "ok";
      textarea.disabled = true;
      executeButton.disabled = true;
      fixedFiles[fileId] = true;
      typeText(file.solution);
      changeIntegrity(REPAIR_REWARD);

      if (!gameOver && checkAllFixed()) triggerWin();
    } else {
      playSound(sndBug, VOLUME.error);
      status.textContent = "✗ INVALIDE";
      status.className = "err";
      typeText("Correction incorrecte. Réessaie.");
      changeIntegrity(-ERROR_PENALTY);
    }
  });

  resetButton.addEventListener("click", () => {
    unlockAudio();
    if (gameOver || gameWon) return;
    playSound(sndEnter, VOLUME.normal);
    textarea.disabled = false;
    executeButton.disabled = false;
    textarea.value = file.code;
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
  title.textContent = "// INTRUSION TERMINAL_RAIDER //";
  const speech = document.createElement("div");
  speech.className = "hacker-speech";
  overlay.append(title, speech);
  crtScreen.appendChild(overlay);

  const dialogues = [
    "Un nouvel administrateur ? Pitoyable.",
    "Tes systèmes de sécurité sont obsolètes.",
    "Laisse-moi faire un peu de ménage dans tes fichiers...",
  ];
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
      typeText("SYSTÈME COMPROMIS. VEUILLEZ RÉPARER LES FICHIERS.");
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

    const overlay = makeEndOverlay(
      "// SYSTÈME COMPROMIS //",
      [
        "rm -rf /* en cours...",
        "Tu étais trop lent.",
        "Tous tes fichiers appartiennent à GHOST_CORE maintenant.",
        "[ Appuie sur POWER pour recommencer ]",
      ],
    );
    crtScreen.appendChild(overlay);
    hackerLine.textContent = "";
  }, delay + 700);
}

// ── FIN DE PARTIE : VICTOIRE ───────────────────────────────────────────
function triggerWin() {
  if (gameOver || gameWon) return;
  gameWon = true;
  cancelTyping();
  playSound(sndGood, VOLUME.success);
  screenEl.innerHTML = "";
  breadcrumb.textContent = "";

  const overlay = makeEndOverlay(
    "// SYSTÈME RESTAURÉ //",
    [
      "Tous les fichiers corrompus ont été réparés.",
      "Intégrité du système : restaurée.",
      "[ Appuie sur POWER pour recommencer ]",
    ],
  );
  crtScreen.appendChild(overlay);
  hackerLine.textContent = "";
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
  const lines = [
    "REBOOTING TERMLINK...",
    "CLEARING MEMORY BANKS...",
    "REINITIALIZING...",
  ];
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
  typeText("ROBCO TERMLINK — CONNEXION ÉTABLIE");

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
renderIntegrity();
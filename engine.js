import {
  CLEAN_REPLIES,
  DIR_REPLIES,
  CORRUPTED_FILES,
  FILE_SYSTEM,
} from "./config.js";

// ── AUDIO SYSTEM (INJECTÉ) ──────────────────────────────────────────
const SP = "./sounds/";
let audioUnlocked = false;

const keySounds = Array.from(
  { length: 10 },
  (_, i) => new Audio(`${SP}k${i + 1}.ogg`),
);
const sndEnter = new Audio(`${SP}kenter.ogg`);
const sndBad = new Audio(`${SP}passbad.ogg`);
const sndGood = new Audio(`${SP}passgood.ogg`);
const sndPowerOn = new Audio(`${SP}poweron.ogg`);
const sndPowerOff = new Audio(`${SP}poweroff.ogg`);
const sndBackground = new Audio(`${SP}background_sound.mp3`);
sndBackground.loop = true;
sndBackground.volume = 0.8;

const sndBug = new Audio(`${SP}bugEffect.mp3`);
sndBug.volume = 0.2;
sndBug.preload = "auto";

// --- NOUVEAU SON BUZZ ---
const sndBuzz = new Audio(`${SP}buzzSound.mp3`);
sndBuzz.preload = "auto"; // Force la mise en cache pour un lancement immédiat
sndBuzz.volume = 0.5; // Ajuste le volume si besoin

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  sndBackground.currentTime = 0;
  sndBackground.play().catch(() => {});
}

function playSound(a) {
  if (!audioUnlocked) return;
  a.cloneNode(true)
    .play()
    .catch(() => {});
}
function playKey() {
  if (!audioUnlocked) return;
  // On clone le son pour pouvoir en jouer plusieurs en même temps (très rapide)
  const s =
    keySounds[Math.floor(Math.random() * keySounds.length)].cloneNode(true);

  // C'EST ICI QUE TU RÈGLES LE VOLUME DE L'ÉCRITURE (1.0 = 100% = Maximum)
  s.volume = 1.0;

  s.play().catch(() => {});
}
function playNav() {
  if (!audioUnlocked) return;
  const s = keySounds[Math.floor(Math.random() * 3)].cloneNode(true);
  s.volume = 0.45;
  s.play().catch(() => {});
}
function playHover() {
  if (!audioUnlocked) return;
  const s = keySounds[0].cloneNode(true);
  s.volume = 0.2;
  s.play().catch(() => {});
}

// ── DOM ─────────────────────────────────────────────────────────────
/*document.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;
  document.title = `X: ${x.toFixed(2)}% Y: ${y.toFixed(2)}%`;
});
*/
const hackerLine = document.getElementById("hacker-line");
const screenEl = document.getElementById("screen");
const hoverName = document.getElementById("hover-name");
const integrityEl = document.getElementById("integrity-bar");
const breadcrumb = document.getElementById("breadcrumb");
const crtScreen = document.querySelector(".crt-screen");

// ── STATE ───────────────────────────────────────────────────────────
let navStack = [];
let curNodes = FILE_SYSTEM;
let integrity = 90; // Modifié : démarre à 90%
let selectedIdx = 0;
let gameOver = false;
let _typTimer = null;
let sessionID = 0; // Ajouté : identifiant de session pour tuer les setTimeouts

// ── TYPING ──────────────────────────────────────────────────────────
const TYPING_SPEED = 50;

function typeText(text) {
  if (_typTimer) clearTimeout(_typTimer);
  hackerLine.innerHTML = "";
  let i = 0;
  const cursor = document.createElement("span");
  cursor.className = "cursor";
  (function tick() {
    hackerLine.textContent = text.slice(0, i);
    hackerLine.appendChild(cursor);
    if (i++ < text.length) _typTimer = setTimeout(tick, TYPING_SPEED);
  })();
}

// ── INTEGRITY ───────────────────────────────────────────────────────
function renderIntegrity() {
  const BARS = 10;
  const on = Math.round((integrity / 100) * BARS);
  integrityEl.textContent = `INTÉGRITÉ [${"█".repeat(on)}${"░".repeat(BARS - on)}] ${integrity}%`;
}

function changeIntegrity(delta) {
  if (gameOver) return; // Sécurité pour empêcher de gagner/perdre pendant une cinématique

  integrity = Math.max(0, Math.min(100, integrity + delta));
  renderIntegrity();

  if (integrity <= 0) {
    triggerGameOver();
  } else if (integrity >= 100 || checkAllFixed()) {
    // <-- La correction est le || (OU)
    triggerWin();
  }
}

function checkAllFixed() {
  const total = Object.keys(CORRUPTED_FILES).length;
  return fixedCount() >= total;
}

function fixedCount() {
  return Object.values(fixedFiles).filter(Boolean).length;
}

const fixedFiles = {};

// ── BREADCRUMB ──────────────────────────────────────────────────────
function buildPath() {
  if (navStack.length === 0) return "/";
  return "/" + navStack.map((s) => s.dirName || "?").join("/") + "/";
}

//GLITCH
function glitch() {
  const terminal = document.querySelector(".crt-screen");
  if (!terminal) return;

  // On ajoute la classe CSS
  terminal.classList.add("glitching");

  // On la retire après 1.2s (la durée que tu avais choisie)
  setTimeout(() => {
    terminal.classList.remove("glitching");
  }, 1200);
}

// ── RENDER LIST ─────────────────────────────────────────────────────
function renderList() {
  screenEl.innerHTML = "";
  selectedIdx = Math.min(
    selectedIdx,
    curNodes.length - 1 + (navStack.length > 0 ? 1 : 0),
  );

  breadcrumb.textContent = buildPath();
  const ul = document.createElement("ul");
  ul.id = "file-list";

  curNodes.forEach((node, i) => {
    const li = document.createElement("li");
    const prefix = "> ";
    const suffix = node.type === "dir" ? node.name + "/" : node.name;
    li.textContent = prefix + suffix;
    if (node.corrupted && !fixedFiles[node.fileId])
      li.classList.add("corrupted");
    if (i === selectedIdx) li.classList.add("selected");

    li.addEventListener("mouseenter", () => {
      hoverName.textContent = node.type === "dir" ? node.name + "/" : node.name;
      selectedIdx = i;
      refreshSelected();
      playHover(); // AUDIO
    });
    li.addEventListener("mouseleave", () => {
      hoverName.textContent = "";
    });
    li.addEventListener("click", () => {
      unlockAudio(); // AUDIO
      activateNode(node, i);
    });
    ul.appendChild(li);
  });

  if (navStack.length > 0) {
    const backIdx = curNodes.length;
    const back = document.createElement("li");
    back.textContent = "> ../";
    back.className = "back";
    if (selectedIdx === backIdx) back.classList.add("selected");
    back.addEventListener("mouseenter", () => {
      hoverName.textContent = "[ retour ]";
      selectedIdx = backIdx;
      refreshSelected();
      playHover(); // AUDIO
    });
    back.addEventListener("mouseleave", () => {
      hoverName.textContent = "";
    });
    back.addEventListener("click", () => {
      unlockAudio(); // AUDIO
      goBack();
    });
    ul.appendChild(back);
  }

  screenEl.appendChild(ul);
}

function refreshSelected() {
  const items = screenEl.querySelectorAll("#file-list li");
  items.forEach((li, i) => {
    li.classList.toggle("selected", i === selectedIdx);
  });
}

function activateNode(node, idx) {
  if (gameOver) return;

  // GLITCH 1 : Inversion du nom du fichier
  if (
    window.GLITCH_CONFIG.triggerReverse ||
    Math.random() < window.GLITCH_CONFIG.reverseProb
  ) {
    window.GLITCH_CONFIG.triggerReverse = false;
    node.name = node.name.split("").reverse().join("");
    renderList();
    playSound(sndBug); // <--- NOUVEAU SON ICI
    typeText("ERREUR: Index de fichier corrompu...");
    return;
  }

  // GLITCH 2 : Échange de position avec un autre fichier
  if (
    window.GLITCH_CONFIG.triggerSwap ||
    Math.random() < window.GLITCH_CONFIG.swapProb
  ) {
    window.GLITCH_CONFIG.triggerSwap = false;
    if (curNodes.length > 1) {
      let swapIdx = idx;
      while (swapIdx === idx)
        swapIdx = Math.floor(Math.random() * curNodes.length);

      let temp = curNodes[idx];
      curNodes[idx] = curNodes[swapIdx];
      curNodes[swapIdx] = temp;

      renderList();
      playSound(sndBug); // <--- NOUVEAU SON ICI
      typeText("ERREUR: Décalage du secteur mémoire...");
      return;
    }
  }

  if (node.type === "dir") {
    playSound(sndEnter);
    navStack.push({ nodes: curNodes, dirName: node.name });
    curNodes = node.children;
    selectedIdx = 0;
    renderList();
    typeText(pick(DIR_REPLIES));
  } else if (node.corrupted && !fixedFiles[node.fileId]) {
    // --- SON BUZZ IMMÉDIAT ICI ---
    sndBuzz.currentTime = 0;
    sndBuzz.play().catch(() => {});

    openEditor(node.fileId);
  } else {
    playSound(sndBad);
    typeText(pick(CLEAN_REPLIES));
  }
}

function goBack() {
  if (navStack.length === 0) return;
  playSound(sndEnter); // AUDIO
  const prev = navStack.pop();
  curNodes = prev.nodes;
  selectedIdx = 0;
  renderList();
  typeText("...");
}

// ── KEYBOARD NAV ────────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  unlockAudio(); // AUDIO

  if (gameOver) return;
  if (!screenEl.querySelector("#file-list")) return;

  const total = curNodes.length + (navStack.length > 0 ? 1 : 0);

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIdx = (selectedIdx + 1) % total;
    refreshSelected();
    scrollSelectedIntoView();
    updateHoverFromSelected();
    playNav(); // AUDIO
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIdx = (selectedIdx - 1 + total) % total;
    refreshSelected();
    scrollSelectedIntoView();
    updateHoverFromSelected();
    playNav(); // AUDIO
  } else if (e.key === "Enter" || e.key === "ArrowRight") {
    e.preventDefault();
    if (selectedIdx < curNodes.length) {
      activateNode(curNodes[selectedIdx], selectedIdx);
    } else if (navStack.length > 0) {
      goBack();
    }
  } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
    e.preventDefault();
    goBack();
  }
});

function scrollSelectedIntoView() {
  const items = screenEl.querySelectorAll("#file-list li");
  if (items[selectedIdx])
    items[selectedIdx].scrollIntoView({ block: "nearest" });
}

function updateHoverFromSelected() {
  if (selectedIdx < curNodes.length) {
    const node = curNodes[selectedIdx];
    hoverName.textContent = node.type === "dir" ? node.name + "/" : node.name;
  } else {
    hoverName.textContent = "[ retour ]";
  }
}

// ── EDITOR ──────────────────────────────────────────────────────────
function openEditor(fileId) {
  glitch();
  const file = CORRUPTED_FILES[fileId];
  if (!file) return;
  typeText(file.reply);
  screenEl.innerHTML = "";
  breadcrumb.textContent = buildPath() + file.name + " — CORRECTION REQUISE";

  const view = document.createElement("div");
  view.id = "editor-view";
  const fname = document.createElement("div");
  fname.id = "editor-filename";

  const ta = document.createElement("textarea");
  ta.id = "code-editor";
  ta.spellcheck = false;
  ta.value = file.code;
  ta.addEventListener("keydown", (ev) => {
    unlockAudio(); // AUDIO
    if (ev.key.length === 1 || ev.key === "Backspace" || ev.key === "Enter") {
      playKey(); // AUDIO
    }

    if (ev.key === "Tab") {
      ev.preventDefault();
      playKey(); // AUDIO
      const s = ta.selectionStart;
      ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(ta.selectionEnd);
      ta.selectionStart = ta.selectionEnd = s + 2;
    }
  });

  const controls = document.createElement("div");
  controls.id = "editor-controls";

  const btnExec = mkBtn("[ EXÉCUTER ]");
  const btnReset = mkBtn("[ RESET ]");
  const btnBack = mkBtn("[ RETOUR ]");
  const status = document.createElement("span");
  status.id = "exec-status";

  btnExec.addEventListener("click", () => {
    unlockAudio();
    if (file.validate(ta.value)) {
      playSound(sndGood);
      status.textContent = "✓ VALIDÉ";
      status.className = "ok";
      ta.disabled = true;
      btnExec.disabled = true;
      typeText(file.solution);
      fixedFiles[fileId] = true;
      changeIntegrity(+25);
    } else {
      // --- SON BUG IMMÉDIAT ---
      sndBug.currentTime = 0; // Remet à zéro
      sndBug.play().catch(() => {}); // Joue instantanément sans cloner

      status.textContent = "✗ INVALIDE";
      status.className = "err";
      typeText("Mauvaise correction. Réessaie.");
      changeIntegrity(-50);
    }
  });

  btnReset.addEventListener("click", () => {
    unlockAudio(); // AUDIO
    playSound(sndEnter); // AUDIO
    ta.disabled = false;
    btnExec.disabled = false;
    ta.value = file.code;
    status.textContent = "";
    status.className = "";
  });

  btnBack.addEventListener("click", () => {
    unlockAudio(); // AUDIO
    playSound(sndEnter); // AUDIO
    breadcrumb.textContent = buildPath();
    renderList();
    typeText("...");
  });

  controls.append(btnExec, btnReset, btnBack, status);
  view.append(fname, ta, controls);
  screenEl.appendChild(view);
}

function mkBtn(label) {
  const b = document.createElement("button");
  b.className = "term-btn";
  b.textContent = label;
  b.addEventListener("mouseenter", playHover); // AUDIO
  return b;
}

// ── HACKER INTRO SEQUENCE ──────────────────────────────────────────
function triggerHackerIntro() {
  // 1. Cacher les éléments UI et bloquer la souris
  hackerLine.style.display = "none";
  breadcrumb.style.display = "none";
  screenEl.style.pointerEvents = "none"; // Désactive les clics/survols

  screenEl.innerHTML = "";
  breadcrumb.textContent = "";

  const introOverlay = document.createElement("div");
  introOverlay.id = "overlay-msg";

  const bigMsg = document.createElement("div");
  bigMsg.className = "big-msg red-alert"; // <-- 2. Utilise la couleur ROUGE
  bigMsg.textContent = "// INTRUSION GHOST_CORE //";

  const speech = document.createElement("div");
  speech.className = "hacker-speech";

  introOverlay.append(bigMsg, speech);
  crtScreen.appendChild(introOverlay);

  const dialogues = [
    "Un nouvel administrateur ? Pitoyable.",
    "Tes systèmes de sécurité sont obsolètes.",
    "Laisse-moi faire un peu de ménage dans tes fichiers...",
  ];

  let step = 0;
  function nextDialogue() {
    if (step < dialogues.length) {
      glitch();
      playSound(sndBug);
      speech.innerHTML += `<br>> ${dialogues[step]}`;

      integrity -= 26;
      renderIntegrity();

      step++;
      setTimeout(nextDialogue, 3000);
    } else {
      glitch();
      setTimeout(() => {
        introOverlay.remove();
        integrity = 20;
        renderIntegrity();
        gameOver = false;

        // 3. Réactiver l'UI et la souris
        hackerLine.style.display = "block";
        breadcrumb.style.display = "block";
        screenEl.style.pointerEvents = "auto";

        // 4. Forcer les 2 prochains glitchs au clic
        window.GLITCH_CONFIG.triggerReverse = true;
        window.GLITCH_CONFIG.triggerSwap = true;

        renderList();
        typeText("SYSTÈME COMPROMIS. VEUILLEZ RÉPARER LES FICHIERS.");
      }, 2000);
    }
  }
  setTimeout(nextDialogue, 1000);
}

// ── GAME OVER ───────────────────────────────────────────────────────
function triggerGameOver() {
  gameOver = true;
  playSound(sndBad);

  const currentSession = sessionID; // Fix pour stopper la séquence en cas de reset

  crtScreen.classList.add("glitching");

  const allItems = screenEl.querySelectorAll("li, div, textarea");
  let delay = 200;
  allItems.forEach((el) => {
    setTimeout(() => {
      if (sessionID !== currentSession) return;
      el.classList.add("deleting");
    }, delay);
    delay += 120;
  });

  setTimeout(() => {
    if (sessionID !== currentSession) return;
    crtScreen.classList.remove("glitching");
    screenEl.innerHTML = "";
    breadcrumb.textContent = "";
    integrityEl.textContent = "INTÉGRITÉ [░░░░░░░░░░] 0%";

    const overlay = document.createElement("div");
    overlay.id = "overlay-msg";

    const bigMsg = document.createElement("div");
    bigMsg.className = "big-msg red-alert";
    bigMsg.textContent = "// SYSTÈME COMPROMIS //";

    const speech = document.createElement("div");
    speech.className = "hacker-speech";
    speech.innerHTML = `
      rm -rf /* en cours...<br><br>
      Tu étais trop lent.<br>
      Tous tes fichiers appartiennent à GHOST_CORE maintenant.<br><br>
      <span style="opacity:0.5">[ Appuie sur POWER pour recommencer ]</span>
    `;
    const scanLine = document.createElement("div");
    scanLine.className = "scan-line";
    scanLine.style.top = "50%";

    overlay.append(scanLine, bigMsg, speech);
    crtScreen.appendChild(overlay);
    hackerLine.textContent = "";
  }, delay + 1500);
}

// ── REBOOT ──────────────────────────────────────────────────────────
function triggerReboot() {
  if (document.getElementById("reboot-screen")) return;
  sessionID++;
  const currentSession = sessionID;

  sndBackground.pause();

  const ol = document.getElementById("overlay-msg");
  if (ol) ol.remove();

  const rb = document.createElement("div");
  rb.id = "reboot-screen";
  const title = document.createElement("div");
  title.className = "rb-title";
  title.textContent = "ROBCO INDUSTRIES";

  const line1 = document.createElement("div");
  line1.className = "rb-line";
  line1.textContent = "REBOOTING TERMLINK...";

  const line2 = document.createElement("div");
  line2.className = "rb-line";
  line2.style.animationDelay = "0.4s";
  line2.textContent = "CLEARING MEMORY BANKS...";

  const line3 = document.createElement("div");
  line3.className = "rb-line";
  line3.style.animationDelay = "0.8s";
  line3.textContent = "REINITIALIZING...";

  rb.append(title, line1, line2, line3);
  crtScreen.appendChild(rb);

  setTimeout(() => {
    if (sessionID !== currentSession) return;
    rb.remove();
    resetGame();
  }, 2500);
}

// ── RESET ───────────────────────────────────────────────────────────
function resetGame() {
  sessionID++;
  playSound(sndPowerOn);

  if (audioUnlocked) sndBackground.play().catch(() => {});

  // Nettoyage de l'UI
  crtScreen.classList.remove("glitching");
  const ol = document.getElementById("overlay-msg");
  if (ol) ol.remove();
  const deletingItems = screenEl.querySelectorAll(".deleting");
  deletingItems.forEach((el) => el.classList.remove("deleting"));

  navStack = [];
  curNodes = FILE_SYSTEM;
  integrity = 100; // 1. On démarre bien à 100%
  selectedIdx = 0;

  gameOver = true; // 2. ON BLOQUE LE CLAVIER PENDANT LES 3 SECONDES

  for (const k in fixedFiles) delete fixedFiles[k];

  renderIntegrity();
  renderList();
  typeText("ROBCO TERMLINK — CONNEXION ÉTABLIE");

  // 3. On déclenche l'attaque du Hacker après 3 secondes pile
  setTimeout(() => {
    triggerHackerIntro();
  }, 3000);
}

// ── POWER BUTTON ────────────────────────────────────────────────────
let started = false;

document.getElementById("power-btn").addEventListener("click", () => {
  unlockAudio();

  if (!started) {
    started = true;

    // 1. Supprime ou masque l'écran de démarrage
    const startScreen = document.getElementById("start-screen");
    if (startScreen) {
      startScreen.style.display = "none"; // On le cache
    }

    // 2. Affiche l'interface du terminal
    const ui = document.querySelector(".terminal-inner-ui");
    if (ui) {
      ui.style.setProperty("display", "flex", "important"); // On force l'affichage
    }

    // 3. Lance la séquence de boot
    playSound(sndPowerOn);
    resetGame();
    return;
  }

  // Si déjà démarré, le bouton Power sert de reboot
  playSound(sndPowerOff);
  triggerReboot();
});

// ── UTILS ───────────────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/*
// ── WIN ─────────────────────────────────────────────────────────────
function triggerWin() {
  gameOver = true;
  playSound(sndGood); // AUDIO
  typeText("NON... IMPOSSIBLE.");
  const currentSession = sessionID; // Fix session

  setTimeout(() => {
    if (sessionID !== currentSession) return;
    screenEl.innerHTML = "";
    breadcrumb.textContent = "/";

    const overlay = document.createElement("div");
    overlay.id = "overlay-msg";

    const bigMsg = document.createElement("div");
    bigMsg.className = "big-msg";
    bigMsg.textContent = "// VÉRIFICATION FINALE //";

    const checks = document.createElement("div");
    checks.className = "hacker-speech";
    checks.style.textAlign = "left";
    const files = Object.keys(CORRUPTED_FILES);
    overlay.append(bigMsg, checks);
    crtScreen.appendChild(overlay);

    let i = 0;
    function nextCheck() {
      if (sessionID !== currentSession) return;
      if (i < files.length) {
        const line = document.createElement("div");
        line.textContent = `> vérification ${files[i]}...`;
        checks.appendChild(line);
        setTimeout(() => {
          if (sessionID !== currentSession) return;
          line.textContent = `> ${files[i]} .............. [OK]`;
          line.style.color = "var(--fg-rgb)";
          i++;
          setTimeout(nextCheck, 400);
        }, 500);
      } else {
        glitch();
        setTimeout(() => {
          if (sessionID !== currentSession) return;
          bigMsg.textContent = "// SYSTÈME RESTAURÉ //";
          const hackerSpeech = document.createElement("div");
          hackerSpeech.className = "hacker-speech";
          hackerSpeech.style.marginTop = "16px";
          hackerSpeech.innerHTML = `
            Bien joué... cette fois.<br>
            Tu as réparé tout ce que j'ai cassé.<br>
            Mais je reviendrai.<br><br>
            <span style="opacity:0.5">GHOST_CORE — connexion interrompue</span>
          `;
          overlay.appendChild(hackerSpeech);
          hackerLine.textContent = "";

          // Reboot forcé à la fin de la victoire
          setTimeout(() => {
            if (sessionID !== currentSession) return;
            triggerReboot();
          }, 3000);
        }, 600);
      }
    }
    nextCheck();
  }, 800);
}
*/

// ------------------ ELEMENTS ------------------
const SCREENS = {
  start: document.getElementById("start-screen"),
  game: document.getElementById("game-screen"),
  win: document.getElementById("win-screen"),
  lose: document.getElementById("lose-screen")
};

const levelText = document.getElementById("levelText");
const handText = document.getElementById("handText");
const failBtn = document.getElementById("failBtn");
const soundToggle = document.getElementById("soundToggle");
const actionButtons = document.querySelectorAll(".action-btn");
const startGameBtn = document.getElementById("startGameBtn");
const privacyToggle = document.getElementById("privacyToggle");
const addLevelBtn = document.getElementById("addLevelBtn");

// ------------------ AUDIO ------------------
const audioStartGame = new Audio("sounds/start-game.mp3");
const audioLevelUp = new Audio("sounds/level-up.mp3");
const audioWin = new Audio("sounds/win.mp3");
const audioLose = new Audio("sounds/lose.mp3");

// --- multi-undo---
let gameStateHistory = [];  // stack for multi-undo

// ------------------ PRIVACY MODE ------------------
let privacyActive = false;

// Set initial icon
privacyToggle.textContent = "🐒";

privacyToggle.addEventListener("click", () => {
  privacyActive = !privacyActive;

  if (privacyActive) {
    document.body.classList.add("privacy-active");
    privacyToggle.textContent = "🙈";
  } else {
    document.body.classList.remove("privacy-active");
    privacyToggle.textContent = "🐒";
  }
  vibrate(20);
});

// ------------------ SOUND TOGGLE ------------------
let soundEnabled = true;

// Set initial icon
soundToggle.textContent = "🐵";

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? "🐵" : "🙊";
  vibrate(20);
});

function playSound(audio) { 
  if (soundEnabled) audio.play(); 
}

function playClickSound(src) { 
  if (!soundEnabled) return; 
  new Audio(src).play(); 
}

function updateTopControls() {
  const addBtn = document.getElementById("addLevelBtn");
  addBtn.style.display = SCREENS.game.classList.contains("active") ? "block" : "none";
  
  const undoBtn = document.getElementById("undoBtn");
  undoBtn.style.display = SCREENS.game.classList.contains("active") ? "block" : "none";
}

// ------------------ ADD LEVEL BUTTON ------------------
addLevelBtn.addEventListener("click", () => {
  // Increment total levels
  gameState.endLevel++;               
  gameState.totalLevels++;            

  // Flash feedback
  levelText.classList.add("level-up-flash");
  setTimeout(() => levelText.classList.remove("level-up-flash"), 400);

  // Update UI and save state
  updateGameUI();
  saveGame();

  // Optional: feedback
  vibrate(50);
  playClickSound("sounds/hand-click.mp3");
});

// ------------------ VIBRATION ------------------
function vibrate(duration = 30) { 
  if ("vibrate" in navigator) navigator.vibrate(duration); 
}

// ------------------ GAME STATE ------------------
let gameState = {
  currentLevel: 1,
  startLevel: 1,
  endLevel: 1,
  totalLevels: 1,
  hands: 0,          // hands in current level
  sessionHands: 0,   // cumulative session hands
  stats: {           // single source of truth for HUD
    VPIP: 0,
    PFR: 0,
    threeBet: 0,
    fourBet: 0,
    hands: 0
  }
};

// ------------------ SCREEN CONTROL ------------------
function showScreen(screen) {
  Object.values(SCREENS).forEach(s => s && s.classList.remove("active"));
  if (screen) screen.classList.add("active");
  
  // update buttons visibility
  updateTopControls();
} 

// Show add-level button only on game screen
  if(screen === SCREENS.game){
    document.getElementById("addLevelBtn").style.display = "block";
  } else {
    document.getElementById("addLevelBtn").style.display = "none";
  }

// ------------------ START GAME ------------------
startGameBtn.addEventListener("click", () => {
  vibrate(30); 
  flashButton(startGameBtn); 
  playSound(audioStartGame);

  // Clear previous game
  clearGame();

  const totalLevelsInput = parseInt(document.getElementById("totalLevels").value);
  const startLevelInput = parseInt(document.getElementById("startLevel").value);
  const endLevelInput = parseInt(document.getElementById("endLevel").value);

  if (totalLevelsInput && totalLevelsInput > 0) {
    gameState.startLevel = 1;
    gameState.currentLevel = 1;
    gameState.endLevel = totalLevelsInput;
    gameState.totalLevels = totalLevelsInput;
  } else if (startLevelInput && endLevelInput && startLevelInput > 0 && endLevelInput >= startLevelInput) {
    gameState.startLevel = startLevelInput;
    gameState.currentLevel = startLevelInput;
    gameState.endLevel = endLevelInput;
    gameState.totalLevels = endLevelInput - startLevelInput + 1;
  } else {
    alert("Enter valid level settings");
    return;
  }

  // Reset stats and hands
  gameState.hands = 0;
  gameState.sessionHands = 0;
  gameState.stats = { VPIP:0, PFR:0, threeBet:0, fourBet:0, hands:0 };
gameState.firstHandClicked = false;  // ✅ reset flag

  saveGame();
  updateGameUI();
  updateHandProgress();
  updateHUD();
  showScreen(SCREENS.game);
});

// ------------------ ACTION BUTTON LOGIC ------------------
let lastTapTime = 0;

actionButtons.forEach(button => {
  button.addEventListener("click", () => {
    const now = Date.now();
    if (now - lastTapTime < 250) return; // prevent double tap
    lastTapTime = now;

    const action = button.dataset.action.toLowerCase();

    // --- Sound & Vibration ---
    playClickSound("sounds/hand-click.mp3");
    vibrate(20);
    
    // --- Save state for undo ---
gameStateHistory.push(JSON.parse(JSON.stringify(gameState)));

    // 1️⃣ Update stats first
    if (["call","bet","3bet","4bet"].includes(action)) gameState.stats.VPIP++;
    if (["bet","3bet","4bet"].includes(action)) gameState.stats.PFR++;
    if (action === "3bet") gameState.stats.threeBet++;
    if (action === "4bet") gameState.stats.fourBet++;

// --- INCREMENT HANDS & STATS ---
if (!gameState.firstHandClicked) {
    gameState.firstHandClicked = true; // mark first click
}

// Increment hands & stats on every click
gameState.hands++;          // level hands
gameState.sessionHands++;   // session hands
gameState.stats.hands = gameState.sessionHands;

// --- UPDATE UI ---
updateGameUI();
updateHandProgress();
updateHUD();

    // ----- LEVEL COMPLETE -----
    if (gameState.hands === 10) {
      const finalLevel = gameState.startLevel + gameState.totalLevels - 1;

      if (gameState.currentLevel >= finalLevel) {
        vibrate([200, 100, 200]);
        playSound(audioWin);

        // Show final HUD stats
        updateFinalHUD();

        // Clear old game to prevent old hands from loading again
        clearGame();
        showScreen(SCREENS.win);
        return;
      } else {
        // LEVEL UP
        vibrate(80);
        playSound(audioLevelUp);
        levelText.classList.add("level-up-flash");
        setTimeout(() => levelText.classList.remove("level-up-flash"), 400);

        gameState.currentLevel++;
        gameState.hands = 0; // reset per-level hands

        // Update UI after level change
        updateGameUI();
        updateHandProgress();
        updateHUD();
      }
    }

    // Save state after click
    saveGame();
  });
});

// ------------------ FAIL / RESET ------------------
failBtn.addEventListener("click", () => {
  if(confirm("Are you sure? This will reset the game.")) {
    vibrate([150,80,150]);
    playSound(audioLose);
    clearGame();
    showScreen(SCREENS.lose);
  }
});

const undoBtn = document.getElementById("undoBtn");

undoBtn.addEventListener("click", () => {
  if(gameStateHistory.length === 0) {
    vibrate(20);
    return; // nothing to undo
  }

  // Pop the last state
  gameState = gameStateHistory.pop();

  // Update UI
  updateGameUI();
  updateHandProgress();
  updateHUD();

  // Optional: vibrate or play sound
  vibrate(50);
  playClickSound("sounds/hand-click.mp3");

  // Save restored state to localStorage
  saveGame();
});

// ------------------ UI UPDATE ------------------
function updateGameUI() {
  levelText.textContent = `Level ${gameState.currentLevel} of ${gameState.endLevel}`;
  handText.textContent = `Hands Completed: ${gameState.hands} / 10`;
}

function updateHandProgress() {
  const container = document.getElementById("handProgress");
  if (!container) return;

  container.innerHTML = ""; // clear previous

  for (let i = 0; i < 10; i++) {
    const seg = document.createElement("div");
    seg.classList.add("hand-segment");
    if (i < gameState.hands) seg.style.opacity = "1"; // completed
    container.appendChild(seg);
  }
}

function updateHUD() {
  const hud = document.querySelector("#game-screen #hudBar");
  if (!hud) return;

  const values = hud.querySelectorAll(".hud-value");
  if (values.length < 5) return;

  const hands = Number(gameState.stats.hands) || 0;

  const vpipPct  = hands > 0 ? Math.min(100, Math.round((gameState.stats.VPIP / hands) * 100)) : 0;
  const pfrPct   = hands > 0 ? Math.min(100, Math.round((gameState.stats.PFR / hands) * 100)) : 0;
  const threePct = hands > 0 ? Math.min(100, Math.round((gameState.stats.threeBet / hands) * 100)) : 0;
  const fourPct  = hands > 0 ? Math.min(100, Math.round((gameState.stats.fourBet / hands) * 100)) : 0;

  values[0].textContent = vpipPct;
  values[1].textContent = pfrPct;
  values[2].textContent = threePct;
  values[3].textContent = fourPct;
  values[4].textContent = hands;
}

function updateFinalHUD() {
  const finalHud = document.querySelector("#finalHUD");
  if (!finalHud) return;

  const values = finalHud.querySelectorAll(".hud-value");
  if (values.length < 5) return;

  const hands = Number(gameState.stats.hands) || 0;

  const vpipPct  = hands > 0 ? Math.min(100, Math.round((gameState.stats.VPIP / hands) * 100)) : 0;
  const pfrPct   = hands > 0 ? Math.min(100, Math.round((gameState.stats.PFR / hands) * 100)) : 0;
  const threePct = hands > 0 ? Math.min(100, Math.round((gameState.stats.threeBet / hands) * 100)) : 0;
  const fourPct  = hands > 0 ? Math.min(100, Math.round((gameState.stats.fourBet / hands) * 100)) : 0;

  values[0].textContent = vpipPct;
  values[1].textContent = pfrPct;
  values[2].textContent = threePct;
  values[3].textContent = fourPct;
  values[4].textContent = hands;
}

// ------------------ LOCAL STORAGE ------------------
function saveGame() {
  localStorage.setItem("pokerDisciplineGame", JSON.stringify(gameState));
}

function loadGame() {
  const saved = localStorage.getItem("pokerDisciplineGame");
  if(saved){
    gameState = JSON.parse(saved);
    gameState.startLevel = gameState.startLevel || 1;
    gameState.currentLevel = gameState.currentLevel || gameState.startLevel;
    gameState.hands = gameState.hands || 0;
    gameState.totalLevels = gameState.totalLevels || 1;
    gameState.endLevel = gameState.endLevel || (gameState.startLevel + gameState.totalLevels -1);
    gameState.stats = gameState.stats || { VPIP:0, PFR:0, threeBet:0, fourBet:0, hands:0 };
    updateGameUI(); 
    updateHandProgress(); 
    updateHUD();
    showScreen(SCREENS.game);
    updateTopControls();
  }
}

function clearGame() { 
  localStorage.removeItem("pokerDisciplineGame"); 
}

function resetGame() { 
  clearGame(); 
  showScreen(SCREENS.start); 
}

// ------------------ BUTTON FLASH ------------------
function flashButton(btn,d=150) { 
  btn.classList.add("level-up-flash"); 
  setTimeout(() => btn.classList.remove("level-up-flash"), d); 
}

document.querySelectorAll("#win-screen button,#lose-screen button").forEach(btn => {
  btn.addEventListener("click", () => { 
    vibrate(30); 
    flashButton(btn); 
  });
});

// ------------------ INIT ------------------
loadGame();

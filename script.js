// ------------------ ELEMENTS ------------------
const SCREENS = {
  start: document.getElementById("start-screen"),
  game: document.getElementById("game-screen"),
  win: document.getElementById("win-screen"),
  lose: document.getElementById("lose-screen"),
  range: null // we'll create this screen next
};

const levelText = document.getElementById("levelText");
const handText = document.getElementById("handText");
const failBtn = document.getElementById("failBtn");
const soundToggle = document.getElementById("soundToggle");
const actionButtons = document.querySelectorAll(".action-btn");
const startGameBtn = document.getElementById("startGameBtn");
const privacyToggle = document.getElementById("privacyToggle");
const addLevelBtn = document.getElementById("addLevelBtn");
const miniHand = document.getElementById("miniHand");
const miniScore = document.getElementById("miniScore");
const miniHands = document.getElementById("miniHands");
const miniAccuracy = document.getElementById("miniAccuracy");
const miniStreak = document.getElementById("miniStreak");
const miniActionButtons = document.querySelectorAll(".mini-action-btn");
const card1Img = document.getElementById("card1-img");
const card2Img = document.getElementById("card2-img");


// ------------------ AUDIO ------------------
const audioStartGame = new Audio("sounds/start-game.mp3");
const audioLevelUp = new Audio("sounds/level-up.mp3");
const audioWin = new Audio("sounds/win.mp3");
const audioLose = new Audio("sounds/lose.mp3");

// --- multi-undo---
let gameStateHistory = [];  // stack for multi-undo

// ------------------ STARTING HANDS ------------------
const startingHands = [
  // Pairs
  "AA","KK","QQ","JJ","TT","99","88","77","66","55","44","33","22",
  
  // Suited hands (s = suited)
  "AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s",
  "KQs","KJs","KTs","K9s","K8s","K7s","K6s","K5s","K4s","K3s","K2s",
  "QJs","QTs","Q9s","Q8s","Q7s","Q6s","Q5s","Q4s","Q3s","Q2s",
  "JTs","J9s","J8s","J7s","J6s","J5s","J4s","J3s","J2s",
  "T9s","T8s","T7s","T6s","T5s","T4s","T3s","T2s",
  "98s","97s","96s","95s","94s","93s","92s",
  "87s","86s","85s","84s","83s","82s",
  "76s","75s","74s","73s","72s",
  "65s","64s","63s","62s",
  "54s","53s","52s",
  "43s","42s",
  "32s",

  // Offsuit hands (o = offsuit)
  "AKo","AQo","AJo","ATo","A9o","A8o","A7o","A6o","A5o","A4o","A3o","A2o",
  "KQo","KJo","KTo","K9o","K8o","K7o","K6o","K5o","K4o","K3o","K2o",
  "QJo","QTo","Q9o","Q8o","Q7o","Q6o","Q5o","Q4o","Q3o","Q2o",
  "JTo","J9o","J8o","J7o","J6o","J5o","J4o","J3o","J2o",
  "T9o","T8o","T7o","T6o","T5o","T4o","T3o","T2o",
  "98o","97o","96o","95o","94o","93o","92o",
  "87o","86o","85o","84o","83o","82o",
  "76o","75o","74o","73o","72o",
  "65o","64o","63o","62o",
  "54o","53o","52o",
  "43o","42o",
  "32o"
];

// ------------------ RANDOM HAND FUNCTIONS ------------------
function getRandomHand() {
  const index = Math.floor(Math.random() * startingHands.length);
  return startingHands[index];
}

function displayMiniHandCSS() {
  if (!miniGame.currentHand) return;

  // miniGame.currentHandText is what displayMiniHandText() would show
  const handText = convertRangeToText(miniGame.currentHand); // e.g., "KhQc" or "6h6d"
  const cards = handText.match(/.{2}/g);                      // ["Kh", "Qc"]

  // Assign to CSS card elements
  const c1 = document.getElementById("card1");
  const c2 = document.getElementById("card2");

  c1.dataset.card = cards[0];  // e.g., "Kh"
  c2.dataset.card = cards[1];  // e.g., "Qc"
}

// ------------------ CORRECT ACTIONS ------------------
const correctAction = {};

// 1️⃣ Pocket Pairs 22-JJ → Limp
["22","33","44","55","66","77","88","99","TT","JJ"].forEach(hand => {
  correctAction[hand] = "limp";
});

// 2️⃣ Strong Aces → Limp3B
["AA","KK","QQ","AKs","AKo","AQs","AQo","AJs","AJo","ATs","A9s","A8s"].forEach(hand => {
  correctAction[hand] = "limp3b";
});

// 3️⃣ All other hands → Fold
startingHands.forEach(hand => {
  if (!(hand in correctAction)) {
    correctAction[hand] = "fold";
  }
});

// Example usage:
// console.log(correctAction["KhJs"]); // "fold"
// console.log(correctAction["AQs"]);   // "limp3b"
// console.log(correctAction["66"]);    // "limp"

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
  
  const rangeBtn = document.getElementById("rangeToggle");
  rangeBtn.style.display = (SCREENS.game.classList.contains("active") || SCREENS.range.classList.contains("active")) ? "block" : "none";
}

// ------------------ RANGE TRAINER TOGGLE ------------------

// 1. Add a reference to the new button
const rangeToggle = document.getElementById("rangeToggle");

// 2. Add a placeholder for the Range Trainer screen
SCREENS.range = document.getElementById("range-screen"); // We'll create this div in HTML next

// 3. Track toggle state
let onRangeScreen = false;

// 4. Toggle event listener
rangeToggle.addEventListener("click", () => {
  onRangeScreen = !onRangeScreen;

  if (onRangeScreen) {
    // Only show first hand if miniGame.currentHand is null (first time or after session reset)
    if (!miniGame.currentHand) showRandomHand();
    showScreen(SCREENS.range); 
  } else {
    showScreen(SCREENS.game);
  }
});

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

// ------------------ MINI-GAME STATE ------------------
let miniGame = {
  score: 0,
  hands: 0,
  streak: 0,
  currentHand: null,
};

function showRandomHand() {
  miniGame.currentHand = getRandomHand(); // still "KQo", "66", etc.
  displayMiniHandCSS();                          // show images via CSS
}

function convertRangeToText(hand) {
  const ranks = hand.slice(0, 2); // "KQ" or "66"
  const type = hand.length === 3 ? hand[2] : null; // "s" or "o" or null for pairs

  // Define suits
  const suits = ["h", "d", "c", "s"]; // hearts, diamonds, clubs, spades

  if (!type) {
    // Pocket pair → just assign different suits randomly
    let suit1 = suits[Math.floor(Math.random() * 4)];
    let suit2;
    do { suit2 = suits[Math.floor(Math.random() * 4)]; } while(suit2 === suit1);
    return ranks[0]+suit1 + ranks[1]+suit2; // e.g., "6h6d"
  }

  if (type === "s") {
    // Suited → same suit
    const suit = suits[Math.floor(Math.random() * 4)];
    return ranks[0]+suit + ranks[1]+suit; // e.g., "KhQh"
  } else if (type === "o") {
    // Offsuit → different suits
    let suit1 = suits[Math.floor(Math.random() * 4)];
    let suit2;
    do { suit2 = suits[Math.floor(Math.random() * 4)]; } while(suit2 === suit1);
    return ranks[0]+suit1 + ranks[1]+suit2; // e.g., "KhQc"
  }

  return hand; // fallback
}

// Display function

function getCardSymbol(card) {
  const rank = card[0]; // A, K, Q, J, T, 9...
  const suit = card[1].toLowerCase(); // d, h, c, s

  const suits = { 
    h: "♥", 
    d: "♦", 
    c: "♣", 
    s: "♠" 
  };

  return rank + suits[suit];
}


function displayMiniHandText() {
  if (!miniGame.currentHand) return;
  miniHand.textContent = convertRangeToText(miniGame.currentHand);
}

function displayMiniHandImages() {
  if (!miniGame.currentHand) return;

  // miniGame.currentHand should be ["Kh", "Qc"] format
  const [card1, card2] = miniGame.currentHand;

  card1Img.src = `cards/${card1}.png`;
  card2Img.src = `cards/${card2}.png`;
}

// Store original function
const originalShowRandomHand = showRandomHand;

showRandomHand = function() {
  originalShowRandomHand(); // keeps current logic intact
  displayMiniHand();        // adds visual cards
};

// ------------------ MINI ACTION BUTTONS ------------------
miniActionButtons.forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.action.toLowerCase();
    const correct = correctAction[miniGame.currentHand];

    miniGame.hands++;

    if (action === correct) {
      miniGame.score++;
      miniGame.streak++;
    } else {
      miniGame.streak = 0;
    }

    // Update HUD
    miniScore.textContent = miniGame.score;
    miniHands.textContent = miniGame.hands;
    miniStreak.textContent = miniGame.streak;

    const accuracy = Math.round((miniGame.score / miniGame.hands) * 100);
    miniAccuracy.textContent = accuracy + "%";
    
    saveMiniGame();

// Next hand
    showRandomHand();

    vibrate(20);
    playClickSound("sounds/hand-click.mp3");
  });
});


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
  resetMiniGame();
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
        
        // Reset mini-game for next session
    resetMiniGame();

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
    
    // Reset mini-game on session loss
    resetMiniGame();

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

function resetMiniGame() {
  miniGame.score = 0;
  miniGame.hands = 0;
  miniGame.streak = 0;
  miniGame.currentHand = null;

  miniScore.textContent = "0";
  miniHands.textContent = "0";
  miniStreak.textContent = "0";
  miniAccuracy.textContent = "0%";
}

function saveMiniGame() {
  localStorage.setItem("miniGameState", JSON.stringify(miniGame));
}

function loadMiniGame() {
  const savedMini = localStorage.getItem("miniGameState");

  if (savedMini) {
    Object.assign(miniGame, JSON.parse(savedMini));

    miniScore.textContent = miniGame.score;
    miniHands.textContent = miniGame.hands;
    miniStreak.textContent = miniGame.streak;

    const accuracy = miniGame.hands > 0
      ? Math.round((miniGame.score / miniGame.hands) * 100)
      : 0;

    miniAccuracy.textContent = accuracy + "%";
    
if (miniGame.currentHand) {
    // Display using CSS cards
    displayMiniHandCSS(); // your function that sets data-card attributes
}
  }
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
loadMiniGame();

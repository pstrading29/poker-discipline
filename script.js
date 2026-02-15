// ------------------ ELEMENTS ------------------
const SCREENS = {
  start: document.getElementById("start-screen"),
  game: document.getElementById("game-screen"),
  win: document.getElementById("win-screen"),
  lose: document.getElementById("lose-screen")
};

const levelText = document.getElementById("levelText");
const handText = document.getElementById("handText");
const handBtn = document.getElementById("handBtn");
const failBtn = document.getElementById("failBtn");
const soundToggle = document.getElementById("soundToggle");

// ------------------ AUDIO ------------------
const audioStartGame = new Audio("sounds/start-game.mp3");  // new sound for Start Game button
const audioHandClick = new Audio("sounds/hand-click.mp3");   // new sound for Hand Completed
const audioLevelUp = new Audio("sounds/level-up.mp3");
const audioWin = new Audio("sounds/win.mp3");
const audioLose = new Audio("sounds/lose.mp3");

// ------------------ SOUND TOGGLE ------------------
let soundEnabled = true;

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? "🔊" : "🔇";
});

// Helper for playing sounds
function playSound(audio) {
  if (soundEnabled) audio.play();
}

function playClickSound(src) {
  if (!soundEnabled) return;
  const audio = new Audio(src);
  audio.play();
}

// ------------------ VIBRATION ------------------
function vibrate(duration = 30) {
  if ("vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}

// ------------------ GAME STATE ------------------
let gameState = {
  currentLevel: 1,
  endLevel: 1,
  hands: 0,
  totalLevels: 1,
  startLevel: 1
};

// ------------------ SCREEN CONTROL ------------------
function showScreen(screen) {
  Object.values(SCREENS).forEach(s => {
    s.classList.remove("active");
  });

  // Allow display change first, then animate
  setTimeout(() => {
    screen.classList.add("active");
  }, 10);

  updateSoundButtonPosition();
}

// ------------------ START GAME ------------------
document.getElementById("startGameBtn").addEventListener("click", () => {
  playSound(audioStartGame);  // <-- play sound on click
  const totalLevelsInput = parseInt(document.getElementById("totalLevels").value);
  const startLevelInput = parseInt(document.getElementById("startLevel").value);
  const endLevelInput = parseInt(document.getElementById("endLevel").value);

  if (totalLevelsInput && totalLevelsInput > 0) {
    gameState.startLevel = 1;
    gameState.currentLevel = 1;
    gameState.endLevel = totalLevelsInput;
    gameState.totalLevels = totalLevelsInput;
  } else if (
    startLevelInput && endLevelInput &&
    startLevelInput > 0 &&
    endLevelInput >= startLevelInput
  ) {
    gameState.startLevel = startLevelInput;
    gameState.currentLevel = startLevelInput;
    gameState.endLevel = endLevelInput;
    gameState.totalLevels = endLevelInput - startLevelInput + 1;
  } else {
    alert("Enter valid level settings:\n- Total Levels > 0\n- OR Start Level ≤ End Level");
    return;
  }

  gameState.hands = 0;
  saveGame();
  updateGameUI();
  updateHandProgress();
  showScreen(SCREENS.game);
});

// ------------------ GAME LOGIC ------------------
let lastTapTime = 0;

handBtn.addEventListener("click", () => {
  const now = Date.now();
  if (now - lastTapTime < 250) return; // prevent rapid double taps
  lastTapTime = now;

// Play click sound
  playClickSound("sounds/hand-click.mp3");

  // Light vibration for each tap
  if ("vibrate" in navigator) navigator.vibrate(20);

  if (gameState.hands >= 20) return;

  gameState.hands++;
  updateGameUI();
  updateHandProgress();

  if (gameState.hands >= 20) {

    // Stronger vibration on level up
    if ("vibrate" in navigator) navigator.vibrate(80);

    playSound(audioLevelUp);
    levelText.classList.add("level-up-flash");
    setTimeout(() => levelText.classList.remove("level-up-flash"), 400);

    gameState.hands = 0;
    gameState.currentLevel++;

    handBtn.disabled = true;
    setTimeout(() => handBtn.disabled = false, 500);

    const finalLevel = gameState.startLevel + gameState.totalLevels - 1;

    if (gameState.currentLevel > finalLevel) {

      // Win vibration pattern
      if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);

      playSound(audioWin);
      clearGame();
      showScreen(SCREENS.win);
      return;
    }
  }

  saveGame();
});

failBtn.addEventListener("click", () => {

  if (confirm("Are you sure? This will reset the game.")) {

    if ("vibrate" in navigator) navigator.vibrate([150, 80, 150]);

    playSound(audioLose);
    clearGame();
    showScreen(SCREENS.lose);
  }
});

// ------------------ UI UPDATE ------------------
function updateGameUI() {
  levelText.textContent = `Level ${gameState.currentLevel} of ${gameState.endLevel}`;
  handText.textContent = `Hands Completed: ${gameState.hands} / 20`;
}

function updateHandProgress() {
  const progress = (gameState.hands / 20) * 100;
  document.getElementById("handProgress").style.width = `${progress}%`;
}

// ------------------ LOCAL STORAGE ------------------
function saveGame() {
  localStorage.setItem("pokerDisciplineGame", JSON.stringify(gameState));
}

function loadGame() {
  const saved = localStorage.getItem("pokerDisciplineGame");
  if (saved) {
    gameState = JSON.parse(saved);

    gameState.startLevel = gameState.startLevel || 1;
    gameState.currentLevel = gameState.currentLevel || gameState.startLevel;
    gameState.hands = gameState.hands || 0;
    gameState.totalLevels = gameState.totalLevels || 1;
    gameState.endLevel = gameState.endLevel || (gameState.startLevel + gameState.totalLevels - 1);

    updateGameUI();
    updateHandProgress();
    showScreen(SCREENS.game);
  }
}

function clearGame() {
  localStorage.removeItem("pokerDisciplineGame");
}

// ------------------ RESET GAME ------------------
function resetGame() {
  clearGame();
  showScreen(SCREENS.start);
}

// ------------------ INIT ------------------
loadGame();

// Helper to flash a button
function flashButton(btn, duration = 150) {
  btn.classList.add("level-up-flash"); // reuse the same flash animation
  setTimeout(() => btn.classList.remove("level-up-flash"), duration);
}

// ------------------ BUTTON VIBRATIONS + FLASH ------------------

// Start Game Button
startGameBtn.addEventListener("click", () => {
  vibrate(30);
  flashButton(startGameBtn);
});

// Restart / Back to Start Buttons
document.querySelectorAll("#win-screen button, #lose-screen button").forEach(btn => {
  btn.addEventListener("click", () => {
    vibrate(30);
    flashButton(btn);
  });
});

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
  Object.values(SCREENS).forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
  updateSoundButtonPosition();
}

// Update sound icon position
function updateSoundButtonPosition() {
  if (SCREENS.start.classList.contains("active")) {
    // Home screen → bottom center
    soundToggle.style.bottom = "16px";
  soundToggle.style.right = "16px";
  soundToggle.style.left = "auto";
  soundToggle.style.transform = "none";  // prevent jumping
  } else {
    // Game/Win/Lose screens → bottom right
    soundToggle.style.bottom = "16px";
    soundToggle.style.right = "16px";
    soundToggle.style.left = "auto";
    soundToggle.style.transform = "translateX(0)";
  }
}

// ------------------ START GAME ------------------
document.getElementById("startGameBtn").addEventListener("click", () => {
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
handBtn.addEventListener("click", () => {
  if (gameState.hands >= 20) return;

  gameState.hands++;
  updateGameUI();
  updateHandProgress();

  if (gameState.hands >= 20) {
    playSound(audioLevelUp);
    levelText.classList.add("level-up-flash");
    setTimeout(() => levelText.classList.remove("level-up-flash"), 400);

    gameState.hands = 0;
    gameState.currentLevel++;

    handBtn.disabled = true;
    setTimeout(() => handBtn.disabled = false, 500);

    const finalLevel = gameState.startLevel + gameState.totalLevels - 1;
    if (gameState.currentLevel > finalLevel) {
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
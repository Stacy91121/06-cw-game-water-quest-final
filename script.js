// Game configuration and state variables
const GOAL_CANS = 25;        // Total items needed to collect
let currentCans = 0;         // Current number of items collected
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;           // Holds the interval for spawning items
let timerInterval;           // Holds the interval for the countdown timer
let timeLeft = 30;           // 30-second timer

const WIN_SCORE = 20;
const winMessages = [
  "Amazing! You brought clean water to a whole village!",
  "You did it! Every drop counts!",
  "Victory! You're a water hero!",
  "Incredible! You made a real difference!",
  "Well done! Clean water for all!"
];
const loseMessages = [
  "Keep trying! Every can helps.",
  "Almost there! Give it another go.",
  "Don't give up! Water is life.",
  "Try again! The world needs water heroes.",
  "So close! Try once more."
];

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell'; // Each cell represents a grid square
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return;
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => (cell.innerHTML = ''));

  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  // 20% chance to spawn an obstacle instead of a water can
  const isObstacle = Math.random() < 0.2;

  if (isObstacle) {
    // Obstacle: mud puddle
    randomCell.innerHTML = `
      <div class="water-can-wrapper">
        <div class="mud-puddle"></div>
      </div>
    `;
    const mud = randomCell.querySelector('.mud-puddle');
    let wasClicked = false;
    if (mud) {
      mud.addEventListener('click', function handleMudClick(e) {
        if (!gameActive) return;
        wasClicked = true;
        currentCans = Math.max(0, currentCans - 2); // Reduce score by 2
        updateScore('bad');
        mud.style.pointerEvents = "none";
        setTimeout(() => {
          randomCell.innerHTML = '';
        }, 100);
      });

      setTimeout(() => {
        if (!wasClicked && gameActive) {
          randomCell.innerHTML = '';
        }
      }, 1000);
    }
  } else {
    // Water can (normal)
    randomCell.innerHTML = `
      <div class="water-can-wrapper">
        <div class="water-can"></div>
      </div>
    `;
    const can = randomCell.querySelector('.water-can');
    let wasClicked = false;
    if (can) {
      can.addEventListener('click', function handleCanClick(e) {
        if (!gameActive) return;
        wasClicked = true;
        currentCans++;
        updateScore('good');
        can.style.pointerEvents = "none";
        setTimeout(() => {
          randomCell.innerHTML = '';
        }, 100);
      });

      setTimeout(() => {
        if (!wasClicked && gameActive) {
          currentCans = Math.max(0, currentCans - 1);
          updateScore('bad');
          randomCell.innerHTML = '';
        }
      }, 1000);
    }
  }
}

// Update the score display with visual feedback
function updateScore(type) {
  const scoreElem = document.getElementById('current-cans');
  scoreElem.textContent = currentCans;
  // Visual feedback: yellow for good, red for bad
  scoreElem.style.transition = 'color 0.2s, font-size 0.2s';
  if (type === 'bad') {
    scoreElem.style.color = '#F5402C';
  } else {
    scoreElem.style.color = '#FFC907';
  }
  scoreElem.style.fontSize = '2em';
  setTimeout(() => {
    scoreElem.style.color = '';
    scoreElem.style.fontSize = '';
  }, 200);
}

// Update the timer display
function updateTimer() {
  document.getElementById('timer').textContent = timeLeft;
}

// Show end game message
function showEndMessage() {
  const achievements = document.getElementById('achievements');
  achievements.innerHTML = '';
  let msgArr, color;
  if (currentCans >= WIN_SCORE) {
    msgArr = winMessages;
    color = "#4FCB53";
    launchConfetti(); // Celebrate win!
  } else {
    msgArr = loseMessages;
    color = "#F5402C";
    removeConfetti(); // Clean up if present
  }
  const msg = msgArr[Math.floor(Math.random() * msgArr.length)];
  achievements.innerHTML = `<div style="font-size:1.3em;font-weight:bold;color:${color};margin:20px 0;text-align:center;">${msg}</div>`;
}

// --- Confetti effect ---
function launchConfetti() {
  removeConfetti();
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = 9999;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W = window.innerWidth;
  let H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;

  // Confetti particles
  const confettiColors = ['#FFC907', '#4FCB53', '#2E9DF7', '#FF902A', '#F5402C', '#FFF7E1'];
  const particles = [];
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * -H,
      r: Math.random() * 8 + 4,
      d: Math.random() * 80 + 40,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngle: 0,
      tiltAngleIncremental: (Math.random() * 0.07) + 0.05
    });
  }

  let angle = 0;
  let animationFrameId;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    angle += 0.01;
    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];
      p.y += (Math.cos(angle + p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(angle);
      p.tiltAngle += p.tiltAngleIncremental;
      p.tilt = Math.sin(p.tiltAngle) * 15;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 3);
      ctx.stroke();
    }
    animationFrameId = requestAnimationFrame(draw);
  }

  draw();

  // Remove confetti after 2.5 seconds
  setTimeout(() => {
    cancelAnimationFrame(animationFrameId);
    removeConfetti();
  }, 2500);
}

function removeConfetti() {
  const existing = document.getElementById('confetti-canvas');
  if (existing) existing.remove();
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return; // Prevent starting a new game if one is already active
  gameActive = true;
  currentCans = 0;
  timeLeft = 30;
  updateScore();
  updateTimer();
  document.getElementById('achievements').innerHTML = '';
  createGrid(); // Set up the game grid
  spawnInterval = setInterval(spawnWaterCan, 1000); // Spawn water cans every second

  // Start timer
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameActive = false; // Mark the game as inactive
  clearInterval(spawnInterval); // Stop spawning water cans
  clearInterval(timerInterval); // Stop timer
  // Remove any remaining cans
  document.querySelectorAll('.grid-cell').forEach(cell => cell.innerHTML = '');
  showEndMessage();
}

// Resets the game state and UI
function resetGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  currentCans = 0;
  timeLeft = 30;
  updateScore();
  updateTimer();
  document.getElementById('achievements').innerHTML = '';
  createGrid();
  document.querySelectorAll('.grid-cell').forEach(cell => cell.innerHTML = '');
}

// Set up click handler for the start and reset buttons
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('reset-game').addEventListener('click', resetGame);

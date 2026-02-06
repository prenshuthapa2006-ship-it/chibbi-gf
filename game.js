const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

/* ===== LOAD IMAGES ===== */

const gfImg = new Image();
gfImg.src = "gf.png";

const meImg = new Image();
meImg.src = "you.png";

const healerImg = new Image();
healerImg.src = "healer.png";

const stealerImg = new Image();
stealerImg.src = "stealer.png";

/* ===== SIZES ===== */

const PLAYER_SIZE = 120;
const ENEMY_SIZE = 110;
const BOSS_SIZE = 170;
const HEALER_SIZE = 100;
const STEALER_SIZE = 120;

/* ===== PLAYER ===== */

let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  speed: 6,
  health: 100
};

let score = 0;

/* ===== CONTROL (MOBILE + PC DRAG) ===== */

let dragging = false;

canvas.addEventListener("mousedown", () => dragging = true);
canvas.addEventListener("mouseup", () => dragging = false);

canvas.addEventListener("mousemove", e => {
  if (dragging) {
    player.x = e.clientX;
    player.y = e.clientY;
  }
});

canvas.addEventListener("touchstart", e => {
  dragging = true;
  player.x = e.touches[0].clientX;
  player.y = e.touches[0].clientY;
});

canvas.addEventListener("touchmove", e => {
  player.x = e.touches[0].clientX;
  player.y = e.touches[0].clientY;
});

canvas.addEventListener("touchend", () => dragging = false);

/* ===== ARRAYS ===== */

let enemies = [];
let bullets = [];
let boss = null;
let healer = null;
let stealer = null;

/* ===== SPAWN SYSTEM ===== */

function spawnEnemy() {
  let side = Math.floor(Math.random() * 4);
  let x, y;

  if (side === 0) { x = 0; y = Math.random() * canvas.height; }
  if (side === 1) { x = canvas.width; y = Math.random() * canvas.height; }
  if (side === 2) { x = Math.random() * canvas.width; y = 0; }
  if (side === 3) { x = Math.random() * canvas.width; y = canvas.height; }

  enemies.push({ x, y, speed: 2 + score * 0.002 });
}

setInterval(spawnEnemy, 1500);

/* ===== BOSS SPAWN ===== */

setInterval(() => {
  if (!boss && score > 20) {
    boss = {
      x: Math.random() * canvas.width,
      y: -200,
      health: 60 + score * 0.3,
      speed: 1.5
    };
  }
}, 8000);

/* ===== HEALER SPAWN ===== */

setInterval(() => {
  if (!healer) {
    healer = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height
    };
  }
}, 10000);

/* ===== STEALER SPAWN ===== */

setInterval(() => {
  if (!stealer && healer) {
    stealer = {
      x: Math.random() * canvas.width,
      y: canvas.height + 150,
      speed: 3,
      carrying: false
    };
  }
}, 6000);

/* ===== AUTO SHOOT HEARTS ===== */

setInterval(() => {
  if (!enemies.length) return;

  let nearest = enemies.reduce((a, b) =>
    Math.hypot(player.x - a.x, player.y - a.y) <
    Math.hypot(player.x - b.x, player.y - b.y) ? a : b
  );

  let angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);

  bullets.push({
    x: player.x,
    y: player.y,
    dx: Math.cos(angle) * 8,
    dy: Math.sin(angle) * 8
  });

}, 500);

/* ===== GAME LOOP ===== */

function gameLoop() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* ---- DRAW PLAYER ---- */
  ctx.drawImage(
    gfImg,
    player.x - PLAYER_SIZE / 2,
    player.y - PLAYER_SIZE / 2,
    PLAYER_SIZE,
    PLAYER_SIZE
  );

  /* ---- BULLETS ---- */
  bullets.forEach((b, i) => {

    b.x += b.dx;
    b.y += b.dy;

    ctx.shadowColor = "pink";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "pink";

    ctx.beginPath();
    ctx.arc(b.x, b.y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    if (
      b.x < -50 || b.x > canvas.width + 50 ||
      b.y < -50 || b.y > canvas.height + 50
    ) {
      bullets.splice(i, 1);
    }
  });

  /* ---- ENEMIES ---- */
  enemies.forEach((e, i) => {

    let angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed;
    e.y += Math.sin(angle) * e.speed;

    ctx.drawImage(
      meImg,
      e.x - ENEMY_SIZE / 2,
      e.y - ENEMY_SIZE / 2,
      ENEMY_SIZE,
      ENEMY_SIZE
    );

    if (Math.hypot(player.x - e.x, player.y - e.y) < 60) {
      player.health -= 0.2;
    }

    bullets.forEach((b, bi) => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < 50) {
        enemies.splice(i, 1);
        bullets.splice(bi, 1);
        score++;
      }
    });
  });

  /* ---- BOSS ---- */
  if (boss) {

    let angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    boss.x += Math.cos(angle) * boss.speed;
    boss.y += Math.sin(angle) * boss.speed;

    ctx.drawImage(
      meImg,
      boss.x - BOSS_SIZE / 2,
      boss.y - BOSS_SIZE / 2,
      BOSS_SIZE,
      BOSS_SIZE
    );

    bullets.forEach((b, bi) => {
      if (Math.hypot(b.x - boss.x, b.y - boss.y) < 60) {
        boss.health -= 5;
        bullets.splice(bi, 1);
      }
    });

    if (boss.health <= 0) {
      boss = null;
      score += 10;
    }
  }

  /* ---- HEALER ---- */
  if (healer) {
    ctx.drawImage(
      healerImg,
      healer.x - HEALER_SIZE / 2,
      healer.y - HEALER_SIZE / 2,
      HEALER_SIZE,
      HEALER_SIZE
    );

    if (Math.hypot(player.x - he

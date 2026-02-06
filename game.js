const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

/* ===== CANVAS ===== */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

canvas.style.touchAction = "none";
document.body.style.margin = 0;
document.body.style.overflow = "hidden";

/* ===== SCALE FOR MOBILE ===== */
const isMobile = window.innerWidth < 768;
const PLAYER_SIZE = isMobile ? 170 : 130;
const ENEMY_SIZE = isMobile ? 120 : 95;
const HEALER_SIZE = isMobile ? 120 : 95;
const STEALER_SIZE = isMobile ? 140 : 115;
const BOSS_SIZE = isMobile ? 220 : 180;

/* ===== IMAGES ===== */
const gfImg = new Image(); gfImg.src = "gf.png";
const enemyImg = new Image(); enemyImg.src = "you.png";
const healerImg = new Image(); healerImg.src = "healer.png";
const stealerImg = new Image(); stealerImg.src = "stealer.png";

/* ===== PLAYER ===== */
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  health: 100
};

let targetX = player.x;
let targetY = player.y;

window.addEventListener("mousemove", e => {
  targetX = e.clientX;
  targetY = e.clientY;
});

canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  targetX = t.clientX;
  targetY = t.clientY;
});

/* ===== GAME STATE ===== */
let enemies = [];
let bullets = [];
let healer = null;
let stealer = null;
let boss = null;
let score = 0;
let gameOver = false;

/* ===== SPAWN CONTROL (NO STACKING) ===== */
let enemySpawnTimer = 0;
let healerSpawnTimer = 0;
let bossSpawnTimer = 0;

/* ===== GAME LOOP ===== */
function gameLoop(timestamp) {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* TIMER SYSTEM */
  enemySpawnTimer++;
  healerSpawnTimer++;
  bossSpawnTimer++;

  /* ===== ENEMY SPAWN ===== */
  if (enemySpawnTimer > 60) {
    enemySpawnTimer = 0;

    let side = Math.floor(Math.random() * 4);
    let x, y;

    if (side === 0) { x = 0; y = Math.random() * canvas.height; }
    if (side === 1) { x = canvas.width; y = Math.random() * canvas.height; }
    if (side === 2) { x = Math.random() * canvas.width; y = 0; }
    if (side === 3) { x = Math.random() * canvas.width; y = canvas.height; }

    enemies.push({
      x,
      y,
      speed: 1.5 + score * 0.003
    });
  }

  /* ===== HEALER + STEALER SPAWN ===== */
  if (healerSpawnTimer > 600 && !healer && !stealer) {
    healerSpawnTimer = 0;

    healer = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height
    };

    stealer = {
      x: Math.random() < 0.5 ? 0 : canvas.width,
      y: Math.random() * canvas.height,
      speed: 3,
      carrying: false
    };
  }

  /* ===== BOSS SPAWN ===== */
  if (score > 15 && bossSpawnTimer > 900 && !boss) {
    bossSpawnTimer = 0;

    boss = {
      x: Math.random() * canvas.width,
      y: -200,
      health: 40,
      speed: 1.4
    };
  }

  /* ===== PLAYER MOVE ===== */
  player.x += (targetX - player.x) * 0.15;
  player.y += (targetY - player.y) * 0.15;

  player.x = Math.max(PLAYER_SIZE/2, Math.min(canvas.width - PLAYER_SIZE/2, player.x));
  player.y = Math.max(PLAYER_SIZE/2, Math.min(canvas.height - PLAYER_SIZE/2, player.y));

  ctx.drawImage(gfImg, player.x - PLAYER_SIZE/2, player.y - PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);

  /* ===== ENEMIES ===== */
  enemies = enemies.filter(e => {
    let angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed;
    e.y += Math.sin(angle) * e.speed;

    ctx.drawImage(enemyImg, e.x - ENEMY_SIZE/2, e.y - ENEMY_SIZE/2, ENEMY_SIZE, ENEMY_SIZE);

    if (Math.hypot(e.x - player.x, e.y - player.y) < ENEMY_SIZE/2) {
      player.health -= 0.3;
    }

    return true;
  });

  /* ===== HEALER + STEALER LOGIC (FREEZE FIXED) ===== */

if (stealer) {

  // If healer exists and not carrying
  if (healer && !stealer.carrying && !stealer.escaping) {

    let angle = Math.atan2(healer.y - stealer.y, healer.x - stealer.x);
    stealer.x += Math.cos(angle) * stealer.speed;
    stealer.y += Math.sin(angle) * stealer.speed;

    if (Math.hypot(stealer.x - healer.x, stealer.y - healer.y) < 50) {
      stealer.carrying = true;
      stealer.escaping = true;
      healer = null;
    }
  }

  // If escaping with healer
  if (stealer.escaping) {
    stealer.y -= 6;
  }

  // If attacking player
  if (!stealer.carrying && !stealer.escaping) {
    let angle = Math.atan2(player.y - stealer.y, player.x - stealer.x);
    stealer.x += Math.cos(angle) * stealer.speed;
    stealer.y += Math.sin(angle) * stealer.speed;

    if (Math.hypot(stealer.x - player.x, stealer.y - player.y) < 60) {
      player.health -= 0.6;
    }
  }

  // DRAW
  ctx.drawImage(
    stealerImg,
    stealer.x - STEALER_SIZE / 2,
    stealer.y - STEALER_SIZE / 2,
    STEALER_SIZE,
    STEALER_SIZE
  );

  // SAFE CLEANUP (end of logic)
  if (stealer.y < -STEALER_SIZE - 50) {
    stealer = null;
  }
}


/* ===== HEALER ===== */
if (healer) {
  ctx.drawImage(
    healerImg,
    healer.x - HEALER_SIZE / 2,
    healer.y - HEALER_SIZE / 2,
    HEALER_SIZE,
    HEALER_SIZE
  );

  if (Math.hypot(player.x - healer.x, player.y - healer.y) < 60) {
    player.health = Math.min(100, player.health + 35);
    healer = null;
    stealer = null;
  }
}


  /* ===== BOSS ===== */
  if (boss) {
    let angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    boss.x += Math.cos(angle) * boss.speed;
    boss.y += Math.sin(angle) * boss.speed;

    ctx.drawImage(enemyImg, boss.x - BOSS_SIZE/2, boss.y - BOSS_SIZE/2, BOSS_SIZE, BOSS_SIZE);

    if (Math.hypot(boss.x - player.x, boss.y - player.y) < 80) {
      player.health -= 0.5;
    }

    if (boss.health <= 0) {
      boss = null;
      score += 20;
    }
  }

  /* ===== AUTO HEART SHOOT ===== */
  if (Math.random() < 0.03) {
    let angle = Math.random() * Math.PI * 2;
    bullets.push({
      x: player.x,
      y: player.y,
      dx: Math.cos(angle) * 6,
      dy: Math.sin(angle) * 6
    });
  }

  bullets = bullets.filter(b => {
    b.x += b.dx;
    b.y += b.dy;

    ctx.font = isMobile ? "30px Arial" : "24px Arial";
    ctx.fillText("💖", b.x, b.y);

    enemies.forEach((e, i) => {
      if (Math.hypot(e.x - b.x, e.y - b.y) < 40) {
        enemies.splice(i, 1);
        score++;
      }
    });

    if (boss && Math.hypot(boss.x - b.x, boss.y - b.y) < 80) {
      boss.health--;
    }

    return b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height;
  });

  /* ===== UI ===== */
  ctx.fillStyle = "white";
  ctx.font = isMobile ? "28px Arial" : "22px Arial";
  ctx.fillText("Score: " + score, 20, 40);

  ctx.fillStyle = "red";
  ctx.fillRect(20, 60, 200, 15);
  ctx.fillStyle = "lime";
  ctx.fillRect(20, 60, player.health * 2, 15);

  if (player.health <= 0) {
    gameOver = true;
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER 💔", canvas.width / 2 - 150, canvas.height / 2);
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

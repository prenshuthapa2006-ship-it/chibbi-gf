const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// IMAGES
const playerImg = new Image();
playerImg.src = "gf.png";

const enemyImg = new Image();
enemyImg.src = "you.png";

// GAME STATE
let bullets = [];
let enemies = [];
let gameOver = false;

// PLAYER
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 140
};

// AIM POSITION
let aimX = player.x;
let aimY = player.y;

// 💖 HEART BULLET
function drawHeart(x, y, s) {
  ctx.fillStyle = "hotpink";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - s, y - s, x - s * 2, y + s / 2, x, y + s);
  ctx.bezierCurveTo(x + s * 2, y + s / 2, x + s, y - s, x, y);
  ctx.fill();
}

// 👿 SPAWN ENEMY (NORMAL / BOSS)
function spawnEnemy(isBoss = false) {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  if (side === 0) { x = Math.random() * canvas.width; y = -120; }
  else if (side === 1) { x = Math.random() * canvas.width; y = canvas.height + 120; }
  else if (side === 2) { x = -120; y = Math.random() * canvas.height; }
  else { x = canvas.width + 120; y = Math.random() * canvas.height; }

  enemies.push({
    x,
    y,
    size: isBoss ? 200 : 110,
    speed: isBoss ? 0.8 : 1.6,
    boss: isBoss
  });
}

// 🖱️ DESKTOP MOVE + AIM
window.addEventListener("mousemove", e => {
  player.x = e.clientX;
  player.y = e.clientY;
  aimX = e.clientX;
  aimY = e.clientY;
});

// 📱 MOBILE MOVE (DRAG)
canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  player.x = t.clientX;
  player.y = t.clientY;
});

// 🔫 SHOOT ANY DIRECTION
function shoot(x, y) {
  if (gameOver) {
    bullets = [];
    enemies = [];
    gameOver = false;
    return;
  }

  const angle = Math.atan2(y - player.y, x - player.x);

  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle) * 10,
    vy: Math.sin(angle) * 10,
    size: 12
  });
}

// 🖱️ DESKTOP SHOOT
canvas.addEventListener("click", e => {
  shoot(e.clientX, e.clientY);
});

// 📱 MOBILE SHOOT (TAP)
canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  shoot(t.clientX, t.clientY);
});

// 🔄 GAME LOOP
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    // PLAYER
    ctx.shadowColor = "hotpink";
    ctx.shadowBlur = 30;
    ctx.drawImage(
      playerImg,
      player.x - player.size / 2,
      player.y - player.size / 2,
      player.size,
      player.size
    );
    ctx.shadowBlur = 0;

    // BULLETS
    bullets.forEach((b, bi) => {
      b.x += b.vx;
      b.y += b.vy;
      drawHeart(b.x, b.y, b.size);

      if (
        b.x < -50 || b.x > canvas.width + 50 ||
        b.y < -50 || b.y > canvas.height + 50
      ) bullets.splice(bi, 1);
    });

    // ENEMIES (CHASE PLAYER)
    enemies.forEach((e, ei) => {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);

      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;

      ctx.shadowColor = e.boss ? "purple" : "red";
      ctx.shadowBlur = e.boss ? 35 : 20;
      ctx.drawImage(
        enemyImg,
        e.x - e.size / 2,
        e.y - e.size / 2,
        e.size,
        e.size
      );
      ctx.shadowBlur = 0;

      // PLAYER HIT
      if (dist < e.size / 2 + player.size / 2) {
        gameOver = true;
      }

      // BULLET HIT
      bullets.forEach((b, bi) => {
        if (Math.hypot(e.x - b.x, e.y - b.y) < e.size / 2) {
          enemies.splice(ei, 1);
          bullets.splice(bi, 1);
        }
      });
    });

    // SPAWNS
    if (Math.random() < 0.02) spawnEnemy(false);
    if (Math.random() < 0.002) spawnEnemy(true); // 👑 BOSS
  }

  // GAME OVER
  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "42px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "GAME OVER 💔 Tap / Click to Restart",
      canvas.width / 2,
      canvas.height / 2
    );
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();

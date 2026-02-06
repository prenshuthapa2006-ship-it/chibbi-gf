const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// IMAGES
const playerImg = new Image();
playerImg.src = "gf.png";
const enemyImg = new Image();
enemyImg.src = "me.png";

// GAME STATE
let bullets = [];
let enemies = [];
let score = 0;
let gameOver = false;

// PLAYER
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 140
};

// 💖 HEART BULLET
function drawHeart(x, y, s) {
  ctx.fillStyle = "hotpink";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - s, y - s, x - s * 2, y + s / 2, x, y + s);
  ctx.bezierCurveTo(x + s * 2, y + s / 2, x + s, y - s, x, y);
  ctx.fill();
}

// 🔫 AUTO SHOOT (toward nearest enemy)
setInterval(() => {
  if (gameOver || enemies.length === 0) return;

  const target = enemies[0];
  const angle = Math.atan2(target.y - player.y, target.x - player.x);

  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle) * 9,
    vy: Math.sin(angle) * 9,
    size: 12
  });
}, 250);

// 👿 SPAWN ENEMY / BOSS
function spawnEnemy(isBoss = false) {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  if (side === 0) { x = Math.random() * canvas.width; y = -150; }
  else if (side === 1) { x = Math.random() * canvas.width; y = canvas.height + 150; }
  else if (side === 2) { x = -150; y = Math.random() * canvas.height; }
  else { x = canvas.width + 150; y = Math.random() * canvas.height; }

  enemies.push({
    x,
    y,
    size: isBoss ? 220 : 110,
    speed: isBoss ? 0.7 : 1.6,
    hp: isBoss ? 5 : 1,
    boss: isBoss
  });
}

// 🖱️ PC MOVE
window.addEventListener("mousemove", e => {
  player.x = e.clientX;
  player.y = e.clientY;
});

// 📱 MOBILE MOVE
canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  player.x = t.clientX;
  player.y = t.clientY;
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
        b.x < -60 || b.x > canvas.width + 60 ||
        b.y < -60 || b.y > canvas.height + 60
      ) bullets.splice(bi, 1);
    });

    // ENEMIES
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

      // COLLISION WITH PLAYER
      if (dist < e.size / 2 + player.size / 2) {
        gameOver = true;
      }

      // HIT BY BULLET
      bullets.forEach((b, bi) => {
        if (Math.hypot(e.x - b.x, e.y - b.y) < e.size / 2) {
          e.hp--;
          bullets.splice(bi, 1);

          if (e.hp <= 0) {
            score += e.boss ? 10 : 1;
            enemies.splice(ei, 1);
          }
        }
      });
    });

    // SPAWN RATE
    if (Math.random() < 0.02) spawnEnemy(false);
    if (Math.random() < 0.002) spawnEnemy(true);
  }

  // 🧮 SCORE BAR
  ctx.fillStyle = "white";
  ctx.font = "22px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 20, 35);

  // GAME OVER
  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "42px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "GAME OVER 💔 Tap to Restart",
      canvas.width / 2,
      canvas.height / 2
    );
  }

  requestAnimationFrame(gameLoop);
}

// RESTART
canvas.addEventListener("touchstart", () => {
  if (gameOver) {
    bullets = [];
    enemies = [];
    score = 0;
    gameOver = false;
  }
});

canvas.addEventListener("click", () => {
  if (gameOver) {
    bullets = [];
    enemies = [];
    score = 0;
    gameOver = false;
  }
});

gameLoop();

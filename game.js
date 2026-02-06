const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// AUDIO
const bgm = new Audio("bgm.mp3");
bgm.loop = true;
bgm.volume = 0.4;
let musicOn = false;

document.getElementById("musicBtn").onclick = () => {
  musicOn = !musicOn;
  musicOn ? bgm.play() : bgm.pause();
};

// IMAGES
const playerImg = new Image();
playerImg.src = "gf.png";

const enemyImg = new Image();
enemyImg.src = "you.png";

const healerImg = new Image();
healerImg.src = "healer.png";

const stealerImg = new Image();
stealerImg.src = "stealer.png";

// GAME STATE
let bullets = [];
let enemies = [];
let healer = null;
let stealer = null;
let score = 0;
let health = 100;
let gameOver = false;

// PLAYER
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 130
};

// MOVEMENT
window.addEventListener("mousemove", e => {
  player.x = e.clientX;
  player.y = e.clientY;
});

canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  player.x = t.clientX;
  player.y = t.clientY;
});

// HEART DRAW
function drawHeart(x, y, s) {
  ctx.fillStyle = "hotpink";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - s, y - s, x - s * 2, y + s / 2, x, y + s);
  ctx.bezierCurveTo(x + s * 2, y + s / 2, x + s, y - s, x, y);
  ctx.fill();
}

// AUTO SHOOT
setInterval(() => {
  if (gameOver || enemies.length === 0) return;

  const target = enemies[0];
  const angle = Math.atan2(target.y - player.y, target.x - player.x);

  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle) * 8,
    vy: Math.sin(angle) * 8,
    size: 10
  });
}, 300);

// ENEMY SPAWN
function spawnEnemy(isBoss = false) {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  if (side === 0) { x = Math.random() * canvas.width; y = -100; }
  else if (side === 1) { x = Math.random() * canvas.width; y = canvas.height + 100; }
  else if (side === 2) { x = -100; y = Math.random() * canvas.height; }
  else { x = canvas.width + 100; y = Math.random() * canvas.height; }

  enemies.push({
    x,
    y,
    size: isBoss ? 200 : 100,
    speed: isBoss ? 0.8 : 1.6,
    hp: isBoss ? 5 : 1,
    boss: isBoss
  });
}

// HEALER SPAWN
function spawnHealer() {
  healer = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 90
  };

  stealer = {
    x: 0,
    y: 0,
    size: 90,
    speed: 2
  };
}

setInterval(() => {
  if (!healer && !gameOver) spawnHealer();
}, 15000);

// LOOP
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {

    // PLAYER
    ctx.drawImage(playerImg,
      player.x - player.size / 2,
      player.y - player.size / 2,
      player.size,
      player.size
    );

    // BULLETS
    bullets.forEach((b, bi) => {
      b.x += b.vx;
      b.y += b.vy;
      drawHeart(b.x, b.y, b.size);
    });

    // ENEMIES
    enemies.forEach((e, ei) => {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);

      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;

      ctx.drawImage(enemyImg,
        e.x - e.size / 2,
        e.y - e.size / 2,
        e.size,
        e.size
      );

      if (dist < e.size / 2 + player.size / 2) {
        health -= 0.5;
      }

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

    // HEALER
    if (healer) {
      ctx.drawImage(healerImg,
        healer.x - healer.size / 2,
        healer.y - healer.size / 2,
        healer.size,
        healer.size
      );

      if (Math.hypot(player.x - healer.x, player.y - healer.y) < 70) {
        health = Math.min(100, health + 30);
        healer = null;
        stealer = null;
      }
    }

    // STEALER TAKES HEALER
    if (stealer && healer) {
      const dx = healer.x - stealer.x;
      const dy = healer.y - stealer.y;
      const dist = Math.hypot(dx, dy);

      stealer.x += (dx / dist) * stealer.speed;
      stealer.y += (dy / dist) * stealer.speed;

      ctx.drawImage(stealerImg,
        stealer.x - stealer.size / 2,
        stealer.y - stealer.size / 2,
        stealer.size,
        stealer.size
      );

      if (dist < 40) {
        healer = null;
        stealer = null;
      }
    }

    if (Math.random() < 0.02) spawnEnemy();
    if (Math.random() < 0.002) spawnEnemy(true);

    if (health <= 0) gameOver = true;
  }

  // UI
  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Health: " + Math.floor(health), 20, 55);

  if (gameOver) {
    ctx.font = "40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER 💔 Tap to Restart",
      canvas.width / 2,
      canvas.height / 2);
  }

  requestAnimationFrame(gameLoop);
}

canvas.addEventListener("click", restart);
canvas.addEventListener("touchstart", restart);

function restart() {
  if (!gameOver) return;
  bullets = [];
  enemies = [];
  score = 0;
  health = 100;
  healer = null;
  stealer = null;
  gameOver = false;
}

gameLoop();






const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================= MOBILE SAFE SETTINGS =================
document.body.style.margin = 0;
document.body.style.overflow = "hidden";
canvas.style.touchAction = "none";

// ================= CANVAS RESIZE =================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ================= IMAGES =================
const gfImg = new Image();
gfImg.src = "gf.png";

const enemyImg = new Image();
enemyImg.src = "me.png";

const stealerImg = new Image();
stealerImg.src = "stealer.png";

const healerImg = new Image();
healerImg.src = "healer.png";

// ================= PLAYER =================
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 95,
  health: 100
};

let targetX = player.x;
let targetY = player.y;

// Detect mobile
const isMobile = window.innerWidth < 768;

// Smooth Control (PC)
window.addEventListener("mousemove", e => {
  targetX = e.clientX;
  targetY = e.clientY;
});

// Smooth Control (Mobile)
canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  targetX = t.clientX;
  targetY = t.clientY;
});

canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  targetX = t.clientX;
  targetY = t.clientY;
});

// ================= GAME DATA =================
let enemies = [];
let bullets = [];
let healer = null;
let stealer = null;
let score = 0;
let gameOver = false;

// ================= SPAWN ENEMY =================
function spawnEnemy() {
  let side = Math.floor(Math.random() * 4);
  let x, y;

  if (side === 0) { x = 0; y = Math.random() * canvas.height; }
  if (side === 1) { x = canvas.width; y = Math.random() * canvas.height; }
  if (side === 2) { x = Math.random() * canvas.width; y = 0; }
  if (side === 3) { x = Math.random() * canvas.width; y = canvas.height; }

  enemies.push({
    x,
    y,
    size: 75,
    speed: isMobile ? 4 : 4.5
  });
}

// ================= SPAWN HEALER =================
function spawnHealer() {
  healer = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 85
  };

  stealer = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 85,
    speed: isMobile ? 3 : 3.5
  };
}

// ================= AUTO SHOOT =================
setInterval(() => {
  if (gameOver) return;

  if (bullets.length > 35) bullets.shift();

  let closest = null;
  let minDist = Infinity;

  enemies.forEach(e => {
    let dist = Math.hypot(e.x - player.x, e.y - player.y);
    if (dist < minDist) {
      minDist = dist;
      closest = e;
    }
  });

  if (closest) {
    let angle = Math.atan2(closest.y - player.y, closest.x - player.x);
    bullets.push({
      x: player.x,
      y: player.y,
      dx: Math.cos(angle) * 8,
      dy: Math.sin(angle) * 8
    });
  }
}, 250);

// ================= GAME LOOP =================
function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Smooth movement
  let smooth = isMobile ? 0.22 : 0.18;
  player.x += (targetX - player.x) * smooth;
  player.y += (targetY - player.y) * smooth;

  // Keep inside screen
  player.x = Math.max(player.size/2, Math.min(canvas.width - player.size/2, player.x));
  player.y = Math.max(player.size/2, Math.min(canvas.height - player.size/2, player.y));

  // Draw Player
  ctx.drawImage(
    gfImg,
    player.x - player.size/2,
    player.y - player.size/2,
    player.size,
    player.size
  );

  // Spawn enemies (optimized for mobile)
  let spawnRate = isMobile ? 0.012 : 0.02;
  if (Math.random() < spawnRate) spawnEnemy();

  // ===== ENEMIES =====
  enemies.forEach((e, i) => {
    let angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed;
    e.y += Math.sin(angle) * e.speed;

    ctx.drawImage(
      enemyImg,
      e.x - e.size/2,
      e.y - e.size/2,
      e.size,
      e.size
    );

    if (Math.hypot(e.x - player.x, e.y - player.y) < e.size/2) {
      player.health -= 0.5;
    }
  });

  // ===== BULLETS =====
  bullets.forEach((b, bi) => {
    b.x += b.dx;
    b.y += b.dy;

    ctx.fillStyle = "pink";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
    ctx.fill();

    enemies.forEach((e, ei) => {
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.size/2) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score++;
      }
    });
  });

  // ===== HEALER + STEALER =====
  if (!healer && Math.random() < 0.0012) spawnHealer();

  if (healer) {
    ctx.drawImage(
      healerImg,
      healer.x - healer.size/2,
      healer.y - healer.size/2,
      healer.size,
      healer.size
    );

    if (Math.hypot(healer.x - player.x, healer.y - player.y) < healer.size/2) {
      player.health = Math.min(100, player.health + 35);
      healer = null;
      stealer = null;
    }
  }

  if (stealer && healer) {
    let angle = Math.atan2(healer.y - stealer.y, healer.x - stealer.x);
    stealer.x += Math.cos(angle) * stealer.speed;
    stealer.y += Math.sin(angle) * stealer.speed;

    ctx.drawImage(
      stealerImg,
      stealer.x - stealer.size/2,
      stealer.y - stealer.size/2,
      stealer.size,
      stealer.size
    );

    if (Math.hypot(stealer.x - healer.x, stealer.y - healer.y) < stealer.size/2) {
      healer = null;
      stealer = null;
    }
  }

  // ===== UI =====
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 20, 30);

  ctx.fillStyle = "red";
  ctx.fillRect(20, 50, 200, 15);

  ctx.fillStyle = "lime";
  ctx.fillRect(20, 50, player.health * 2, 15);

  // ===== GAME OVER =====
  if (player.health <= 0) {
    gameOver = true;
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", canvas.width/2 - 120, canvas.height/2);
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();

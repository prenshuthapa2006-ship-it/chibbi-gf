const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const music = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
canvas.style.touchAction = "none";
document.body.style.margin = 0;
document.body.style.overflow = "hidden";

let musicPlaying = false;
musicBtn.onclick = () => {
  if (!musicPlaying) {
    music.play();
    musicBtn.innerText = "🔈 Mute";
  } else {
    music.pause();
    musicBtn.innerText = "🔊 Music";
  }
  musicPlaying = !musicPlaying;
};

// ===== IMAGES =====
const gfImg = new Image(); gfImg.src = "gf.png";
const enemyImg = new Image(); enemyImg.src = "you.png";
const healerImg = new Image(); healerImg.src = "healer.png";
const stealerImg = new Image(); stealerImg.src = "stealer.png";

// ===== PLAYER =====
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 120,
  health: 100,
  shield: false,
  shieldTimer: 0
};

let targetX = player.x;
let targetY = player.y;
const isMobile = window.innerWidth < 768;

window.addEventListener("mousemove", e => {
  targetX = e.clientX;
  targetY = e.clientY;
});

canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  targetX = t.clientX;
  targetY = t.clientY;
});

// ===== GAME DATA =====
let enemies = [];
let bullets = [];
let healer = null;
let stealer = null;
let score = 0;
let gameOver = false;

// ===== ENEMY SPAWN (BALANCED) =====
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
    size: 90,
    speed: 1.5 + score * 0.02
  });
}

// ===== HEALER SPAWN =====
function spawnHealer() {
  healer = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 80
  };
}

// ===== STEALER SPAWN =====
function spawnStealer() {
  stealer = {
    x: Math.random() * canvas.width,
    y: 0,
    size: 90,
    speed: 2
  };
}

// ===== AUTO HEART SHOOT =====
setInterval(() => {
  if (gameOver) return;
  if (bullets.length > 20) bullets.shift();

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
      dx: Math.cos(angle) * 6,
      dy: Math.sin(angle) * 6
    });
  }
}, 400);

// ===== GAME LOOP =====
function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let smooth = isMobile ? 0.22 : 0.15;
  player.x += (targetX - player.x) * smooth;
  player.y += (targetY - player.y) * smooth;

  player.x = Math.max(player.size/2, Math.min(canvas.width - player.size/2, player.x));
  player.y = Math.max(player.size/2, Math.min(canvas.height - player.size/2, player.y));

  ctx.drawImage(gfImg, player.x - 60, player.y - 60, 120, 120);

  // Shield
  if (player.shield) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, 80, 0, Math.PI * 2);
    ctx.strokeStyle = "hotpink";
    ctx.lineWidth = 5;
    ctx.stroke();

    player.shieldTimer--;
    if (player.shieldTimer <= 0) player.shield = false;
  }

  // Spawn enemies slowly
  if (Math.random() < 0.015) spawnEnemy();

  enemies.forEach((e, i) => {
    let angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed;
    e.y += Math.sin(angle) * e.speed;

    ctx.drawImage(enemyImg, e.x - 45, e.y - 45, 90, 90);

    if (!player.shield && Math.hypot(e.x - player.x, e.y - player.y) < 50) {
      player.health -= 0.3;
    }
  });

  // ===== HEALER LOGIC =====
  if (!healer && Math.random() < 0.002) spawnHealer();

  if (healer) {
    ctx.drawImage(healerImg, healer.x - 40, healer.y - 40, 80, 80);

    if (Math.hypot(player.x - healer.x, player.y - healer.y) < 60) {
      player.health = Math.min(100, player.health + 30);
      healer = null;
    }
  }

  // ===== STEALER LOGIC =====
  if (healer && !stealer && Math.random() < 0.005) spawnStealer();

  if (stealer) {
    let angle = healer
      ? Math.atan2(healer.y - stealer.y, healer.x - stealer.x)
      : Math.atan2(player.y - stealer.y, player.x - stealer.x);

    stealer.x += Math.cos(angle) * stealer.speed;
    stealer.y += Math.sin(angle) * stealer.speed;

    ctx.drawImage(stealerImg, stealer.x - 45, stealer.y - 45, 90, 90);

    if (healer && Math.hypot(stealer.x - healer.x, stealer.y - healer.y) < 50) {
      healer = null; // steals healer
      stealer = null;
    }
  }

  // ===== HEART BULLETS =====
  bullets.forEach((b, bi) => {
    b.x += b.dx;
    b.y += b.dy;

    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bullets.splice(bi, 1);
      return;
    }

    ctx.font = "22px Arial";
    ctx.fillText("💖", b.x - 10, b.y + 10);

    enemies.forEach((e, ei) => {
      if (Math.hypot(e.x - b.x, e.y - b.y) < 45) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score++;
      }
    });
  });

  // UI
  ctx.fillStyle = "white";
  ctx.font = "22px Arial";
  ctx.fillText("Score: " + score, 20, 30);

  ctx.fillStyle = "red";
  ctx.fillRect(20, 50, 200, 15);

  ctx.fillStyle = "lime";
  ctx.fillRect(20, 50, player.health * 2, 15);

  if (player.health <= 0) {
    gameOver = true;
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER 💔", canvas.width/2 - 140, canvas.height/2);
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();

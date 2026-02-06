const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const music = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");

// ===== CANVAS =====
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
canvas.style.touchAction = "none";
document.body.style.margin = 0;
document.body.style.overflow = "hidden";

// ===== MUSIC =====
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
const gfImg = new Image();
gfImg.src = "gf.png";

const enemyImg = new Image();
enemyImg.src = "you.png";

const healerImg = new Image();
healerImg.src = "healer.png";

const stealerImg = new Image();
stealerImg.src = "stealer.png";

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

// ===== CONTROLS =====
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
let boss = null;
let loveShieldDrop = null;
let score = 0;
let gameOver = false;

// ===== SPAWN ENEMY =====
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
    speed: 2 + score * 0.05
  });
}

// ===== SPAWN BOSS =====
function spawnBoss() {
  boss = {
    x: Math.random() * canvas.width,
    y: -150,
    size: 180,
    health: 40,
    speed: 1.5 + score * 0.03
  };
}

// ===== AUTO SHOOT HEARTS =====
setInterval(() => {
  if (gameOver) return;

  if (bullets.length > 30) bullets.shift();

  let closest = null;
  let minDist = Infinity;

  enemies.forEach(e => {
    let dist = Math.hypot(e.x - player.x, e.y - player.y);
    if (dist < minDist) {
      minDist = dist;
      closest = e;
    }
  });

  if (boss) closest = boss;

  if (closest) {
    let angle = Math.atan2(closest.y - player.y, closest.x - player.x);
    bullets.push({
      x: player.x,
      y: player.y,
      dx: Math.cos(angle) * 7,
      dy: Math.sin(angle) * 7
    });
  }
}, 300);

// ===== GAME LOOP =====
function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Smooth Movement
  let smooth = isMobile ? 0.25 : 0.18;
  player.x += (targetX - player.x) * smooth;
  player.y += (targetY - player.y) * smooth;

  player.x = Math.max(player.size/2, Math.min(canvas.width - player.size/2, player.x));
  player.y = Math.max(player.size/2, Math.min(canvas.height - player.size/2, player.y));

  // Draw player
  ctx.drawImage(gfImg, player.x - 60, player.y - 60, 120, 120);

  // Shield effect
  if (player.shield) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, 80, 0, Math.PI * 2);
    ctx.strokeStyle = "pink";
    ctx.lineWidth = 6;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "hotpink";
    ctx.stroke();
    ctx.shadowBlur = 0;

    player.shieldTimer--;
    if (player.shieldTimer <= 0) {
      player.shield = false;
    }
  }

  // Spawn enemies
  if (Math.random() < 0.02 + score * 0.0005) spawnEnemy();

  enemies.forEach((e, i) => {
    let angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed;
    e.y += Math.sin(angle) * e.speed;

    ctx.drawImage(enemyImg, e.x - 45, e.y - 45, 90, 90);

    if (!player.shield && Math.hypot(e.x - player.x, e.y - player.y) < 50) {
      player.health -= 0.5;
    }
  });

  // Boss logic
  if (score > 20 && !boss) spawnBoss();

  if (boss) {
    let angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    boss.x += Math.cos(angle) * boss.speed;
    boss.y += Math.sin(angle) * boss.speed;

    ctx.drawImage(enemyImg, boss.x - 90, boss.y - 90, 180, 180);

    if (!player.shield && Math.hypot(boss.x - player.x, boss.y - player.y) < 90) {
      player.health -= 1;
    }

    if (boss.health <= 0) {
      boss = null;
      score += 15;
    }
  }

  // Rare Love Shield Drop
  if (!loveShieldDrop && Math.random() < 0.0005) {
    loveShieldDrop = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 50
    };
  }

  if (loveShieldDrop) {
    ctx.font = "40px Arial";
    ctx.fillText("🛡", loveShieldDrop.x, loveShieldDrop.y);

    if (Math.hypot(player.x - loveShieldDrop.x, player.y - loveShieldDrop.y) < 60) {
      player.shield = true;
      player.shieldTimer = 300; // ~5 seconds
      loveShieldDrop = null;
    }
  }

  // Bullets (Hearts)
  bullets.forEach((b, bi) => {
    b.x += b.dx;
    b.y += b.dy;

    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bullets.splice(bi, 1);
      return;
    }

    ctx.shadowBlur = 20;
    ctx.shadowColor = "pink";
    ctx.font = "20px Arial";
    ctx.fillText("💖", b.x - 10, b.y + 10);
    ctx.shadowBlur = 0;

    enemies.forEach((e, ei) => {
      if (Math.hypot(e.x - b.x, e.y - b.y) < 45) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score++;
      }
    });

    if (boss && Math.hypot(boss.x - b.x, boss.y - b.y) < 90) {
      boss.health--;
      bullets.splice(bi, 1);
    }
  });

  // UI
  ctx.fillStyle = "white";
  ctx.font = "22px Arial";
  ctx.fillText("Score: " + score, 20, 30);

  ctx.fillStyle = "red";
  ctx.fillRect(20, 50, 200, 18);

  ctx.fillStyle = "lime";
  ctx.fillRect(20, 50, player.health * 2, 18);

  if (player.health <= 0) {
    gameOver = true;
    ctx.fillStyle = "white";
    ctx.font = "45px Arial";
    ctx.fillText("GAME OVER 💔", canvas.width/2 - 150, canvas.height/2);
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();

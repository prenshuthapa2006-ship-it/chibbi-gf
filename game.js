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

// ===== MUSIC BUTTON =====
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

const stealerImg = new Image();
stealerImg.src = "stealer.png";

const healerImg = new Image();
healerImg.src = "healer.png";

// ===== PLAYER =====
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 90,
  health: 100
};

let targetX = player.x;
let targetY = player.y;

const isMobile = window.innerWidth < 768;

// Controls
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
    size: 70,
    speed: isMobile ? 4 : 4.5
  });
}

// ===== SPAWN HEALER =====
function spawnHealer() {
  healer = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 80
  };

  stealer = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 80,
    speed: isMobile ? 3 : 3.5
  };
}

// ===== AUTO SHOOT =====
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

// ===== GAME LOOP =====
function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Smooth movement
  let smooth = isMobile ? 0.22 : 0.18;
  player.x += (targetX - player.x) * smooth;
  player.y += (targetY - player.y) * smooth;

  player.x = Math.max(player.size/2, Math.min(canvas.width - player.size/2, player.x));
  player.y = Math.max(player.size/2, Math.min(canvas.height - player.size/2, player.y));

  ctx.drawImage(gfImg, player.x - 45, player.y - 45, 90, 90);

  if (Math.random() < (isMobile ? 0.012 : 0.02)) spawnEnemy();

  enemies.forEach((e, i) => {
    let angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed;
    e.y += Math.sin(angle) * e.speed;

    ctx.drawImage(enemyImg, e.x - 35, e.y - 35, 70, 70);

    if (Math.hypot(e.x - player.x, e.y - player.y) < 35) {
      player.health -= 0.5;
    }
  });

  bullets.forEach((b, bi) => {
    b.x += b.dx;
    b.y += b.dy;

    ctx.fillStyle = "pink";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
    ctx.fill();

    enemies.forEach((e, ei) => {
      if (Math.hypot(e.x - b.x, e.y - b.y) < 35) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score++;
      }
    });
  });

  if (!healer && Math.random() < 0.0012) spawnHealer();

  if (healer) {
    ctx.drawImage(healerImg, healer.x - 40, healer.y - 40, 80, 80);

    if (Math.hypot(healer.x - player.x, healer.y - player.y) < 40) {
      player.health = Math.min(100, player.health + 35);
      healer = null;
      stealer = null;
    }
  }

  if (stealer && healer) {
    let angle = Math.atan2(healer.y - stealer.y, healer.x - stealer.x);
    stealer.x += Math.cos(angle) * stealer.speed;
    stealer.y += Math.sin(angle) * stealer.speed;

    ctx.drawImage(stealerImg, stealer.x - 40, stealer.y - 40, 80, 80);

    if (Math.hypot(stealer.x - healer.x, stealer.y - healer.y) < 40) {
      healer = null;
      stealer = null;
    }
  }

  // UI
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 20, 30);

  ctx.fillStyle = "red";
  ctx.fillRect(20, 50, 200, 15);

  ctx.fillStyle = "lime";
  ctx.fillRect(20, 50, player.health * 2, 15);

  if (player.health <= 0) {
    gameOver = true;
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", canvas.width/2 - 120, canvas.height/2);
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();

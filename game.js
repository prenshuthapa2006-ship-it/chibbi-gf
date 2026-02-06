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
const gfImg = new Image(); gfImg.src = "gf.png";
const enemyImg = new Image(); enemyImg.src = "you.png";
const healerImg = new Image(); healerImg.src = "healer.png";
const stealerImg = new Image(); stealerImg.src = "stealer.png";

// ===== PLAYER =====
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 130,
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

// ===== GAME DATA =====
let enemies = [];
let bullets = [];
let healer = null;
let stealer = null;
let score = 0;
let gameOver = false;

// ===== NORMAL ENEMIES =====
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
    speed: 1.4
  });
}

setInterval(() => {
  if (!gameOver) spawnEnemy();
}, 2200);

// ===== HEALER SPAWN =====
setInterval(() => {
  if (!gameOver && !healer) {
    healer = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 90
    };

    // Spawn stealer after 2 seconds
    setTimeout(() => {
      if (healer) {
        stealer = {
          x: Math.random() < 0.5 ? 0 : canvas.width,
          y: Math.random() * canvas.height,
          size: 110,
          speed: 3.5  // FAST
        };
      }
    }, 2000);
  }
}, 12000);

// ===== AUTO SHOOT =====
setInterval(() => {
  if (gameOver) return;
  if (bullets.length > 15) bullets.shift();

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
}, 500);

// ===== GAME LOOP =====
function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Smooth movement
  player.x += (targetX - player.x) * 0.18;
  player.y += (targetY - player.y) * 0.18;

  player.x = Math.max(65, Math.min(canvas.width - 65, player.x));
  player.y = Math.max(65, Math.min(canvas.height - 65, player.y));

  ctx.drawImage(gfImg, player.x - 65, player.y - 65, 130, 130);

  // ===== ENEMIES =====
  enemies.forEach((e, i) => {
    let angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed;
    e.y += Math.sin(angle) * e.speed;

    ctx.drawImage(enemyImg, e.x - 45, e.y - 45, 90, 90);

    if (Math.hypot(e.x - player.x, e.y - player.y) < 55) {
      player.health -= 0.2;
    }
  });

  // ===== HEALER =====
  if (healer) {
    ctx.drawImage(healerImg, healer.x - 45, healer.y - 45, 90, 90);

    if (Math.hypot(player.x - healer.x, player.y - healer.y) < 70) {
      player.health = Math.min(100, player.health + 40);
      healer = null;
      stealer = null;
    }
  }

  // ===== STEALER (CANNOT BE KILLED) =====
  if (stealer) {
    let target = healer ? healer : player;
    let angle = Math.atan2(target.y - stealer.y, target.x - stealer.x);
    stealer.x += Math.cos(angle) * stealer.speed;
    stealer.y += Math.sin(angle) * stealer.speed;

    ctx.drawImage(stealerImg, stealer.x - 55, stealer.y - 55, 110, 110);

    // If reaches healer
    if (healer && Math.hypot(stealer.x - healer.x, stealer.y - healer.y) < 60) {
      healer = null;
      stealer = null;
    }

    // If touches player = BIG DAMAGE
    if (Math.hypot(stealer.x - player.x, stealer.y - player.y) < 70) {
      player.health -= 1;
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

    ctx.font = "24px Arial";
    ctx.fillText("💖", b.x - 12, b.y + 12);

    enemies.forEach((e, ei) => {
      if (Math.hypot(e.x - b.x, e.y - b.y) < 50) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score++;
      }
    });
  });

  // ===== UI =====
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

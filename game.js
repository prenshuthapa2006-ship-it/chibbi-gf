const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

/* ========= RESIZE ========= */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ========= IMAGES ========= */
const gfImg = new Image();
gfImg.src = "gf.png";

const meImg = new Image();
meImg.src = "you.png";

const healerImg = new Image();
healerImg.src = "healer.png";

const stealerImg = new Image();
stealerImg.src = "stealer.png";

/* ========= MUSIC ========= */
const musicBtn = document.getElementById("musicBtn");
const bgm = new Audio("bgm.mp3");
bgm.loop = true;
bgm.volume = 0.5;

let musicOn = false;

if (musicBtn) {
  musicBtn.addEventListener("click", () => {
    if (!musicOn) {
      bgm.play();
      musicBtn.innerText = "🔊";
      musicOn = true;
    } else {
      bgm.pause();
      musicBtn.innerText = "🎵";
      musicOn = false;
    }
  });
}

/* ========= SIZES ========= */
const PLAYER_SIZE = 110;
const ENEMY_SIZE = 95;
const BOSS_SIZE = 160;
const HEALER_SIZE = 90;
const STEALER_SIZE = 110;

/* ========= PLAYER ========= */
let player = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  health: 100
};

let score = 0;

/* ========= CONTROL (DRAG PC + MOBILE) ========= */
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

/* ========= ARRAYS ========= */
let enemies = [];
let bullets = [];
let boss = null;
let healer = null;
let stealer = null;

/* ========= ENEMY SPAWN ========= */
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
    speed: 2 + score * 0.005
  });
}

setInterval(spawnEnemy, 1100);

/* ========= BOSS ========= */
setInterval(() => {
  if (!boss && score > 15) {
    boss = {
      x: Math.random() * canvas.width,
      y: -200,
      health: 70 + score * 0.5,
      speed: 1.8
    };
  }
}, 9000);

/* ========= HEALER ========= */
setInterval(() => {
  if (!healer) {
    healer = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height
    };
  }
}, 10000);

/* ========= STEALER ========= */
setInterval(() => {
  if (!stealer && healer) {
    stealer = {
      x: Math.random() * canvas.width,
      y: canvas.height + 120,
      speed: 3,
      carrying: false
    };
  }
}, 6000);

/* ========= AUTO SHOOT ========= */
setInterval(() => {

  if (enemies.length === 0 && !boss) return;

  let target = boss ? boss :
    enemies.reduce((a, b) =>
      Math.hypot(player.x - a.x, player.y - a.y) <
      Math.hypot(player.x - b.x, player.y - b.y) ? a : b
    );

  let angle = Math.atan2(target.y - player.y, target.x - player.x);

  bullets.push({
    x: player.x,
    y: player.y,
    dx: Math.cos(angle) * 9,
    dy: Math.sin(angle) * 9
  });

}, 350);

/* ========= GAME LOOP ========= */
function gameLoop() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* PLAYER */
  ctx.drawImage(
    gfImg,
    player.x - PLAYER_SIZE / 2,
    player.y - PLAYER_SIZE / 2,
    PLAYER_SIZE,
    PLAYER_SIZE
  );

  /* BULLETS (GLOWING HEARTS) */
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.x += b.dx;
    b.y += b.dy;

    ctx.save();
    ctx.shadowColor = "#ff69b4";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "#ff69b4";

    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.bezierCurveTo(b.x - 10, b.y - 10, b.x - 20, b.y + 10, b.x, b.y + 20);
    ctx.bezierCurveTo(b.x + 20, b.y + 10, b.x + 10, b.y - 10, b.x, b.y);
    ctx.fill();
    ctx.restore();

    if (
      b.x < -50 || b.x > canvas.width + 50 ||
      b.y < -50 || b.y > canvas.height + 50
    ) {
      bullets.splice(i, 1);
    }
  }

  /* ENEMIES */
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];

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
      player.health -= 0.25;
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (Math.hypot(bullets[j].x - e.x, bullets[j].y - e.y) < 45) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score++;
        break;
      }
    }
  }

  /* BOSS */
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

    if (Math.hypot(player.x - boss.x, player.y - boss.y) < 80) {
      player.health -= 0.6;
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (Math.hypot(bullets[j].x - boss.x, bullets[j].y - boss.y) < 60) {
        boss.health -= 6;
        bullets.splice(j, 1);
      }
    }

    if (boss.health <= 0) {
      boss = null;
      score += 10;
    }
  }

  /* HEALER */
  if (healer) {
    ctx.drawImage(
      healerImg,
      healer.x - HEALER_SIZE / 2,
      healer.y - HEALER_SIZE / 2,
      HEALER_SIZE,
      HEALER_SIZE
    );

    if (Math.hypot(player.x - healer.x, player.y - healer.y) < 60) {
      player.health = Math.min(100, player.health + 40);
      healer = null;
      stealer = null;
    }
  }

  /* STEALER */
  if (stealer) {

    if (healer && !stealer.carrying) {
      let angle = Math.atan2(healer.y - stealer.y, healer.x - stealer.x);
      stealer.x += Math.cos(angle) * stealer.speed;
      stealer.y += Math.sin(angle) * stealer.speed;

      if (Math.hypot(stealer.x - healer.x, stealer.y - healer.y) < 50) {
        stealer.carrying = true;
        healer = null;
      }

    } else if (stealer.carrying) {
      stealer.y -= 5;
      if (stealer.y < -200) stealer = null;

    } else {
      let angle = Math.atan2(player.y - stealer.y, player.x - stealer.x);
      stealer.x += Math.cos(angle) * stealer.speed;
      stealer.y += Math.sin(angle) * stealer.speed;

      if (Math.hypot(player.x - stealer.x, player.y - stealer.y) < 60) {
        player.health -= 0.35;
      }
    }

    if (stealer) {
      ctx.drawImage(
        stealerImg,
        stealer.x - STEALER_SIZE / 2,
        stealer.y - STEALER_SIZE / 2,
        STEALER_SIZE,
        STEALER_SIZE
      );
    }
  }

  /* UI */
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 20, 40);
  ctx.fillText("Health: " + Math.floor(player.health), 20, 70);

  if (player.health <= 0) {
    alert("Game Over 💔 Score: " + score);
    document.location.reload();
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();

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

/* ===== MUSIC ===== */
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

/* ===== IMAGES ===== */
const gfImg = new Image(); gfImg.src = "gf.png";
const enemyImg = new Image(); enemyImg.src = "you.png";
const healerImg = new Image(); healerImg.src = "healer.png";
const stealerImg = new Image(); stealerImg.src = "stealer.png";

/* ===== PLAYER ===== */
let player = {
  x: canvas.width/2,
  y: canvas.height/2,
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

/* ===== GAME STATE ===== */
let enemies = [];
let bullets = [];
let healer = null;
let stealer = null;
let boss = null;
let score = 0;
let gameOver = false;

/* ===== ENEMY SPAWN (FASTER + BALANCED) ===== */
setInterval(() => {
  if (gameOver) return;

  let side = Math.floor(Math.random()*4);
  let x,y;

  if(side===0){ x=0; y=Math.random()*canvas.height; }
  if(side===1){ x=canvas.width; y=Math.random()*canvas.height; }
  if(side===2){ x=Math.random()*canvas.width; y=0; }
  if(side===3){ x=Math.random()*canvas.width; y=canvas.height; }

  enemies.push({
    x,
    y,
    size: 95,
    speed: 1.8 + score*0.005
  });

}, 1200); // faster spawn

/* ===== HEALER + STEALER ===== */
setInterval(() => {
  if (gameOver) return;

  if (!healer) {
    healer = {
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      size: 95
    };

    setTimeout(() => {
      if (healer) {
        stealer = {
          x: Math.random()<0.5 ? 0 : canvas.width,
          y: Math.random()*canvas.height,
          size: 115,
          speed: 3.5
        };
      }
    }, 1500);
  }

}, 10000);

/* ===== BOSS SPAWN ===== */
setInterval(() => {
  if (gameOver) return;

  if (score >= 8 && !boss) {
    boss = {
      x: Math.random()*canvas.width,
      y: -150,
      size: 180,
      health: 30,
      speed: 1.6
    };
  }

}, 6000);

/* ===== AUTO SHOOT ===== */
setInterval(() => {
  if (gameOver) return;

  if (bullets.length > 18) bullets.shift();

  let target = null;
  let minDist = Infinity;

  enemies.forEach(e => {
    let d = Math.hypot(e.x-player.x, e.y-player.y);
    if (d < minDist) {
      minDist = d;
      target = e;
    }
  });

  if (boss) target = boss;

  if (target) {
    let angle = Math.atan2(target.y-player.y, target.x-player.x);
    bullets.push({
      x: player.x,
      y: player.y,
      dx: Math.cos(angle)*6,
      dy: Math.sin(angle)*6
    });
  }

}, 450);

/* ===== GAME LOOP ===== */
function gameLoop(){
  if(gameOver) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  // smooth move
  player.x += (targetX-player.x)*0.2;
  player.y += (targetY-player.y)*0.2;

  player.x = Math.max(65, Math.min(canvas.width-65, player.x));
  player.y = Math.max(65, Math.min(canvas.height-65, player.y));

  ctx.drawImage(gfImg, player.x-65, player.y-65,130,130);

  /* ===== ENEMIES ===== */
  enemies = enemies.filter(e=>{
    let angle = Math.atan2(player.y-e.y, player.x-e.x);
    e.x += Math.cos(angle)*e.speed;
    e.y += Math.sin(angle)*e.speed;

    ctx.drawImage(enemyImg,e.x-47,e.y-47,95,95);

    if(Math.hypot(e.x-player.x,e.y-player.y)<55){
      player.health-=0.4;
    }

    return true;
  });

  /* ===== HEALER ===== */
  if(healer){
    ctx.drawImage(healerImg, healer.x-47, healer.y-47,95,95);

    if(Math.hypot(player.x-healer.x,player.y-healer.y)<70){
      player.health=Math.min(100,player.health+40);
      healer=null;
      stealer=null;
    }
  }

  /* ===== STEALER FIX (NO FREEZE) ===== */
  if(stealer){
    let target = healer ? healer : player;
    let angle = Math.atan2(target.y-stealer.y,target.x-stealer.x);
    stealer.x += Math.cos(angle)*stealer.speed;
    stealer.y += Math.sin(angle)*stealer.speed;

    ctx.drawImage(stealerImg,stealer.x-57,stealer.y-57,115,115);

    if(healer && Math.hypot(stealer.x-healer.x,stealer.y-healer.y)<60){
      healer = null;
      stealer = null; // clean removal (NO state conflict)
    }

    if(Math.hypot(stealer.x-player.x,stealer.y-player.y)<70){
      player.health-=0.8;
    }
  }

  /* ===== BOSS ===== */
  if(boss){
    let angle = Math.atan2(player.y-boss.y,player.x-boss.x);
    boss.x += Math.cos(angle)*boss.speed;
    boss.y += Math.sin(angle)*boss.speed;

    ctx.drawImage(enemyImg,boss.x-90,boss.y-90,180,180);

    if(Math.hypot(boss.x-player.x,boss.y-player.y)<85){
      player.health-=0.6;
    }

    if(boss.health<=0){
      boss=null;
      score+=15;
    }
  }

  /* ===== HEART BULLETS ===== */
  bullets = bullets.filter(b=>{
    b.x+=b.dx;
    b.y+=b.dy;

    if(b.x<0||b.x>canvas.width||b.y<0||b.y>canvas.height) return false;

    ctx.font="26px Arial";
    ctx.fillText("💖",b.x-13,b.y+13);

    enemies.forEach((e,i)=>{
      if(Math.hypot(e.x-b.x,e.y-b.y)<50){
        enemies.splice(i,1);
        score++;
      }
    });

    if(boss && Math.hypot(boss.x-b.x,boss.y-b.y)<85){
      boss.health--;
      return false;
    }

    return true;
  });

  /* ===== UI ===== */
  ctx.fillStyle="white";
  ctx.font="22px Arial";
  ctx.fillText("Score: "+score,20,30);

  ctx.fillStyle="red";
  ctx.fillRect(20,50,200,15);
  ctx.fillStyle="lime";
  ctx.fillRect(20,50,player.health*2,15);

  if(player.health<=0){
    gameOver=true;
    ctx.font="40px Arial";
    ctx.fillText("GAME OVER 💔",canvas.width/2-140,canvas.height/2);
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();

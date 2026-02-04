const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const keys = new Set();

addEventListener("keydown", e => keys.add(e.key.toLowerCase()));
addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function dist(ax, ay, bx, by){ return Math.hypot(ax - bx, ay - by); }

const player = { x: 120, y: 120, r: 12, speed: 2.2, sprint: 3.6 };
const granny  = { x: 760, y: 380, r: 16, speed: 1.6, state: "patrol", t: 0 };

const walls = [
  {x: 200, y: 60,  w: 30, h: 280},
  {x: 420, y: 220, w: 260, h: 30},
  {x: 650, y: 60,  w: 30, h: 260},
];

function circleRectCollide(cx, cy, r, rect){
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  return dist(cx, cy, nx, ny) < r;
}

function moveWithCollisions(obj, dx, dy){
  obj.x += dx;
  for (const w of walls){
    if (circleRectCollide(obj.x, obj.y, obj.r, w)) obj.x -= dx;
  }
  obj.y += dy;
  for (const w of walls){
    if (circleRectCollide(obj.x, obj.y, obj.r, w)) obj.y -= dy;
  }
  obj.x = clamp(obj.x, obj.r, canvas.width - obj.r);
  obj.y = clamp(obj.y, obj.r, canvas.height - obj.r);
}

let gameOver = false;

function update(){
  if (gameOver) return;

  // Player
  const sp = keys.has("shift") ? player.sprint : player.speed;
  let dx = 0, dy = 0;
  if (keys.has("w")) dy -= sp;
  if (keys.has("s")) dy += sp;
  if (keys.has("a")) dx -= sp;
  if (keys.has("d")) dx += sp;

  // Normalize diagonal movement
  if (dx && dy){
    dx *= 0.7071; dy *= 0.7071;
  }
  moveWithCollisions(player, dx, dy);

  // Granny AI: chase if close, otherwise wander
  granny.t += 1;
  const d = dist(player.x, player.y, granny.x, granny.y);

  let gx = 0, gy = 0;

  if (d < 220){
    granny.state = "chase";
    const ang = Math.atan2(player.y - granny.y, player.x - granny.x);
    gx = Math.cos(ang) * granny.speed;
    gy = Math.sin(ang) * granny.speed;
  } else {
    granny.state = "patrol";
    if (granny.t % 90 === 0){
      granny.vx = (Math.random() * 2 - 1) * granny.speed;
      granny.vy = (Math.random() * 2 - 1) * granny.speed;
    }
    gx = granny.vx || 0;
    gy = granny.vy || 0;
  }

  moveWithCollisions(granny, gx, gy);

  // Lose condition
  if (dist(player.x, player.y, granny.x, granny.y) < player.r + granny.r){
    gameOver = true;
  }
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // floor
  ctx.fillStyle = "#070707";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // walls
  ctx.fillStyle = "#333";
  for (const w of walls){
    ctx.fillRect(w.x,w.y,w.w,w.h);
  }

  // player
  ctx.fillStyle = "#3af";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
  ctx.fill();

  // granny
  ctx.fillStyle = granny.state === "chase" ? "#f33" : "#b22";
  ctx.beginPath();
  ctx.arc(granny.x, granny.y, granny.r, 0, Math.PI*2);
  ctx.fill();

  // text
  ctx.fillStyle = "#0f0";
  ctx.font = "16px monospace";
  ctx.fillText(`State: ${granny.state}`, 10, canvas.height - 14);

  if (gameOver){
    ctx.fillStyle = "#fff";
    ctx.font = "44px monospace";
    ctx.fillText("YOU GOT TEMU'D", 250, 250);
    ctx.font = "18px monospace";
    ctx.fillText("Refresh to try again.", 350, 285);
  }
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();

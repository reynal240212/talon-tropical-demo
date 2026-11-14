const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const bg = new Image();
const sheet = new Image();
const runSheet = new Image();
const idleSheet = new Image();
const swordSheet = new Image();
const comboSheet = new Image();
const crouchSheet = new Image();
const jumpSheet = new Image();
const hangSheet = new Image();
bg.src = 'assets/nivel_tropical_plataformas_v1.webp';
sheet.src = 'assets/explorador_caminar_master_v1.webp';
runSheet.src = 'assets/explorador_correr_master_v1.webp';
idleSheet.src = 'assets/explorador_idle_master_v1.webp';
swordSheet.src = 'assets/explorador_sacar_espada_8_frames.webp';
comboSheet.src = 'assets/explorador_combo_espada_12_frames.webp';
crouchSheet.src = 'assets/explorador_agacharse_6_frames.webp';
jumpSheet.src = 'assets/explorador_salto_master_v1.webp';
hangSheet.src = 'assets/explorador_colgado_borde_8_frames.webp';

const keys = new Set();
addEventListener('keydown', e => { if(['ArrowLeft','ArrowRight','ArrowUp',' ','w','a','d'].includes(e.key)) e.preventDefault(); keys.add(e.code === ' ' ? 'Space' : e.key); });
addEventListener('keyup', e => keys.delete(e.code === ' ' ? 'Space' : e.key));
document.querySelectorAll('[data-key]').forEach(btn => {
  const key = btn.dataset.key;
  const down = e => { e.preventDefault(); keys.add(key); };
  const up = e => { e.preventDefault(); keys.delete(key); };
  btn.addEventListener('pointerdown', down); btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('pointerleave', up);
});

const world = { w: 1668, h: 941 };
const platforms = [
  {x:0,y:760,w:1668,h:181}, {x:205,y:520,w:270,h:70}, {x:335,y:300,w:255,h:65},
  {x:625,y:420,w:400,h:76}, {x:1060,y:520,w:270,h:70}, {x:1100,y:300,w:270,h:70}, {x:1390,y:570,w:278,h:190}
];
const player = {x:110,y:638,w:62,h:124,vx:0,vy:0,onGround:false,face:1,frame:0,anim:0,running:false,swordTime:0,attackTime:0,attackStyle:0,hangTime:0,hangPlatform:null};
let last = performance.now();
function resize(){ const dpr=Math.min(devicePixelRatio||1,2); canvas.width=innerWidth*dpr; canvas.height=innerHeight*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
addEventListener('resize', resize); resize();
function pressed(...names){ return names.some(n=>keys.has(n)); }
// Fill the whole screen on phones and wide monitors; crop only the far edges.
function scale(){ return Math.max(innerWidth/world.w, innerHeight/world.h); }
function cameraX(){ const s=scale(); const viewW=innerWidth/s; return Math.max(0,Math.min(world.w-viewW,player.x-viewW*.38)); }
function drawWorld(image){ const s=scale(), cam=cameraX(); ctx.drawImage(image,-cam*s,0,world.w*s,world.h*s); }
function update(dt){
  if(player.hangTime>0){
    const p=player.hangPlatform;
    if(pressed('ArrowUp','KeyW')){ player.hangTime=0; player.y=p.y-player.h-2; player.vy=-450; }
    else if(pressed('ArrowDown','KeyS') || pressed('KeyQ')){ player.hangTime=0; player.vy=80; }
    else { player.hangTime=Math.min(player.hangTime+dt,.85); player.vx=0; player.vy=0; player.y=p.y-65; return; }
  }
  if(pressed('KeyX') && player.attackTime<=0 && player.swordTime<=0){ player.attackTime=0.001; player.attackStyle=(player.attackStyle+1)%3; }
  if(pressed('KeyE') && player.swordTime<=0) player.swordTime=0.001;
  if(player.swordTime>0) player.swordTime+=dt;
  if(player.attackTime>0) player.attackTime+=dt;
  if(player.attackTime>0.45) player.attackTime=0;
  if(player.swordTime>0.75) player.swordTime=0;
  const left=pressed('ArrowLeft','a','KeyA'), right=pressed('ArrowRight','d','KeyD');
  const running=pressed('ControlLeft','ControlRight');
  player.vx=(player.swordTime>0||player.attackTime>0||player.hangTime>0)?0:(right?(running?360:230):0)-(left?(running?360:230):0); if(player.vx) player.face=player.vx>0?1:-1;
  if(pressed('Space','ArrowUp','w','KeyW') && player.onGround){ player.vy=-520; player.onGround=false; }
  const oldY=player.y; player.x=Math.max(0,Math.min(world.w-player.w,player.x+player.vx*dt)); player.vy+=1250*dt; player.y+=player.vy*dt; player.onGround=false;
  if(player.vy>0 && !player.onGround){
    for(const p of platforms){
      const nearLeft=Math.abs((player.x+player.w)-p.x)<18 && player.x+player.w>=p.x-18 && player.x<p.x;
      const nearRight=Math.abs(player.x-(p.x+p.w))<18 && player.x<=p.x+p.w+18 && player.x+player.w>p.x+p.w;
      if(oldY+player.h<p.y && player.y+player.h>=p.y-8 && (nearLeft||nearRight)){
        player.hangPlatform=p; player.hangTime=.001; player.x=nearLeft?p.x-player.w+8:p.x+p.w-8; player.y=p.y-65; player.vy=0; break;
      }
    }
  }
  for(const p of platforms){ if(player.vy>=0 && oldY+player.h<=p.y && player.y+player.h>=p.y && player.x+player.w>p.x && player.x<p.x+p.w){ player.y=p.y-player.h; player.vy=0; player.onGround=true; } }
  if(player.y>world.h+100){player.x=110;player.y=600;player.vy=0;}
  if(Math.abs(player.vx)>0 && player.onGround){ player.anim+=dt*(running?14:9); player.frame=Math.floor(player.anim)%8; }
  else if(player.onGround){ player.anim+=dt*3; player.frame=Math.floor(player.anim)%6; }
  else { player.anim=0; player.frame=0; }
  player.running=running && Math.abs(player.vx)>0;
}
function render(){
  ctx.clearRect(0,0,innerWidth,innerHeight); drawWorld(bg);
  const s=scale(), cam=cameraX(), px=(player.x-cam)*s, py=player.y*s;
  const moving=Math.abs(player.vx)>0 && player.onGround;
  const crouching=pressed('ArrowDown','KeyS');
  const jumping=!player.onGround;
  const activeSheet=player.hangTime>0?hangSheet:player.attackTime>0?comboSheet:player.swordTime>0?swordSheet:jumping?jumpSheet:crouching?crouchSheet:player.running?runSheet:moving?sheet:idleSheet;
  if(activeSheet.complete){ const count=player.hangTime>0?8:(player.attackTime>0?12:(player.swordTime>0?8:(jumping?8:(crouching?6:(player.running||moving?8:6))))); const fw=activeSheet.width/count; const jumpFrame=player.vy<-260?2:player.vy<0?4:player.vy>260?6:5; const frame=player.hangTime>0?Math.min(7,Math.floor(player.hangTime*9)):player.attackTime>0?player.attackStyle*4+Math.min(3,Math.floor(player.attackTime*9)):player.swordTime>0?Math.min(7,Math.floor(player.swordTime*11)):jumping?jumpFrame:crouching?Math.floor(performance.now()/140)%6:player.frame; const sx=player.running?.43:.36; const sy=player.running?.19:.17; ctx.save(); ctx.translate(px+player.w*s/2,py+player.h*s); ctx.scale(player.face*s*sx,s*sy); ctx.drawImage(activeSheet,frame*fw,0,fw,activeSheet.height,-fw/2,-activeSheet.height,fw,activeSheet.height); ctx.restore(); }
  ctx.fillStyle='#ffffffcc'; ctx.font='bold 15px system-ui'; ctx.fillText('Movimiento: '+(player.running?'CORRIENDO':Math.abs(player.vx)>0?'CAMINANDO':'QUIETO'),18,innerHeight-18);
}
function loop(now){ const dt=Math.min((now-last)/1000,.033); last=now; update(dt); render(); requestAnimationFrame(loop); }
Promise.all([new Promise(r=>bg.onload=r),new Promise(r=>sheet.onload=r),new Promise(r=>runSheet.onload=r),new Promise(r=>idleSheet.onload=r),new Promise(r=>swordSheet.onload=r),new Promise(r=>comboSheet.onload=r),new Promise(r=>crouchSheet.onload=r),new Promise(r=>jumpSheet.onload=r),new Promise(r=>hangSheet.onload=r)]).then(()=>requestAnimationFrame(loop));

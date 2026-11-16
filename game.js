const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const bg = new Image();
const sheet = new Image();
const runSheet = new Image();
const swordRunSheet = new Image();
const idleSheet = new Image();
const swordSheet = new Image();
const comboSheet = new Image();
const crouchSheet = new Image();
const jumpSheet = new Image();
const doubleJumpSheet = new Image();
const sleepSheet = new Image();
const hangSheet = new Image();
const climbSheet = new Image();
const platformTexture = new Image();
const enemySheet = new Image();
bg.src = 'assets/nivel_tropical_extendido_v2.png?v=1';
sheet.src = 'assets/explorador_caminar_master_v1.webp';
runSheet.src = 'assets/explorador_correr_master_v1.webp';
swordRunSheet.src = 'assets/explorador_correr_espada_master_v2.webp';
idleSheet.src = 'assets/explorador_idle_master_v1.webp';
swordSheet.src = 'assets/explorador_espada_master_v2.webp';
comboSheet.src = 'assets/explorador_ataque_master_v2.webp';
crouchSheet.src = 'assets/explorador_agacharse_master_v1.png';
jumpSheet.src = 'assets/explorador_salto_master_v1.webp';
doubleJumpSheet.src = 'assets/explorador_doble_salto_master_v1.png?v=2';
doubleJumpSheet.onerror = () => { doubleJumpSheet.src = 'assets/explorador_salto_master_v1.webp'; };
sleepSheet.src = 'assets/explorador_dormir_master_v1.png?v=1';
hangSheet.src = 'assets/explorador_colgado_personaje_v3.png?v=1';
climbSheet.src = 'assets/explorador_subir_personaje_v2.png?v=1';
platformTexture.src = 'assets/plataforma_tropical_textura_v1.png?v=1';
enemySheet.src = 'assets/enemigo_tiki_master_v2.png';

const keyboardKeys = new Set();
const touchKeys = new Set();
let runTapJump=false;
let collisionDebug=false;
let collisionEditor=false;
let dragPlatform=null;
let dragOffsetX=0, dragOffsetY=0;
let resizeMode=null;
let selectedPlatform=null;
addEventListener('keydown', e => {
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','ControlLeft','ControlRight','KeyZ','KeyX','KeyE','KeyC'].includes(e.code)) e.preventDefault();
  if(e.code) keyboardKeys.add(e.code);
  if(e.code==='KeyH'){ collisionEditor=!collisionEditor; collisionDebug=collisionEditor; }
  if(e.code==='KeyR' && collisionEditor){
    localStorage.removeItem('talon-platform-collisions-v2');
    localStorage.removeItem('talon-stair-collisions-v2');
    localStorage.removeItem('talon-platform-collisions');
    localStorage.removeItem('talon-stair-collisions');
    location.reload();
  }
});
addEventListener('keyup', e => {
  if(e.code) keyboardKeys.delete(e.code);
});
addEventListener('blur',()=>keyboardKeys.clear());
document.querySelectorAll('[data-key]').forEach(btn => {
  const key = btn.dataset.key;
  if(btn.classList.contains('run')){
    let timer=null, holding=false, pointer=null;
    btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);pointer=e.pointerId;holding=false;timer=setTimeout(()=>{holding=true;touchKeys.add('ControlLeft');btn.classList.add('held');},230);});
    const finish=e=>{if(pointer!==e.pointerId)return;e.preventDefault();clearTimeout(timer);touchKeys.delete('ControlLeft');btn.classList.remove('held');if(e.type==='pointerup'&&!holding)runTapJump=true;pointer=null;};
    btn.addEventListener('pointerup',finish);btn.addEventListener('pointercancel',finish);btn.addEventListener('lostpointercapture',finish);
    return;
  }
  const down = e => { e.preventDefault(); touchKeys.add(key); };
  const up = e => { e.preventDefault(); touchKeys.delete(key); };
  btn.addEventListener('pointerdown', e => { btn.setPointerCapture(e.pointerId); down(e); }); btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('lostpointercapture', up);
});

const VIEW_BASE = { w: 1668, h: 724 };
const MASTER_CHARACTER = { w: 62, h: 124 };
const world = { w: 2172, h: 724 };
const platforms = [
  {x:0, y:533, w:2172, h:191},       // Suelo principal continuo
  {x:140, y:368, w:190, h:65},       // P1: Izquierda baja (cascada)
  {x:226, y:206, w:160, h:60},       // P2: Izquierda alta
  {x:442, y:298, w:286, h:65},       // P3: Izquierda media (grande)
  {x:742, y:369, w:193, h:65},       // P4: Central baja
  {x:766, y:205, w:196, h:60},       // P5: Central alta
  {x:1055, y:366, w:235, h:170},     // P6: Plataforma de la palmera central
  {x:1378, y:254, w:174, h:60},      // P7: Derecha alta (palmera)
  {x:1600, y:358, w:180, h:65},      // P8: Derecha baja
  {x:1695, y:212, w:155, h:60},      // P9: Derecha alta
  {x:1968, y:248, w:204, h:285}      // P10: Terraza del arco maya derecho
];
const stairSteps=[
  // Escalera central (sube a palmera)
  {x:902, y:498, w:30, h:35}, {x:932, y:466, w:30, h:67}, {x:962, y:434, w:32, h:99}, {x:994, y:402, w:30, h:131}, {x:1024, y:370, w:32, h:163},
  // Escalera derecha (sube al arco)
  {x:1860, y:485, w:25, h:48}, {x:1885, y:440, w:25, h:93}, {x:1910, y:395, w:25, h:138}, {x:1935, y:345, w:25, h:188}, {x:1960, y:295, w:25, h:238}
];
const savedStairs=localStorage.getItem('talon-stair-collisions-v2');
if(savedStairs){try{const saved=JSON.parse(savedStairs);if(Array.isArray(saved)&&saved.length===stairSteps.length)saved.forEach((p,i)=>Object.assign(stairSteps[i],p));}catch{}}
const savedPlatforms=localStorage.getItem('talon-platform-collisions-v2');
if(savedPlatforms){
  try{
    const saved=JSON.parse(savedPlatforms);
    if(Array.isArray(saved) && saved.length===platforms.length) saved.forEach((p,i)=>Object.assign(platforms[i],p));
  }catch{}
}
function editorPoint(e){
  const rect=canvas.getBoundingClientRect(), s=scale(), cam=cameraX();
  return {x:(e.clientX-rect.left)/s+cam,y:(e.clientY-rect.top)/s};
}
canvas.addEventListener('pointerdown',e=>{
  if(!collisionEditor)return;
  const q=editorPoint(e);
  dragPlatform=[...platforms].reverse().find(p=>{
    const nearLeft=Math.abs(q.x-p.x)<16, nearRight=Math.abs(q.x-(p.x+p.w))<16;
    const nearTop=Math.abs(q.y-p.y)<16, nearBottom=Math.abs(q.y-(p.y+p.h))<16;
    if(q.x>=p.x&&q.x<=p.x+p.w&&q.y>=p.y&&q.y<=p.y+p.h){
      if(nearLeft&&nearTop){resizeMode='nw';return true;}
      if(nearRight&&nearTop){resizeMode='ne';return true;}
      if(nearLeft&&nearBottom){resizeMode='sw';return true;}
      if(nearRight&&nearBottom){resizeMode='se';return true;}
      if(nearTop){resizeMode='n';return true;}
      if(nearRight){resizeMode='e';return true;}
      if(nearBottom){resizeMode='s';return true;}
      if(nearLeft){resizeMode='w';return true;}
      resizeMode='move';return true;
    }
    return false;
  });
  if(!dragPlatform){ dragPlatform=[...stairSteps].reverse().find(p=>q.x>=p.x&&q.x<=p.x+p.w&&q.y>=p.y&&q.y<=p.y+p.h); if(dragPlatform) resizeMode='move'; }
  selectedPlatform=dragPlatform;
  if(dragPlatform){ dragOffsetX=q.x-dragPlatform.x; dragOffsetY=q.y-dragPlatform.y; canvas.setPointerCapture(e.pointerId); e.preventDefault(); }
});
canvas.addEventListener('pointermove',e=>{
  if(!collisionEditor||!dragPlatform)return;
  const q=editorPoint(e);
  const right=dragPlatform.x+dragPlatform.w, bottom=dragPlatform.y+dragPlatform.h;
  if(resizeMode.includes('w')){ const nx=Math.max(0,Math.min(right-40,q.x)); dragPlatform.x=nx; dragPlatform.w=right-nx; }
  if(resizeMode.includes('e')) dragPlatform.w=Math.max(40,Math.min(world.w-dragPlatform.x,q.x-dragPlatform.x));
  if(resizeMode.includes('n')){ const ny=Math.max(0,Math.min(bottom-25,q.y)); dragPlatform.y=ny; dragPlatform.h=bottom-ny; }
  if(resizeMode.includes('s')) dragPlatform.h=Math.max(25,Math.min(world.h-dragPlatform.y,q.y-dragPlatform.y));
  if(resizeMode==='move'){
    dragPlatform.x=Math.max(0,Math.min(world.w-dragPlatform.w,q.x-dragOffsetX));
    dragPlatform.y=Math.max(0,Math.min(world.h-dragPlatform.h,q.y-dragOffsetY));
  }
  e.preventDefault();
});
canvas.addEventListener('pointerup',e=>{
  if(!dragPlatform)return;
  localStorage.setItem('talon-platform-collisions-v2',JSON.stringify(platforms));
  if(stairSteps.includes(dragPlatform)) localStorage.setItem('talon-stair-collisions-v2',JSON.stringify(stairSteps));
  dragPlatform=null; resizeMode=null; e.preventDefault();
});
// Altura de cada peldaño de la escalera de piedra dibujada.
function stairHeight(x){
  return stairSteps.find(p=>x>=p.x&&x<p.x+p.w)?.y??null;
}
const player = {x:110,y:409,w:MASTER_CHARACTER.w,h:MASTER_CHARACTER.h,vx:0,vy:0,onGround:false,face:1,frame:0,anim:0,running:false,idleTime:0,sleepTime:0,snoreTime:0,jumpCount:0,jumpLatch:false,doubleJumpTime:0,swordTime:0,swordOut:false,swordLatch:false,attackLatch:false,attackTime:0,comboStep:0,comboTimer:0,hangTime:0,climbTime:0,hangPlatform:null,landTime:0,crouchTime:0,hurtTime:0};
let screenShake = 0;
const particles = [];
function spawnSlashSparks(x, y, count=14, color='#ffd152'){
  for(let i=0; i<count; i++){
    const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.9;
    const speed = 140 + Math.random() * 280;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 80,
      size: 2.5 + Math.random() * 3.5,
      color: i % 2 === 0 ? '#ffffff' : color,
      life: 0.28 + Math.random() * 0.16,
      maxLife: 0.44
    });
  }
}

const ENEMY_FRAMES = [
  {x: 24, w: 289, cx: 144, fy: 550},
  {x: 337, w: 264, cx: 132, fy: 550},
  {x: 625, w: 274, cx: 137, fy: 550},
  {x: 923, w: 378, cx: 189, fy: 550},
  {x: 1325, w: 274, cx: 137, fy: 550},
  {x: 1623, w: 301, cx: 150, fy: 550},
  {x: 1948, w: 374, cx: 187, fy: 550},
  {x: 2346, w: 288, cx: 144, fy: 550}
];

const enemies = [
  { id: 1, x: 620, y: 437, minX: 470, maxX: 880, vx: 100, face: 1, state: 'patrol', anim: 0, w: 50, h: 96, deadTimer: 0, attackTimer: 0 },
  { id: 2, x: 500, y: 202, minX: 450, maxX: 710, vx: 90, face: 1, state: 'patrol', anim: 0, w: 50, h: 96, deadTimer: 0, attackTimer: 0 },
  { id: 3, x: 1100, y: 270, minX: 1060, maxX: 1260, vx: 80, face: 1, state: 'patrol', anim: 0, w: 50, h: 96, deadTimer: 0, attackTimer: 0 },
  { id: 4, x: 1450, y: 437, minX: 1380, maxX: 1750, vx: 105, face: 1, state: 'patrol', anim: 0, w: 50, h: 96, deadTimer: 0, attackTimer: 0 },
  { id: 5, x: 2020, y: 152, minX: 1980, maxX: 2130, vx: 85, face: 1, state: 'patrol', anim: 0, w: 50, h: 96, deadTimer: 0, attackTimer: 0 }
];
let last = performance.now();
function resize(){ const dpr=Math.min(devicePixelRatio||1,2); const height=Math.round(visualViewport?.height||innerHeight); document.documentElement.style.setProperty('--game-height',height+'px'); canvas.width=innerWidth*dpr; canvas.height=height*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
addEventListener('resize', resize); visualViewport?.addEventListener('resize',resize); addEventListener('orientationchange',()=>setTimeout(resize,200)); resize();
const fullscreenButton=document.querySelector('#fullscreen');
fullscreenButton.addEventListener('click',async()=>{ try { if(document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector('#game-wrap').requestFullscreen(); } catch { fullscreenButton.title='Usa Añadir a pantalla de inicio para ocultar la barra del navegador'; } });
document.addEventListener('fullscreenchange',()=>{fullscreenButton.textContent=document.fullscreenElement?'⤢':'⛶';fullscreenButton.setAttribute('aria-label',document.fullscreenElement?'Salir de pantalla completa':'Activar pantalla completa');resize();});
const music=document.querySelector('#music');
music.volume=0.35;
let audioContext=null;
let stepDistance=0;
function ensureAudio(){
  if(!audioContext)audioContext=new(window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
}
function playStep(surface='grass'){
  if(!audioContext||audioContext.state!=='running')return;
  const now=audioContext.currentTime, osc=audioContext.createOscillator(), gain=audioContext.createGain(), filter=audioContext.createBiquadFilter();
  osc.type=surface==='stone'?'triangle':'sine';
  osc.frequency.setValueAtTime(surface==='stone'?145:95,now);
  osc.frequency.exponentialRampToValueAtTime(surface==='stone'?72:58,now+.075);
  filter.type='lowpass'; filter.frequency.value=surface==='stone'?900:620;
  gain.gain.setValueAtTime(.0001,now); gain.gain.exponentialRampToValueAtTime(surface==='stone'?.045:.028,now+.008); gain.gain.exponentialRampToValueAtTime(.0001,now+.09);
  osc.connect(filter); filter.connect(gain); gain.connect(audioContext.destination); osc.start(now); osc.stop(now+.1);
}
function playSnore(){
  if(!audioContext||audioContext.state!=='running')return;
  const now=audioContext.currentTime, osc=audioContext.createOscillator(), gain=audioContext.createGain();
  osc.type='sine'; osc.frequency.setValueAtTime(105,now); osc.frequency.exponentialRampToValueAtTime(62,now+.55);
  gain.gain.setValueAtTime(.0001,now); gain.gain.exponentialRampToValueAtTime(.045,now+.12); gain.gain.exponentialRampToValueAtTime(.0001,now+.68);
  osc.connect(gain); gain.connect(audioContext.destination); osc.start(now); osc.stop(now+.7);
}
function playSwordSwing(step=0){
  if(!audioContext||audioContext.state!=='running')return;
  const now=audioContext.currentTime;
  const bufferSize = Math.floor(audioContext.sampleRate * 0.16);
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  const filter = audioContext.createBiquadFilter();
  filter.type = 'bandpass';
  const startFreq = step === 2 ? 900 : step === 1 ? 1600 : 1250;
  const endFreq = step === 2 ? 220 : step === 1 ? 380 : 320;
  filter.frequency.setValueAtTime(startFreq, now);
  filter.frequency.exponentialRampToValueAtTime(endFreq, now + 0.14);
  filter.Q.value = 3.2;
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(step === 2 ? 0.16 : 0.11, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  noise.connect(filter); filter.connect(gain); gain.connect(audioContext.destination);
  noise.start(now); noise.stop(now + 0.16);

  const osc = audioContext.createOscillator();
  const oscGain = audioContext.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(step === 2 ? 480 : step === 1 ? 840 : 680, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.13);
  oscGain.gain.setValueAtTime(0.03, now);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
  osc.connect(oscGain); oscGain.connect(audioContext.destination);
  osc.start(now); osc.stop(now + 0.14);
}
function playSwordHit(){
  if(!audioContext||audioContext.state!=='running')return;
  const now=audioContext.currentTime;
  const osc1 = audioContext.createOscillator();
  const osc2 = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(1120, now); osc1.frequency.exponentialRampToValueAtTime(260, now + 0.11);
  osc2.type = 'square'; osc2.frequency.setValueAtTime(1580, now); osc2.frequency.exponentialRampToValueAtTime(380, now + 0.09);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
  osc1.connect(gain); osc2.connect(gain); gain.connect(audioContext.destination);
  osc1.start(now); osc2.start(now); osc1.stop(now + 0.11); osc2.stop(now + 0.11);
}
async function startMusic(){
  if(!music.paused)return;
  try{await music.play();}catch{}
}
addEventListener('pointerdown',()=>{ensureAudio();startMusic()},{passive:true});
addEventListener('keydown',()=>{ensureAudio();startMusic()});
addEventListener('keydown',e=>{
  if(e.code==='KeyM'){
    if(music.paused) music.play().catch(()=>{}); else music.pause();
  }
});
function pressed(...names){ return names.some(n=>keyboardKeys.has(n)||touchKeys.has(n)); }
// Fill the whole screen on phones and wide monitors; crop only the far edges.
function gameHeight(){return canvas.clientHeight||innerHeight;}
function scale(){ return Math.max(innerWidth/VIEW_BASE.w, gameHeight()/VIEW_BASE.h); }
function cameraX(){ const s=scale(); const viewW=innerWidth/s; return Math.max(0,Math.min(world.w-viewW,player.x-viewW*.38)); }
function drawWorld(image){ const s=scale(), cam=cameraX(); ctx.drawImage(image,-cam*s,0,world.w*s,world.h*s); }
function drawAtmosphere(now){
  const s=scale(), cam=cameraX(), t=now*.001;
  ctx.save(); ctx.scale(s,s); ctx.translate(-cam,0);
  // Translucent drifting cloud wisps, kept above the playable platforms.
  for(let i=0;i<5;i++){
    const x=((i*397+t*(8+i*2))%(world.w+320))-160;
    const y=55+(i%3)*45+Math.sin(t*.35+i)*5;
    ctx.fillStyle='rgba(255,255,255,.10)';
    ctx.beginPath(); ctx.ellipse(x,y,85,15,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x+35,y-9,52,18,0,0,Math.PI*2); ctx.fill();
  }
  // Moving highlights stay within the visible waterfall columns and river.
  const falls=[{x:185,y:205,w:100,h:425},{x:470,y:450,w:62,h:240},{x:705,y:570,w:50,h:135}];
  for(const fall of falls){
    ctx.save(); ctx.beginPath(); ctx.rect(fall.x,fall.y,fall.w,fall.h); ctx.clip();
    for(let i=0;i<12;i++){
      const x=fall.x+8+(i*31)%Math.max(12,fall.w-14);
      const y=fall.y+((i*83+t*(48+i%3*12))%fall.h);
      ctx.strokeStyle=`rgba(229,255,255,${.12+(i%3)*.04})`;
      ctx.lineWidth=2+i%2; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-4,y+30+i%3*8); ctx.stroke();
    }
    ctx.restore();
  }
  for(let i=0;i<9;i++){
    const x=510+i*64+Math.sin(t*.7+i)*9, y=703+i%3*7;
    ctx.strokeStyle='rgba(225,255,250,.22)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(x,y,13+Math.sin(t+i)*3,2,0,0,Math.PI); ctx.stroke();
  }
  // Small leaf glints sway without shifting the collision surface.
  for(const [x,y] of [[75,660],[380,294],[900,410],[1140,280],[1530,685]]){
    ctx.save(); ctx.translate(x,y); ctx.rotate(Math.sin(t*1.5+x)*.13);
    ctx.fillStyle='rgba(137,205,66,.48)'; ctx.beginPath(); ctx.ellipse(0,-7,5,13,.35,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
function drawCollisionDebug(){
  if(!collisionDebug)return;
  const s=scale(), cam=cameraX();
  ctx.save(); ctx.scale(s,s); ctx.translate(-cam,0);
  ctx.fillStyle='rgba(255,220,80,.12)'; ctx.strokeStyle='rgba(255,242,145,.8)'; ctx.lineWidth=2/s;
  for(const p of platforms){
    const pts=platformContour(p); ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
    for(const pt of pts.slice(1))ctx.lineTo(pt[0],pt[1]);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.9)'; ctx.font='bold 12px system-ui'; ctx.fillText('arrastra',p.x+6,p.y+16);
    ctx.fillStyle='#fff'; ctx.strokeStyle='#162b2c'; ctx.lineWidth=1/s;
    for(const [hx,hy] of [[p.x,p.y],[p.x+p.w/2,p.y],[p.x+p.w,p.y],[p.x,p.y+p.h/2],[p.x+p.w,p.y+p.h/2],[p.x,p.y+p.h],[p.x+p.w/2,p.y+p.h],[p.x+p.w,p.y+p.h]]){ ctx.beginPath(); ctx.arc(hx,hy,7/s,0,Math.PI*2); ctx.fill(); ctx.stroke(); }
  }
  // Colisión especial de la escalera: se muestra como una guía por peldaño.
  ctx.strokeStyle='rgba(255,150,70,.95)'; ctx.fillStyle='rgba(255,150,70,.9)'; ctx.lineWidth=3/s;
  for(let x=1300;x<1485;x+=31){ const y=stairHeight(x+15); if(y===null)continue; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(Math.min(x+31,1485),y); ctx.stroke(); ctx.fillRect(x+3,y-18,7,7); }
  for(const p of stairSteps){ ctx.strokeRect(p.x,p.y,p.w,p.h); ctx.beginPath(); ctx.arc(p.x+p.w,p.y+p.h,7/s,0,Math.PI*2); ctx.fill(); }
  ctx.fillStyle='rgba(255,230,180,.95)'; ctx.font='bold 13px system-ui'; ctx.fillText('ESCALERA',1305,462);
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle='rgba(8,20,24,.82)'; ctx.fillRect(16,16,360,42);
  ctx.fillStyle='#fff'; ctx.font='bold 15px system-ui';
  ctx.fillText('EDITOR: arrastra colisiones · H salir · R restaurar',28,42);
  ctx.restore();
}
function platformContour(p){
  const cut=Math.min(18,p.w*.08), shoulder=Math.min(12,p.h*.18);
  return [[p.x,p.y],[p.x+p.w,p.y],[p.x+p.w,p.y+p.h-shoulder],[p.x+p.w-cut,p.y+p.h],[p.x+cut,p.y+p.h],[p.x,p.y+p.h-shoulder]];
}
function pointInPlatform(p,x,y){
  const pts=platformContour(p); let inside=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const xi=pts[i][0], yi=pts[i][1], xj=pts[j][0], yj=pts[j][1];
    const hit=((yi>y)!==(yj>y)) && x<(xj-xi)*(y-yi)/(yj-yi)+xi;
    if(hit)inside=!inside;
  }
  return inside;
}
function drawPlatformVolume(){
  const s=scale(), cam=cameraX();
  ctx.save(); ctx.scale(s,s); ctx.translate(-cam,0);
  for(const p of platforms){
    if(p.y>=700)continue;
    const depth=Math.min(10,p.h*.16);
    ctx.fillStyle='rgba(10,35,32,.16)';
    ctx.beginPath(); ctx.moveTo(p.x+5,p.y+depth); ctx.lineTo(p.x+p.w+5,p.y+depth); ctx.lineTo(p.x+p.w+8,p.y+p.h+6); ctx.lineTo(p.x+8,p.y+p.h+6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(224,255,126,.38)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(p.x+2,p.y+1); ctx.lineTo(p.x+p.w-2,p.y+1); ctx.stroke();
    ctx.strokeStyle='rgba(16,49,43,.32)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(p.x+4,p.y+p.h-2); ctx.lineTo(p.x+p.w-4,p.y+p.h-2); ctx.stroke();
  }
  ctx.restore();
}
function update(dt){
  const wakeInput=pressed('ArrowLeft','ArrowRight','KeyA','KeyD','Space','ArrowUp','ArrowDown','KeyW','KeyS','KeyC','KeyE','KeyX','KeyZ','ControlLeft','ControlRight');
  if(player.sleepTime>0){
    if(wakeInput){ player.sleepTime=0; player.idleTime=0; player.snoreTime=0; }
    else { player.sleepTime+=dt; player.snoreTime+=dt; if(player.snoreTime>=2.4){player.snoreTime=0;playSnore();} return; }
  }
  if(player.climbTime>0){
    player.climbTime+=dt;
    player.vx=0; player.vy=0;
    if(player.climbTime>0.28){
      player.y=player.hangPlatform.y-player.h;
      player.onGround=true;
      player.climbTime=0;
      player.hangPlatform=null;
    }
    return;
  }
  if(player.hangTime>0){
    const p=player.hangPlatform;
    const jumpAction = pressed('Space','ArrowUp','KeyW','KeyC','c','C') || runTapJump;
    const dropAction = pressed('ArrowDown','KeyS','s','S','KeyQ');
    const moveAway = (player.x < p.x && pressed('ArrowLeft','KeyA','a')) || (player.x > p.x && pressed('ArrowRight','KeyD','d'));
    const attackAction = pressed('KeyX','x','KeyZ','z');

    if(jumpAction){
      // Salto ágil para subir a la plataforma inmediatamente con Espacio o Arriba
      runTapJump = false;
      player.hangTime = 0;
      player.climbTime = 0;
      player.y = p.y - player.h - 6;
      player.vy = -380;
      player.onGround = true;
      player.jumpCount = 1;
      player.hangPlatform = null;
      playStep('stone');
      return;
    } else if(dropAction || moveAway || attackAction){
      // Soltarse al instante si presionas cualquier tecla de dirección contraria o agacharse
      player.hangTime = 0;
      player.climbTime = 0;
      player.hangPlatform = null;
      player.vy = 80;
      return;
    } else {
      player.hangTime += dt;
      player.vx = 0; player.vy = 0; player.y = p.y - 65;
      // Auto-soltarse tras 1.2 segundos para que NUNCA se quede pegado
      if(player.hangTime > 1.2){
        player.hangTime = 0;
        player.hangPlatform = null;
        player.vy = 80;
      }
      return;
    }
  }
  const attackPressed=pressed('KeyX','x','X','KeyZ','z','Z','KeyJ','j','J');
  if(attackPressed && !player.attackLatch && player.attackTime<=0 && player.swordTime<=0){
    player.swordOut=true;
    if(player.comboTimer > 0){
      player.comboStep = (player.comboStep + 1) % 3;
    } else {
      player.comboStep = 0;
    }
    player.attackTime=0.001;
    player.comboTimer=0.85;
    playSwordSwing(player.comboStep);
    player.vx = player.face * (player.comboStep === 2 ? 220 : 130);
  }
  player.attackLatch=attackPressed;
  if(player.comboTimer > 0) player.comboTimer -= dt;
  if(player.attackTime > 0) player.attackTime += dt;
  const attackDuration = player.comboStep === 2 ? 0.46 : 0.36;
  if(player.attackTime >= attackDuration) player.attackTime = 0;
  const swordPressed=pressed('KeyE','e','E','KeyK','k','K');
  if(swordPressed && !player.swordLatch && player.swordTime<=0 && player.attackTime<=0){ player.swordOut=!player.swordOut; player.swordTime=.001; }
  player.swordLatch=swordPressed;
  if(player.swordTime>0) player.swordTime+=dt;
  if(player.swordTime>=.64) player.swordTime=0;
  const left=pressed('ArrowLeft','a','KeyA'), right=pressed('ArrowRight','d','KeyD');
  const running=pressed('ShiftLeft','ShiftRight','Shift','ControlLeft','ControlRight','Control');
  const crouching=pressed('ArrowDown','KeyS','s','S') && player.onGround && player.hangTime<=0 && player.attackTime<=0 && player.swordTime<=0;
  if(crouching) player.crouchTime+=dt; else player.crouchTime=0;
  const attackSpeed=player.attackTime>0?150:running?360:230;
  player.vx=(player.swordTime>0||player.hangTime>0||crouching)?0:(right?attackSpeed:0)-(left?attackSpeed:0); if(player.vx) player.face=player.vx>0?1:-1;
  const jumpPressed=pressed('Space','ArrowUp','w','KeyW','KeyC','c','C')||runTapJump;
  if(jumpPressed && !player.jumpLatch){
    if(player.onGround){ player.vy=-520; player.onGround=false; player.jumpCount=1; }
    else if(player.jumpCount===1){ player.vy=-470; player.jumpCount=2; player.doubleJumpTime=.001; }
  }
  player.jumpLatch=jumpPressed;
  runTapJump=false;
  const oldX=player.x, oldY=player.y, wasGrounded=player.onGround; player.x=Math.max(0,Math.min(world.w-player.w,player.x+player.vx*dt)); player.vy+=1250*dt; player.y+=player.vy*dt; player.onGround=false;
  if(player.vy>0 && !player.onGround){
    for(const p of platforms){
      if(p.y >= 500) continue; // Nunca colgarse del suelo
      const nearLeft = Math.abs((player.x + player.w) - p.x) < 14 && player.x < p.x;
      const nearRight = Math.abs(player.x - (p.x + p.w)) < 14 && player.x + player.w > p.x + p.w;
      const handsAtLedge = oldY < p.y - 35 && player.y >= p.y - 75 && player.y <= p.y - 20;
      if(handsAtLedge && (nearLeft || nearRight)){
        player.hangPlatform = p;
        player.hangTime = 0.001;
        player.x = nearLeft ? p.x - player.w + 6 : p.x + p.w - 6;
        player.y = p.y - 65;
        player.vy = 0;
        break;
      }
    }
  }
  const stairY=stairHeight(player.x+player.w/2);
  if(stairY!==null && player.vy>=0 && (wasGrounded?Math.abs(oldY+player.h-stairY)<=50:oldY+player.h<=stairY) && player.y+player.h>=stairY-50){
    player.y=stairY-player.h; player.vy=0; player.onGround=true;
  }
  const wasAir = !wasGrounded && player.vy > 100;
  for(const p of platforms){
    const overlapsX=player.x+player.w>p.x && player.x<p.x+p.w;
    if(player.vy<0 && overlapsX && oldY>=p.y+p.h && player.y<=p.y+p.h){
      player.y=p.y+p.h; player.vy=0;
    }
  }
  if(player.hangTime<=0){
    for(const p of platforms){
      const overlapsY=pointInPlatform(p,player.x+player.w/2,player.y+player.h*.25)||pointInPlatform(p,player.x+player.w/2,player.y+player.h*.75);
      if(!overlapsY)continue;
      if(player.vx>0 && oldX+player.w<=p.x && player.x+player.w>p.x){ player.x=p.x-player.w; player.vx=0; }
      if(player.vx<0 && oldX>=p.x+p.w && player.x<p.x+p.w){ player.x=p.x+p.w; player.vx=0; }
    }
  }
  for(const p of platforms){ if(player.vy>=0 && oldY+player.h<=p.y && player.y+player.h>=p.y && player.x+player.w>p.x && player.x<p.x+p.w){ player.y=p.y-player.h; player.vy=0; player.onGround=true; } }
  if(wasAir && player.onGround){ player.landTime=0.12; player.jumpCount=0; player.doubleJumpTime=0; }
  if(player.landTime>0) player.landTime-=dt;
  if(player.hurtTime>0) player.hurtTime-=dt;
  if(player.y>world.h+80){player.x=110;player.y=409;player.vy=0;}

  // Actualización, IA agresiva y combate de enemigos Tiki
  for(const enemy of enemies){
    if(enemy.state==='hit'){
      enemy.deadTimer+=dt;
      if(enemy.deadTimer>10){ enemy.state='patrol'; enemy.deadTimer=0; }
      continue;
    }

    const dx = (player.x+player.w/2) - (enemy.x+enemy.w/2);
    const dy = (player.y+player.h/2) - (enemy.y+enemy.h/2);
    const dist = Math.hypot(dx, dy);

    // Ataque con espada impacta al Tiki
    const attacking = player.attackTime>0.06 && player.attackTime<(attackDuration-0.04);
    const facing = (player.face>0 && dx<0) || (player.face<0 && dx>0);
    const reach = player.comboStep === 2 ? 115 : 95;
    if(attacking && facing && Math.abs(dx)<reach && Math.abs(dy)<65){
      enemy.state='hit'; enemy.deadTimer=0.001;
      playSwordHit();
      screenShake = 0.09;
      spawnSlashSparks(enemy.x+enemy.w/2, enemy.y+enemy.h/2, player.comboStep === 2 ? 18 : 12);
      continue;
    }

    // Salto o pisotón sobre la cabeza del Tiki
    if(player.vy>60 && player.y+player.h>=enemy.y-5 && player.y+player.h<=enemy.y+35 && Math.abs(dx)<45){
      enemy.state='hit'; enemy.deadTimer=0.001; player.vy=-450; player.jumpCount=1;
      playStep('stone');
      spawnSlashSparks(enemy.x+enemy.w/2, enemy.y+15, 10, '#ffffff');
      continue;
    }

    // Comportamiento activo del Tiki: patrulla, persecución y estocada
    const inPerception = Math.abs(dx) < 250 && Math.abs(dy) < 65;
    if(enemy.state === 'attack'){
      enemy.attackTimer -= dt;
      // Daño al jugador si la estocada conecta
      if(enemy.attackTimer > 0.15 && enemy.attackTimer < 0.45 && Math.abs(dx) < 65 && Math.abs(dy) < 55){
        if(player.hurtTime <= 0 && player.sleepTime <= 0){
          player.hurtTime = 0.9;
          player.vx = (dx >= 0 ? 1 : -1) * 280;
          player.vy = -260;
          player.onGround = false;
          playStep('grass');
        }
      }
      if(enemy.attackTimer <= 0){
        enemy.state = inPerception ? 'chase' : 'patrol';
      }
    } else if(inPerception){
      // Modo persecución: corre activamente hacia el jugador
      enemy.state = 'chase';
      enemy.face = dx < 0 ? 1 : -1;
      const chaseSpeed = 145;
      enemy.x += enemy.face * chaseSpeed * dt;
      enemy.x = Math.max(enemy.minX - 25, Math.min(enemy.maxX + 25, enemy.x));
      enemy.anim += dt * 10.5;

      // Si está a distancia de ataque, lanza estocada con lanza
      if(Math.abs(dx) < 70 && Math.abs(dy) < 50){
        enemy.state = 'attack';
        enemy.attackTimer = 0.52;
      }
    } else {
      // Modo patrullaje continuo y activo
      enemy.state = 'patrol';
      enemy.x += enemy.vx * enemy.face * dt;
      if(enemy.face > 0 && enemy.x >= enemy.maxX){ enemy.x = enemy.maxX; enemy.face = -1; }
      else if(enemy.face < 0 && enemy.x <= enemy.minX){ enemy.x = enemy.minX; enemy.face = 1; }
      enemy.anim += dt * 7.5;
    }

    // Daño por contacto general si no está noqueado
    if(dist < 46 && player.hurtTime <= 0 && player.sleepTime <= 0 && enemy.state !== 'hit'){
      player.hurtTime = 0.9;
      player.vx = (dx >= 0 ? 1 : -1) * 260;
      player.vy = -280;
      player.onGround = false;
      playStep('grass');
    }
  }

  if(Math.abs(player.vx)>0 && player.onGround){ player.anim+=dt*(running?14:9); player.frame=Math.floor(player.anim)%8; }
  else if(player.onGround){ player.anim+=dt*5; player.frame=Math.floor(player.anim)%6; }
  else { player.anim=0; player.frame=0; }
  if(player.doubleJumpTime>0)player.doubleJumpTime+=dt;
  player.running=running && Math.abs(player.vx)>0;
  if(Math.abs(player.vx)>0 && player.onGround){
    stepDistance+=Math.abs(player.vx)*dt;
    if(stepDistance>=78){ stepDistance=0; playStep(stairHeight(player.x+player.w/2)!==null?'stone':'grass'); }
  }else if(!player.onGround)stepDistance=0;
  if(player.onGround && !player.vx && !jumpPressed && !attackPressed && !swordPressed && !crouching && player.hangTime<=0) player.idleTime=Math.min(15,player.idleTime+dt);
  else player.idleTime=0;
  if(player.idleTime>=15 && player.sleepTime<=0) player.sleepTime=.001;

  if(screenShake > 0) screenShake -= dt;
  for(let i=particles.length-1; i>=0; i--){
    const p = particles[i];
    p.life -= dt;
    if(p.life <= 0){ particles.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 420 * dt;
  }
}
const FRAMES = {
  idle:   { scale: 124/624, list: [{x:38,w:275,cx:142,fy:680},{x:399,w:277,cx:143,fy:680},{x:761,w:281,cx:145,fy:680},{x:1120,w:275,cx:142,fy:680},{x:1482,w:273,cx:142,fy:680},{x:1846,w:275,cx:140,fy:680}] },
  crouch: { scale: 124/369, list: [{x:27,w:187,cx:101,fy:577},{x:264,w:175,cx:92,fy:578},{x:487,w:170,cx:92,fy:577},{x:712,w:177,cx:91,fy:575},{x:943,w:175,cx:90,fy:576},{x:1166,w:176,cx:89,fy:576}] },
  walk:   { scale: 124/586, list: [{x:0,w:281,cx:135,fy:652},{x:278,w:235,cx:131,fy:652},{x:554,w:233,cx:127,fy:652},{x:825,w:267,cx:127,fy:652},{x:1089,w:287,cx:136,fy:652},{x:1372,w:245,cx:124,fy:652},{x:1640,w:239,cx:126,fy:652},{x:1912,w:260,cx:126,fy:652}] },
  // Los anchos terminan antes del siguiente fotograma para evitar que se filtre su dibujo.
  run:    { scale: 124/564, list: [{x:6,w:285,cx:139,fy:642},{x:295,w:232,cx:121,fy:642},{x:531,w:288,cx:154,fy:642},{x:823,w:283,cx:135,fy:642},{x:1110,w:264,cx:112,fy:642},{x:1378,w:234,cx:119,fy:642},{x:1616,w:286,cx:150,fy:642},{x:1906,w:258,cx:128,fy:642}] },
  jump:   { scale: 124/540, list: [{x:30,w:259,cx:130,fy:662},{x:312,w:225,cx:110,fy:662},{x:535,w:275,cx:145,fy:662},{x:826,w:269,cx:127,fy:662},{x:1097,w:259,cx:130,fy:662},{x:1382,w:233,cx:115,fy:662},{x:1646,w:241,cx:124,fy:662},{x:1910,w:231,cx:120,fy:662}] },
  doubleJump: { scale: 124/360 },
  sleep: { scale: 124/360 },
  hangOnly: { scale: 124/420 },
  climbOnly: { scale: 124/470 },
  sword:  { scale: 124/550, list: [{x:6,w:247,cx:130,fy:640},{x:272,w:251,cx:131,fy:640},{x:541,w:251,cx:131,fy:640},{x:808,w:251,cx:131,fy:640},{x:1077,w:251,cx:127,fy:640},{x:1343,w:259,cx:128,fy:640},{x:1607,w:267,cx:131,fy:640},{x:1875,w:293,cx:130,fy:640}] },
  attack: {
    scale: 124 / 470,
    list: [
      {x: 16, w: 237, cx: 118, fy: 607},
      {x: 277, w: 232, cx: 116, fy: 607},
      {x: 551, w: 195, cx: 97, fy: 606},
      {x: 785, w: 245, cx: 122, fy: 606},
      {x: 1030, w: 300, cx: 150, fy: 607},
      {x: 1330, w: 290, cx: 145, fy: 606},
      {x: 1620, w: 253, cx: 126, fy: 607},
      {x: 1915, w: 240, cx: 120, fy: 607}
    ]
  },
  hang:   { scale: 124/520 },
  climb:  { scale: 124/300 }
};
function render(){
  document.querySelector('.climb').hidden=player.hangTime<=0;
  ctx.clearRect(0,0,innerWidth,gameHeight());

  let shakeX = 0, shakeY = 0;
  if(screenShake > 0){
    shakeX = (Math.random() - 0.5) * 8 * (screenShake / 0.08);
    shakeY = (Math.random() - 0.5) * 6 * (screenShake / 0.08);
  }
  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawWorld(bg); drawAtmosphere(performance.now()); drawPlatformVolume(); drawCollisionDebug();
  const s=scale(), cam=cameraX(), px=(player.x-cam)*s, py=player.y*s;
  const moving=Math.abs(player.vx)>0 && player.onGround;
  const crouching=pressed('ArrowDown','KeyS');
  const jumping=!player.onGround;

  // Render enemigos Tiki
  if(enemySheet.complete && enemySheet.naturalWidth){
    const sc = 96 / 550;
    for(const enemy of enemies){
      if(enemy.state === 'hit' && enemy.deadTimer > 4.5) continue;
      let fIdx = 0;
      if(enemy.state === 'hit'){
        fIdx = 6 + (Math.floor(enemy.deadTimer * 5) % 2);
      } else if(enemy.state === 'attack'){
        fIdx = enemy.attackTimer > 0.32 ? 4 : 5;
      } else if(enemy.state === 'chase'){
        fIdx = Math.floor(enemy.anim) % 4;
      } else {
        fIdx = Math.floor(enemy.anim) % 4;
      }
      const f = ENEMY_FRAMES[fIdx];
      const ex = (enemy.x - cam) * s, ey = (enemy.y + enemy.h) * s;
      ctx.save();
      if(enemy.state === 'hit' && enemy.deadTimer > 3.0){
        ctx.globalAlpha = Math.max(0, 1 - (enemy.deadTimer - 3.0) / 1.5);
      }
      ctx.translate(ex + (enemy.w / 2) * s, ey);
      ctx.scale(enemy.face * s * sc, s * sc);
      ctx.drawImage(enemySheet, f.x, 0, f.w, enemySheet.height, -f.cx, -f.fy, f.w, enemySheet.height);
      ctx.restore();

      if(enemy.state === 'hit' && enemy.deadTimer <= 3.0){
        ctx.save();
        ctx.fillStyle = '#ffe066';
        ctx.font = 'bold 12px system-ui';
        const dizzyBob = Math.sin(enemy.deadTimer * 8) * 3;
        ctx.fillText('💫 K.O.!', ex - 2 * s, (enemy.y - 10) * s + dizzyBob);
        ctx.restore();
      } else if(enemy.state === 'chase' || enemy.state === 'attack'){
        ctx.save();
        ctx.fillStyle = '#ff3b3b';
        ctx.font = 'bold 14px system-ui';
        ctx.fillText('💢', ex + 6 * s, (enemy.y - 8) * s);
        ctx.restore();
      }
    }
  }

  let animKey='idle', activeSheet=idleSheet, frame=player.frame;
  if(player.sleepTime>0){ animKey='sleep'; activeSheet=sleepSheet; frame=player.sleepTime<1.2?Math.min(5,Math.floor(player.sleepTime/1.2*6)):2+Math.floor((player.sleepTime-1.2)*3)%4; }
  else if(player.climbTime>0){ animKey='climb'; activeSheet=climbSheet; frame=Math.min(11,Math.floor(player.climbTime*11)); }
  else if(player.hangTime>0){ animKey='hang'; activeSheet=hangSheet; frame=Math.min(7,Math.floor(player.hangTime*9)); }
  else if(player.attackTime>0){
    animKey='attack';
    activeSheet=comboSheet;
    const attackDuration = player.comboStep === 2 ? 0.46 : 0.36;
    const stepFrames = player.comboStep === 0 ? [0, 1, 3, 7] : player.comboStep === 1 ? [7, 5, 6, 0] : [1, 2, 4, 5, 7];
    const progress = Math.min(stepFrames.length - 1, Math.floor(player.attackTime / attackDuration * stepFrames.length));
    frame = stepFrames[progress];
  }
  else if(player.swordTime>0){ animKey='sword'; activeSheet=swordSheet; const step=Math.min(7,Math.floor(player.swordTime/.64*8)); frame=player.swordOut?step:7-step; }
  else if(player.doubleJumpTime>0 && jumping){ animKey='doubleJump'; activeSheet=doubleJumpSheet; frame=Math.min(7,Math.floor(player.doubleJumpTime/.72*8)); }
  else if(jumping){ animKey='jump'; activeSheet=jumpSheet; frame=player.vy<-300?1:player.vy<-80?2:player.vy<120?3:player.vy<320?5:6; }
  else if(player.landTime>0){ animKey='jump'; activeSheet=jumpSheet; frame=7; }
  else if(crouching){ animKey='crouch'; activeSheet=crouchSheet; frame=Math.min(4,Math.floor(player.crouchTime*16)); }
  else if(player.swordOut && moving){ animKey='swordRun'; activeSheet=swordRunSheet; frame=player.frame; }
  else if(player.swordOut){ animKey='sword'; activeSheet=swordSheet; frame=7; }
  else if(player.running){ animKey='run'; activeSheet=runSheet; }
  else if(moving){ animKey='walk'; activeSheet=sheet; }

  if(activeSheet.complete && activeSheet.width){
    const meta=FRAMES[animKey];
    const f=meta?.list ? meta.list[frame % meta.list.length] : null;
    const sc=meta?.scale || 124/460;
    const fh=activeSheet.height;
    ctx.save();
    if(player.hurtTime > 0 && Math.floor(player.hurtTime * 24) % 2 === 0){
      ctx.globalAlpha = 0.35;
    }
    ctx.translate(px+player.w*s/2, py+player.h*s);
    ctx.scale(player.face*s*sc, s*sc);
    if(animKey==='swordRun' || animKey==='doubleJump' || animKey==='sleep' || animKey==='hang' || animKey==='climb'){
      const count=animKey==='sleep'?6:animKey==='climb'?12:8, fw=activeSheet.width/count;
      const inset=animKey==='sleep'?4:animKey==='hang'||animKey==='climb'?4:0;
      const drawY=animKey==='sleep'?-520:animKey==='hang'?-320:animKey==='climb'?-520:-624;
      ctx.drawImage(activeSheet, frame*fw+inset, 0, fw-inset*2, fh, -fw/2+inset, drawY, fw-inset*2, fh);
    }else ctx.drawImage(activeSheet, f.x, 0, f.w, fh, -f.cx, -f.fy, f.w, fh);
    ctx.restore();
  }

  // Efecto visual de arco cortante luminoso (Slash Arc FX)
  const curAtkDuration = player.comboStep === 2 ? 0.46 : 0.36;
  if(player.attackTime > 0.04 && player.attackTime < curAtkDuration - 0.03){
    const progress = player.attackTime / curAtkDuration;
    ctx.save();
    ctx.translate(px + (player.w * s) / 2, py + (player.h * s) * 0.52);
    ctx.scale(player.face * s, s);
    const step = player.comboStep;

    if(step === 0){
      // Combo 1: Tajo horizontal veloz cian/blanco
      ctx.rotate(-0.15 + progress * 0.3);
      const grad = ctx.createLinearGradient(15, 0, 95, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0.95)');
      grad.addColorStop(0.45, 'rgba(90,230,255,0.85)');
      grad.addColorStop(1, 'rgba(0,180,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(15, -18);
      ctx.quadraticCurveTo(65, -35, 105, 0);
      ctx.quadraticCurveTo(60, 32, 20, 18);
      ctx.quadraticCurveTo(45, 0, 15, -18);
      ctx.fill();
    } else if(step === 1){
      // Combo 2: Tajo ascendente enérgico dorado/ámbar
      ctx.rotate(0.35 - progress * 0.7);
      const grad = ctx.createLinearGradient(15, 25, 95, -30);
      grad.addColorStop(0, 'rgba(255,255,255,0.98)');
      grad.addColorStop(0.45, 'rgba(255,220,70,0.9)');
      grad.addColorStop(1, 'rgba(255,140,20,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(15, 28);
      ctx.quadraticCurveTo(60, 38, 102, -12);
      ctx.quadraticCurveTo(70, -48, 25, -22);
      ctx.quadraticCurveTo(48, 0, 15, 28);
      ctx.fill();
    } else {
      // Combo 3: Golpe de poder pesado con llamarada
      ctx.rotate(-0.65 + progress * 1.3);
      const grad = ctx.createRadialGradient(50, 0, 10, 50, 0, 125);
      grad.addColorStop(0, 'rgba(255,255,255,0.99)');
      grad.addColorStop(0.35, 'rgba(255,210,40,0.95)');
      grad.addColorStop(0.7, 'rgba(255,60,20,0.8)');
      grad.addColorStop(1, 'rgba(255,30,10,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(20, -70);
      ctx.quadraticCurveTo(100, -60, 128, 25);
      ctx.quadraticCurveTo(90, 85, 25, 50);
      ctx.quadraticCurveTo(65, 0, 20, -70);
      ctx.fill();
    }
    ctx.restore();
  }

  // Render partículas de impacto y chispas
  for(const p of particles){
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    const sx = (p.x - cam) * s, sy = p.y * s;
    ctx.fillRect(sx - (p.size * s) / 2, sy - (p.size * s) / 2, p.size * s, p.size * s);
    ctx.restore();
  }

  // Indicador de Combo sobre el jugador
  if(player.comboTimer > 0){
    ctx.save();
    ctx.fillStyle = player.comboStep === 2 ? '#ff5252' : (player.comboStep === 1 ? '#ffd740' : '#69f0ae');
    ctx.font = 'bold 15px system-ui';
    const comboLabel = player.comboStep === 2 ? '🔥 COMBO 3: ¡GOLPE DE PODER!' : (player.comboStep === 1 ? '⚡ COMBO 2: ¡TAJO ASCENDENTE!' : '⚔ COMBO 1: TAJO VELOZ');
    ctx.fillText(comboLabel, px - 35 * s, (player.y - 18) * s);
    ctx.restore();
  }

  const stateTxt = player.climbTime>0?'SUBIENDO':player.attackTime>0?'ATACANDO':player.swordTime>0?(player.swordOut?'DESENVAINANDO':'ENVAINANDO'):jumping?'SALTANDO':crouching?'AGACHADO':player.running?'CORRIENDO':moving?'CAMINANDO':'QUIETO';
  ctx.fillStyle='#ffffffcc'; ctx.font='bold 15px system-ui'; ctx.fillText('Movimiento: '+stateTxt,18,gameHeight()-18);
  const defeated = enemies.filter(e => e.state === 'hit').length;
  ctx.fillStyle='#ffe066'; ctx.font='bold 15px system-ui';
  ctx.fillText('Tikis K.O.: ' + defeated + ' / ' + enemies.length, innerWidth - 170, 32);
  if(player.idleTime>0){ const remaining=Math.max(0,15-player.idleTime); ctx.fillStyle='#fff4c9e8'; ctx.font='bold 16px system-ui'; ctx.fillText(remaining>0?'Sueño en: '+remaining.toFixed(1)+' s':'Preparando sueño…',18,gameHeight()-42); }
  if(player.sleepTime>0){ const bob=Math.sin(player.sleepTime*2)*2; ctx.save(); ctx.globalAlpha=.72+.2*Math.sin(player.sleepTime*3); ctx.fillStyle='#fff4c9'; ctx.font='bold 20px system-ui'; ctx.fillText('Z',px+player.w*s*.58,py+10*s-bob); ctx.font='bold 15px system-ui'; ctx.fillText('z',px+player.w*s*.78,py-5*s-bob); ctx.font='bold 12px system-ui'; ctx.fillText('z',px+player.w*s*.94,py-18*s-bob); ctx.restore(); }
  ctx.restore(); // Screen shake restore
}
function loop(now){ const dt=Math.min((now-last)/1000,.033); last=now; update(dt); render(); requestAnimationFrame(loop); }
const loadImg = img => (img.complete && img.naturalWidth !== 0) ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; });
Promise.all([
  loadImg(bg), loadImg(sheet), loadImg(runSheet), loadImg(swordRunSheet),
  loadImg(idleSheet), loadImg(swordSheet), loadImg(comboSheet), loadImg(crouchSheet),
  loadImg(jumpSheet), loadImg(doubleJumpSheet), loadImg(sleepSheet), loadImg(hangSheet),
  loadImg(climbSheet), loadImg(enemySheet)
]).then(() => requestAnimationFrame(loop));

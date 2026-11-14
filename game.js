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
bg.src = 'assets/nivel_tropical_plataformas_v1.webp';
sheet.src = 'assets/explorador_caminar_master_v1.webp';
runSheet.src = 'assets/explorador_correr_master_v1.webp?v=f28c70d';
swordRunSheet.src = 'assets/explorador_correr_espada_master_v2.webp';
idleSheet.src = 'assets/explorador_idle_master_v1.webp';
swordSheet.src = 'assets/explorador_espada_master_v2.webp';
comboSheet.src = 'assets/explorador_ataque_master_v4.png?v=1';
crouchSheet.src = 'assets/explorador_agacharse_master_v1.png';
jumpSheet.src = 'assets/explorador_salto_master_v1.webp';
doubleJumpSheet.src = 'assets/explorador_doble_salto_master_v1.png?v=2';
doubleJumpSheet.onerror = () => { doubleJumpSheet.src = 'assets/explorador_salto_master_v1.webp'; };
sleepSheet.src = 'assets/explorador_dormir_master_v1.png?v=1';
hangSheet.src = 'assets/explorador_colgado_personaje_v3.png?v=1';
climbSheet.src = 'assets/explorador_subir_personaje_v2.png?v=1';
platformTexture.src = 'assets/plataforma_tropical_textura_v1.png?v=1';

const keyboardKeys = new Set();
const touchKeys = new Set();
let runTapJump=false;
let collisionDebug=false;
addEventListener('keydown', e => {
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','ControlLeft','ControlRight','KeyZ','KeyX','KeyE','KeyC'].includes(e.code)) e.preventDefault();
  if(e.code) keyboardKeys.add(e.code);
  if(e.code==='KeyH') collisionDebug=!collisionDebug;
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

const world = { w: 1668, h: 941 };
const platforms = [
  {x:0,y:744,w:1668,h:197}, {x:205,y:524,w:265,h:70}, {x:330,y:300,w:225,h:65},
  {x:625,y:425,w:395,h:76}, {x:1058,y:535,w:266,h:70}, {x:1095,y:290,w:275,h:70}, {x:1485,y:545,w:183,h:217}
];
// Altura de cada peldaño de la escalera de piedra dibujada a la derecha.
function stairHeight(x){
  if(x<1300||x>1560)return null;
  if(x>=1485)return 545;
  const heights=[714,684,654,624,594,564];
  return heights[Math.min(5,Math.floor((x-1300)/31))];
}
const player = {x:110,y:620,w:62,h:124,vx:0,vy:0,onGround:false,face:1,frame:0,anim:0,running:false,idleTime:0,sleepTime:0,snoreTime:0,jumpCount:0,jumpLatch:false,doubleJumpTime:0,swordTime:0,swordOut:false,swordLatch:false,attackLatch:false,attackTime:0,hangTime:0,climbTime:0,hangPlatform:null,landTime:0,crouchTime:0};
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
function scale(){ return Math.max(innerWidth/world.w, gameHeight()/world.h); }
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
  for(const p of platforms){ctx.fillRect(p.x,p.y,p.w,Math.min(8,p.h));ctx.strokeRect(p.x,p.y,p.w,p.h);}
  ctx.restore();
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
function drawPlatformTexture(){
  if(!platformTexture.complete || !platformTexture.width)return;
  const p=platforms[3], s=scale(), cam=cameraX();
  ctx.save(); ctx.globalAlpha=.98;
  ctx.drawImage(platformTexture,(p.x-cam)*s,p.y*s,p.w*s,105*s);
  ctx.restore();
}
function update(dt){
  const wakeInput=pressed('ArrowLeft','ArrowRight','KeyA','KeyD','Space','ArrowUp','ArrowDown','KeyW','KeyS','KeyC','KeyE','KeyX','KeyZ','ControlLeft','ControlRight');
  if(player.sleepTime>0){
    if(wakeInput){ player.sleepTime=0; player.idleTime=0; player.snoreTime=0; }
    else { player.sleepTime+=dt; player.snoreTime+=dt; if(player.snoreTime>=2.4){player.snoreTime=0;playSnore();} return; }
  }
  if(player.climbTime>0){ const previous=player.climbTime; player.climbTime+=dt; player.vx=0; player.vy=0; if(Math.floor(previous*4)!==Math.floor(player.climbTime*4))playStep('stone'); if(player.climbTime>1.05){ player.y=player.hangPlatform.y-player.h; player.onGround=true; player.climbTime=0; player.hangPlatform=null; } return; }
  if(player.hangTime>0){
    const p=player.hangPlatform;
    if(pressed('ArrowUp','KeyW')||runTapJump){ runTapJump=false; player.hangTime=0; player.climbTime=.001; }
    else if(pressed('ArrowDown','KeyS') || pressed('KeyQ')){ player.hangTime=0; player.vy=80; }
    else { player.hangTime=Math.min(player.hangTime+dt,.85); player.vx=0; player.vy=0; player.y=p.y-65; return; }
  }
  const attackPressed=pressed('KeyX','x','X','KeyZ','z','Z','KeyJ','j','J');
  if(attackPressed && !player.attackLatch && player.swordOut && player.attackTime<=0 && player.swordTime<=0) player.attackTime=.001;
  player.attackLatch=attackPressed;
  const swordPressed=pressed('KeyE','e','E','KeyK','k','K');
  if(swordPressed && !player.swordLatch && player.swordTime<=0 && player.attackTime<=0){ player.swordOut=!player.swordOut; player.swordTime=.001; }
  player.swordLatch=swordPressed;
  if(player.swordTime>0) player.swordTime+=dt;
  if(player.attackTime>0) player.attackTime+=dt;
  if(player.attackTime>=.64) player.attackTime=0;
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
      const nearLeft=Math.abs((player.x+player.w)-p.x)<70 && player.x+player.w>=p.x-70 && player.x<p.x+18;
      const nearRight=Math.abs(player.x-(p.x+p.w))<70 && player.x<=p.x+p.w+70 && player.x+player.w>p.x+p.w-18;
      const crossingTop=oldY+player.h<p.y && player.y+player.h>=p.y-12;
      if(crossingTop && (nearLeft||nearRight)){
        player.hangPlatform=p; player.hangTime=.001; player.x=nearLeft?p.x-player.w+8:p.x+p.w-8; player.y=p.y-65; player.vy=0; break;
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
      const overlapsY=player.y<p.y+p.h && player.y+player.h>p.y;
      if(!overlapsY)continue;
      if(player.vx>0 && oldX+player.w<=p.x && player.x+player.w>p.x){ player.x=p.x-player.w; player.vx=0; }
      if(player.vx<0 && oldX>=p.x+p.w && player.x<p.x+p.w){ player.x=p.x+p.w; player.vx=0; }
    }
  }
  for(const p of platforms){ if(player.vy>=0 && oldY+player.h<=p.y && player.y+player.h>=p.y && player.x+player.w>p.x && player.x<p.x+p.w){ player.y=p.y-player.h; player.vy=0; player.onGround=true; } }
  if(wasAir && player.onGround){ player.landTime=0.12; player.jumpCount=0; player.doubleJumpTime=0; }
  if(player.landTime>0) player.landTime-=dt;
  if(player.y>world.h+100){player.x=110;player.y=600;player.vy=0;}
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
}
const FRAMES = {
  idle:   { scale: 124/624, list: [{x:38,w:275,cx:142,fy:680},{x:399,w:277,cx:143,fy:680},{x:761,w:281,cx:145,fy:680},{x:1120,w:275,cx:142,fy:680},{x:1482,w:273,cx:142,fy:680},{x:1846,w:275,cx:140,fy:680}] },
  crouch: { scale: 124/369, list: [{x:27,w:187,cx:101,fy:577},{x:264,w:175,cx:92,fy:578},{x:487,w:170,cx:92,fy:577},{x:712,w:177,cx:91,fy:575},{x:943,w:175,cx:90,fy:576},{x:1166,w:176,cx:89,fy:576}] },
  walk:   { scale: 124/586, list: [{x:0,w:281,cx:135,fy:652},{x:278,w:235,cx:131,fy:652},{x:554,w:233,cx:127,fy:652},{x:825,w:267,cx:127,fy:652},{x:1089,w:287,cx:136,fy:652},{x:1372,w:245,cx:124,fy:652},{x:1640,w:239,cx:126,fy:652},{x:1912,w:260,cx:126,fy:652}] },
  // Los anchos terminan antes del siguiente fotograma para evitar que se filtre su dibujo.
  run:    { scale: 124/564, list: [{x:6,w:285,cx:139,fy:642},{x:295,w:232,cx:121,fy:642},{x:531,w:288,cx:154,fy:642},{x:823,w:283,cx:135,fy:642},{x:1110,w:264,cx:112,fy:642},{x:1378,w:234,cx:119,fy:642},{x:1616,w:286,cx:150,fy:642},{x:1906,w:258,cx:128,fy:642}] },
  jump:   { scale: 124/540, list: [{x:30,w:259,cx:130,fy:662},{x:312,w:225,cx:110,fy:662},{x:535,w:275,cx:145,fy:662},{x:826,w:269,cx:127,fy:662},{x:1097,w:259,cx:130,fy:662},{x:1382,w:233,cx:115,fy:662},{x:1646,w:241,cx:124,fy:662},{x:1910,w:231,cx:120,fy:662}] },
  doubleJump: { scale: 124/470 },
  sleep: { scale: 124/360 },
  hangOnly: { scale: 124/420 },
  climbOnly: { scale: 124/470 },
  sword:  { scale: 124/550, list: [{x:6,w:247,cx:130,fy:640},{x:272,w:251,cx:131,fy:640},{x:541,w:251,cx:131,fy:640},{x:808,w:251,cx:131,fy:640},{x:1077,w:251,cx:127,fy:640},{x:1343,w:259,cx:128,fy:640},{x:1607,w:267,cx:131,fy:640},{x:1875,w:293,cx:130,fy:640}] },
  attack: { scale: 124/260 },
  hang:   { scale: 124/520 },
  climb:  { scale: 124/380 }
};
function render(){
  document.querySelector('.climb').hidden=player.hangTime<=0;
  ctx.clearRect(0,0,innerWidth,gameHeight()); drawWorld(bg); drawAtmosphere(performance.now()); drawPlatformVolume(); drawPlatformTexture(); drawCollisionDebug();
  const s=scale(), cam=cameraX(), px=(player.x-cam)*s, py=player.y*s;
  window.__tropicalCamera={scale:s,cameraX:cam,viewportWidth:innerWidth,viewportHeight:gameHeight()};
  const moving=Math.abs(player.vx)>0 && player.onGround;
  const crouching=pressed('ArrowDown','KeyS');
  const jumping=!player.onGround;
  let animKey='idle', activeSheet=idleSheet, frame=player.frame;
  if(player.sleepTime>0){ animKey='sleep'; activeSheet=sleepSheet; frame=player.sleepTime<1.2?Math.min(5,Math.floor(player.sleepTime/1.2*6)):2+Math.floor((player.sleepTime-1.2)*3)%4; }
  else if(player.climbTime>0){ animKey='climb'; activeSheet=climbSheet; frame=Math.min(11,Math.floor(player.climbTime*11)); }
  else if(player.hangTime>0){ animKey='hang'; activeSheet=hangSheet; frame=Math.min(7,Math.floor(player.hangTime*9)); }
  else if(player.attackTime>0){ animKey='attack'; activeSheet=comboSheet; frame=Math.min(11,Math.floor(player.attackTime/.64*12)); }
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
    ctx.translate(px+player.w*s/2, py+player.h*s);
    ctx.scale(player.face*s*sc, s*sc);
    if(animKey==='swordRun' || animKey==='doubleJump' || animKey==='sleep' || animKey==='attack' || animKey==='hang' || animKey==='climb'){
      const count=animKey==='sleep'?6:animKey==='attack'?12:animKey==='climb'?12:8, fw=activeSheet.width/count;
      const inset=animKey==='sleep'?4:animKey==='attack'?5:animKey==='hang'||animKey==='climb'?4:0;
      const drawY=animKey==='sleep'?-520:animKey==='attack'?-520:animKey==='hang'?-320:animKey==='climb'?-520:-624;
      ctx.drawImage(activeSheet, frame*fw+inset, 0, fw-inset*2, fh, -fw/2+inset, drawY, fw-inset*2, fh);
    }else ctx.drawImage(activeSheet, f.x, 0, f.w, fh, -f.cx, -f.fy, f.w, fh);
    ctx.restore();
  }
  const stateTxt = player.climbTime>0?'SUBIENDO':player.attackTime>0?'ATACANDO':player.swordTime>0?(player.swordOut?'DESENVAINANDO':'ENVAINANDO'):jumping?'SALTANDO':crouching?'AGACHADO':player.running?'CORRIENDO':moving?'CAMINANDO':'QUIETO';
  ctx.fillStyle='#ffffffcc'; ctx.font='bold 15px system-ui'; ctx.fillText('Movimiento: '+stateTxt,18,gameHeight()-18);
  if(player.idleTime>0){ const remaining=Math.max(0,15-player.idleTime); ctx.fillStyle='#fff4c9e8'; ctx.font='bold 16px system-ui'; ctx.fillText(remaining>0?'Sueño en: '+remaining.toFixed(1)+' s':'Preparando sueño…',18,gameHeight()-42); }
  if(player.sleepTime>0){ const bob=Math.sin(player.sleepTime*2)*2; ctx.save(); ctx.globalAlpha=.72+.2*Math.sin(player.sleepTime*3); ctx.fillStyle='#fff4c9'; ctx.font='bold 20px system-ui'; ctx.fillText('Z',px+player.w*s*.58,py+10*s-bob); ctx.font='bold 15px system-ui'; ctx.fillText('z',px+player.w*s*.78,py-5*s-bob); ctx.font='bold 12px system-ui'; ctx.fillText('z',px+player.w*s*.94,py-18*s-bob); ctx.restore(); }
}
function loop(now){ const dt=Math.min((now-last)/1000,.033); last=now; update(dt); render(); requestAnimationFrame(loop); }
Promise.all([new Promise(r=>bg.onload=r),new Promise(r=>sheet.onload=r),new Promise(r=>runSheet.onload=r),new Promise(r=>swordRunSheet.onload=r),new Promise(r=>idleSheet.onload=r),new Promise(r=>swordSheet.onload=r),new Promise(r=>comboSheet.onload=r),new Promise(r=>crouchSheet.onload=r),new Promise(r=>jumpSheet.onload=r),new Promise(r=>doubleJumpSheet.onload=r),new Promise(r=>sleepSheet.onload=r),new Promise(r=>hangSheet.onload=r),new Promise(r=>climbSheet.onload=r)]).then(()=>requestAnimationFrame(loop));

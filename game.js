// ============================================================================
// TALON TROPICAL — ENDLESS ACTION RUNNER (TIPO SUBWAY SURFERS CON COMBATE 3D)
// ============================================================================

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');

// IMÁGENES Y SPRITESHEETS MAESTROS EN ALTA RESOLUCIÓN
const bg = new Image();
const runSheet = new Image();
const idleSheet = new Image();
const crouchSheet = new Image();
const jumpSheet = new Image();
const slingSheet = new Image();
const cocoConchaWalkSheet = new Image();
const cocoPiratasSheet = new Image();
const cocoSheet = new Image();
const enemySheet = new Image();

bg.src = 'assets/nivel_tropical_runner_clean.png?v=22';
runSheet.src = 'assets/explorador_correr_master_v1.webp?v=4';
idleSheet.src = 'assets/explorador_idle_master_v1.webp?v=4';
crouchSheet.src = 'assets/explorador_agacharse_master_v1.webp?v=18';
jumpSheet.src = 'assets/explorador_salto_master_v1.webp?v=18';
slingSheet.src = 'assets/explorador_resortera_master_v2.webp?v=18';
cocoConchaWalkSheet.src = 'assets/coco_concha_walk_16frames.png';
cocoPiratasSheet.src = 'assets/coco_piratas_master_v1.png';
cocoSheet.src = 'assets/coco_salvaje_master_v1.png';
enemySheet.src = 'assets/enemigo_tiki_master_v2.png';

// CONSTANTES DEL MUNDO Y RESOLUCIÓN VIRTUAL
const VIEW_BASE = { w: 1668, h: 724 };
const BG_WIDTH = 2172;
const GROUND_Y = 521; // Altura exacta calibrada del suelo continuo de piedra
const MASTER_CHARACTER = { w: 62, h: 124 };

// DEFINICIÓN DE FOTOGRAMAS Y ESCALAS 3D
const FRAMES = {
  idle:   { scale: 138/560, list: [{"x": 70, "w": 223, "cx": 111, "fy": 660}, {"x": 442, "w": 203, "cx": 101, "fy": 660}, {"x": 811, "w": 189, "cx": 94, "fy": 660}, {"x": 1172, "w": 190, "cx": 95, "fy": 660}, {"x": 1531, "w": 197, "cx": 98, "fy": 660}, {"x": 1887, "w": 209, "cx": 104, "fy": 660}] },
  crouch: {
    scale: 124 / 550,
    list: [
      { x: 0,    w: 1000, cx: 500, fy: 660 },
      { x: 1000, w: 1000, cx: 500, fy: 660 },
      { x: 2000, w: 1000, cx: 500, fy: 660 },
      { x: 3000, w: 1000, cx: 500, fy: 660 },
      { x: 4000, w: 1000, cx: 500, fy: 660 },
      { x: 5000, w: 1000, cx: 500, fy: 660 }
    ]
  },
  run:    { scale: 128/545, list: [{"x": 51, "w": 261, "cx": 130, "fy": 660}, {"x": 401, "w": 284, "cx": 142, "fy": 660}, {"x": 765, "w": 280, "cx": 140, "fy": 660}, {"x": 1154, "w": 227, "cx": 113, "fy": 660}, {"x": 1510, "w": 238, "cx": 119, "fy": 660}, {"x": 1854, "w": 275, "cx": 137, "fy": 660}] },
  jump: {
    scale: 128 / 540,
    list: [
      { x: 0,    w: 1000, cx: 500, fy: 660 },
      { x: 1000, w: 1000, cx: 500, fy: 660 },
      { x: 2000, w: 1000, cx: 500, fy: 660 },
      { x: 3000, w: 1000, cx: 500, fy: 660 },
      { x: 4000, w: 1000, cx: 500, fy: 660 },
      { x: 5000, w: 1000, cx: 500, fy: 660 }
    ]
  },
  slingshot: {
    scale: 110 / 550,
    list: [
      { x: 0,    w: 1000, cx: 500, fy: 660 },
      { x: 1000, w: 1000, cx: 500, fy: 660 },
      { x: 2000, w: 1000, cx: 500, fy: 660 },
      { x: 3000, w: 1000, cx: 500, fy: 660 },
      { x: 4000, w: 1000, cx: 500, fy: 660 },
      { x: 5000, w: 1000, cx: 500, fy: 660 }
    ]
  }
};

// ESTADO DEL JUGADOR Y PROPIEDADES DE CORREDOR
const player = {
  x: 120,
  y: GROUND_Y - MASTER_CHARACTER.h,
  w: MASTER_CHARACTER.w,
  h: MASTER_CHARACTER.h,
  vx: 320,
  vy: 0,
  onGround: true,
  face: 1,
  frame: 0,
  anim: 0,
  jumpCount: 0,
  jumpLatch: false,
  doubleJumpTime: 0,
  attackLatch: false,
  attackTime: 0,
  slingFired: false,
  aimAngle: 0,
  crouching: false,
  crouchTime: 0,
  sliding: false,
  slideTime: 0,
  hurtTime: 0,
  hearts: 3,
  maxHearts: 3,
  shield: false,
  shieldTime: 0,
  magnetTime: 0
};

// ESTADÍSTICAS DEL JUEGO / CORREDOR INFINITO
let gameDistance = 0; // en metros (player.x / 18)
let highRecord = parseInt(localStorage.getItem('talon_runner_best_meters') || '0', 10);
let coinsCollected = 0;
let cocosDefeated = 0;
let comboStreak = 0;
let comboTimer = 0;
let isGameOver = false;
let gameOverTime = 0;
let isNewRecord = false;
let screenShake = 0;
let stepDistance = 0;

// COLECCIONES DINÁMICAS PROCEDURALES
const obstacles = [];  // { id, type: 'low_stump'|'high_barrier', x, y, w, h, broken: false }
const enemies = [];    // { id, type: 'coco_concha'|'coco_rodante'|'jefe_coco', x, y, w, h, vx, vy, hp, maxHp, state: 'run'|'hit', anim: 0, deadTimer: 0 }
const coins = [];      // { id, x, y, collected: false, rot: 0 }
const relics = [];     // { id, type: 'shield'|'gem'|'magnet', x, y, collected: false, color: '#ffd700', icon: '💎' }
const stones = [];     // Proyectiles de la resortera
const particles = [];  // Partículas y chispas
const floatingTexts = []; // Popups de texto estilo arcade: "+50", "COMBO x2!"

let nextSpawnX = 900;
let entityIdCounter = 1;

// SISTEMA DE ENTRADA Y CONTROLES
const keyboardKeys = new Set();
const touchKeys = new Set();
let runTapJump = false;

addEventListener('keydown', e => {
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','ControlLeft','ControlRight','KeyZ','KeyX','KeyC'].includes(e.code)) {
    e.preventDefault();
  }
  if(e.code) keyboardKeys.add(e.code);

  if(isGameOver && gameOverTime > 0.6 && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ' || e.code === 'KeyX')){
    restartRunner();
  }
});
addEventListener('keyup', e => {
  if(e.code) keyboardKeys.delete(e.code);
});
addEventListener('blur', () => keyboardKeys.clear());

document.querySelectorAll('[data-key]').forEach(btn => {
  const key = btn.dataset.key;
  if(btn.classList.contains('run')){
    let timer = null, holding = false, pointer = null;
    btn.addEventListener('pointerdown', e => {
      e.preventDefault(); btn.setPointerCapture(e.pointerId); pointer = e.pointerId; holding = false;
      timer = setTimeout(() => { holding = true; touchKeys.add('ControlLeft'); btn.classList.add('held'); }, 230);
    });
    const finish = e => {
      if(pointer !== e.pointerId) return;
      e.preventDefault(); clearTimeout(timer); touchKeys.delete('ControlLeft'); btn.classList.remove('held');
      if(e.type === 'pointerup' && !holding) runTapJump = true;
      pointer = null;
    };
    btn.addEventListener('pointerup', finish);
    btn.addEventListener('pointercancel', finish);
    btn.addEventListener('lostpointercapture', finish);
    return;
  }
  const down = e => { e.preventDefault(); touchKeys.add(key); };
  const up = e => { e.preventDefault(); touchKeys.delete(key); };
  btn.addEventListener('pointerdown', e => { btn.setPointerCapture(e.pointerId); down(e); });
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointercancel', up);
  btn.addEventListener('lostpointercapture', up);
});

// ESCALA Y TAMAÑO RESPONSIVO
function gameHeight() { return canvas.clientHeight || innerHeight; }
function scale() { return Math.max(innerWidth / VIEW_BASE.w, gameHeight() / VIEW_BASE.h); }
function cameraX() { return player.x - 260; }

function resize(){
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const height = Math.round(visualViewport?.height || innerHeight);
  document.documentElement.style.setProperty('--game-height', height + 'px');
  canvas.width = innerWidth * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
visualViewport?.addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();

// PANTALLA COMPLETA
const fullscreenButton = document.querySelector('#fullscreen');
fullscreenButton?.addEventListener('click', async () => {
  try {
    if(document.fullscreenElement) await document.exitFullscreen();
    else await document.querySelector('#game-wrap').requestFullscreen();
  } catch {}
});
document.addEventListener('fullscreenchange', () => {
  if(fullscreenButton){
    fullscreenButton.textContent = document.fullscreenElement ? '⤢' : '⛶';
  }
  resize();
});

// MENÚ Y MÚSICA
const music = document.querySelector('#music');
if(music) music.volume = 0.35;
let isInMenu = true;
let isMusicMuted = false;

const mainMenu = document.querySelector('#main-menu');
const btnPlay = document.querySelector('#btn-play');
const btnMusicToggle = document.querySelector('#btn-music-toggle');
const musicIcon = document.querySelector('#music-icon');
const musicText = document.querySelector('#music-text');
const btnOpenControls = document.querySelector('#btn-open-controls');
const controlsModal = document.querySelector('#controls-modal');
const btnCloseControls = document.querySelector('#btn-close-controls');
const btnModalStart = document.querySelector('#btn-modal-start');
const btnInGameMenu = document.querySelector('#btn-in-game-menu');

function startGame(){
  ensureAudio();
  playMenuConfirm();
  if(!isMusicMuted) startMusic();
  isInMenu = false;
  mainMenu?.classList.add('hidden');
  btnInGameMenu?.classList.remove('hidden');
  if(controlsModal) controlsModal.hidden = true;
  last = performance.now();
}

function openMainMenu(){
  ensureAudio();
  playMenuConfirm();
  isInMenu = true;
  mainMenu?.classList.remove('hidden');
  btnInGameMenu?.classList.add('hidden');
  const playText = btnPlay?.querySelector('.btn-play-text');
  if(playText) playText.textContent = '¡CONTINUAR!';
}

function toggleMusic(){
  ensureAudio();
  if(!music) return;
  if(music.paused){
    isMusicMuted = false;
    startMusic();
    if(musicText) musicText.textContent = 'Música: ON';
    if(musicIcon) musicIcon.textContent = '🎵';
  } else {
    isMusicMuted = true;
    music.pause();
    if(musicText) musicText.textContent = 'Música: OFF';
    if(musicIcon) musicIcon.textContent = '🔇';
  }
}

btnPlay?.addEventListener('click', startGame);
btnModalStart?.addEventListener('click', startGame);
btnInGameMenu?.addEventListener('click', openMainMenu);
btnMusicToggle?.addEventListener('click', toggleMusic);
btnOpenControls?.addEventListener('click', () => { if(controlsModal) controlsModal.hidden = false; });
btnCloseControls?.addEventListener('click', () => { if(controlsModal) controlsModal.hidden = true; });
document.querySelector('#portal-world-1')?.addEventListener('click', startGame);

canvas.addEventListener('pointerdown', e => {
  if(isGameOver && gameOverTime > 0.5){
    restartRunner();
  }
});

// SINTETIZADOR DE AUDIO PROCEDURAL DE ALTO IMPACTO
let audioContext = null;
function ensureAudio(){
  if(!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if(audioContext.state === 'suspended') audioContext.resume().catch(()=>{});
}
async function startMusic(){
  if(isMusicMuted || !music || !music.paused) return;
  try { await music.play(); } catch {}
}

function playMenuConfirm(){
  if(!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime, osc = audioContext.createOscillator(), gain = audioContext.createGain();
  osc.type = 'triangle'; osc.frequency.setValueAtTime(320, now); osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
  gain.gain.setValueAtTime(0.001, now); gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  osc.connect(gain); gain.connect(audioContext.destination); osc.start(now); osc.stop(now + 0.16);
}

function playStep(surface = 'grass'){
  if(!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime, osc = audioContext.createOscillator(), gain = audioContext.createGain(), filter = audioContext.createBiquadFilter();
  osc.type = surface === 'stone' ? 'triangle' : 'sine';
  osc.frequency.setValueAtTime(surface === 'stone' ? 145 : 95, now);
  osc.frequency.exponentialRampToValueAtTime(surface === 'stone' ? 72 : 58, now + 0.075);
  filter.type = 'lowpass'; filter.frequency.value = surface === 'stone' ? 900 : 620;
  gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(surface === 'stone' ? 0.045 : 0.028, now + 0.008); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  osc.connect(filter); filter.connect(gain); gain.connect(audioContext.destination); osc.start(now); osc.stop(now + 0.1);
}

function playSlingshotStretch(){
  if(!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime, osc = audioContext.createOscillator(), gain = audioContext.createGain();
  osc.type = 'sine'; osc.frequency.setValueAtTime(140, now); osc.frequency.linearRampToValueAtTime(320, now + 0.07);
  gain.gain.setValueAtTime(0.001, now); gain.gain.exponentialRampToValueAtTime(0.04, now + 0.03); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  osc.connect(gain); gain.connect(audioContext.destination); osc.start(now); osc.stop(now + 0.08);
}

function playSlingshotShoot(){
  if(!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  const bufferSize = Math.floor(audioContext.sampleRate * 0.07);
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  const filter = audioContext.createBiquadFilter();
  filter.type = 'highpass'; filter.frequency.setValueAtTime(1300, now);
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.14, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  noise.connect(filter); filter.connect(gain); gain.connect(audioContext.destination);
  noise.start(now); noise.stop(now + 0.07);

  const osc = audioContext.createOscillator(), oscGain = audioContext.createGain();
  osc.type = 'triangle'; osc.frequency.setValueAtTime(920, now); osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);
  oscGain.gain.setValueAtTime(0.09, now); oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  osc.connect(oscGain); oscGain.connect(audioContext.destination); osc.start(now); osc.stop(now + 0.10);
}

function playCoconutCrack(){
  if(!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  const osc1 = audioContext.createOscillator(), osc2 = audioContext.createOscillator(), gain = audioContext.createGain();
  osc1.type = 'triangle'; osc1.frequency.setValueAtTime(360, now); osc1.frequency.exponentialRampToValueAtTime(70, now + 0.12);
  osc2.type = 'sawtooth'; osc2.frequency.setValueAtTime(780, now); osc2.frequency.exponentialRampToValueAtTime(140, now + 0.08);
  gain.gain.setValueAtTime(0.22, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
  osc1.connect(gain); osc2.connect(gain); gain.connect(audioContext.destination);
  osc1.start(now); osc2.start(now); osc1.stop(now + 0.13); osc2.stop(now + 0.13);
}

function playHollowThud(){
  if(!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime, osc = audioContext.createOscillator(), gain = audioContext.createGain();
  osc.type = 'sine'; osc.frequency.setValueAtTime(180, now); osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);
  gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  osc.connect(gain); gain.connect(audioContext.destination); osc.start(now); osc.stop(now + 0.15);
}

function playCoinSound(){
  if(!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime, osc = audioContext.createOscillator(), gain = audioContext.createGain();
  osc.type = 'triangle'; osc.frequency.setValueAtTime(987.77, now); // B5
  osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6
  gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  osc.connect(gain); gain.connect(audioContext.destination); osc.start(now); osc.stop(now + 0.22);
}

function playRelicSound(){
  if(!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  [587.33, 880.00, 1174.66, 1760.00].forEach((freq, idx) => {
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, now + idx * 0.06);
    gain.gain.setValueAtTime(0.15, now + idx * 0.06); gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.3);
    osc.connect(gain); gain.connect(audioContext.destination); osc.start(now + idx * 0.06); osc.stop(now + idx * 0.06 + 0.3);
  });
}

function playGameOverSound(){
  if(!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  [440, 415, 392, 349].forEach((freq, idx) => {
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freq, now + idx * 0.14);
    gain.gain.setValueAtTime(0.18, now + idx * 0.14); gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.28);
    osc.connect(gain); gain.connect(audioContext.destination); osc.start(now + idx * 0.14); osc.stop(now + idx * 0.14 + 0.28);
  });
}

function pressed(...names){ return names.some(n => keyboardKeys.has(n) || touchKeys.has(n)); }

// EFECTOS VISUALES Y PARTÍCULAS
function spawnSlashSparks(x, y, count = 12, color = '#ffd152'){
  for(let i = 0; i < count; i++){
    const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.9;
    const speed = 140 + Math.random() * 260;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      size: 2.5 + Math.random() * 3.5,
      color: i % 2 === 0 ? '#ffffff' : color,
      life: 0.26 + Math.random() * 0.16,
      maxLife: 0.42
    });
  }
}

function spawnCoconutShatter(x, y){
  for(let i = 0; i < 9; i++){
    const angle = (Math.PI * 2 * i / 9) + (Math.random() - 0.5) * 0.6;
    const speed = 120 + Math.random() * 240;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 130,
      size: 4 + Math.random() * 5,
      color: i % 2 === 0 ? '#4e342e' : '#795548',
      life: 0.45 + Math.random() * 0.2,
      maxLife: 0.65
    });
  }
  for(let i = 0; i < 14; i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * 200;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 70,
      size: 2.5 + Math.random() * 3.5,
      color: '#ffffff',
      life: 0.35 + Math.random() * 0.2,
      maxLife: 0.55
    });
  }
}

function spawnSlideDust(x, y){
  for(let i = 0; i < 3; i++){
    particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y - 4,
      vx: -180 - Math.random() * 120,
      vy: -20 - Math.random() * 60,
      size: 3 + Math.random() * 4,
      color: 'rgba(215, 204, 180, 0.7)',
      life: 0.22 + Math.random() * 0.15,
      maxLife: 0.37
    });
  }
}

function spawnFloatingText(text, x, y, color = '#ffd700', fontSize = 16){
  floatingTexts.push({
    text, x, y, color, fontSize,
    vy: -75,
    life: 0.85,
    maxLife: 0.85
  });
}

function spawnStone(x, y, vx, vy){
  stones.push({
    x, y, prevX: x, prevY: y,
    vx, vy, rot: 0,
    r: 6.5, life: 2.2, trail: []
  });
}

// GENERADOR PROCEDURAL INFINITO DE OBSTÁCULOS, ENEMIGOS Y MONEDAS
function spawnChunkAhead(targetX){
  const distM = Math.floor(targetX / 18);
  const patterns = ['stump', 'high_barrier', 'coco_runner', 'coco_rolling', 'double_jump', 'slide_and_foe'];
  // Si la distancia es mayor, aparecen combinaciones más intensas
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];

  if(pattern === 'stump'){
    // Obstáculo bajo: Tótem de piedra / tocón. Se salta o se rompe con la resortera
    obstacles.push({
      id: entityIdCounter++,
      type: 'low_stump',
      x: targetX,
      y: GROUND_Y - 48,
      w: 48,
      h: 48,
      broken: false
    });
    // Arco de 3 monedas doradas sobre el obstáculo para premiar el salto
    for(let i = 0; i < 3; i++){
      const cx = targetX - 45 + i * 45;
      const cy = GROUND_Y - 95 - Math.sin((i / 2) * Math.PI) * 55;
      coins.push({ id: entityIdCounter++, x: cx, y: cy, collected: false, rot: 0 });
    }
  } else if(pattern === 'high_barrier'){
    // Obstáculo alto: Tronco de bambú / arco colgante. OBLIGATORIO DESLIZARSE (AGANCHARSE) POR DEBAJO
    obstacles.push({
      id: entityIdCounter++,
      type: 'high_barrier',
      x: targetX,
      y: GROUND_Y - 110,
      w: 88,
      h: 52, // Deja un espacio libre de 58px abajo
      broken: false
    });
    // 3 monedas en el suelo premiando el deslizamiento
    for(let i = 0; i < 3; i++){
      coins.push({ id: entityIdCounter++, x: targetX - 35 + i * 35, y: GROUND_Y - 22, collected: false, rot: 0 });
    }
  } else if(pattern === 'coco_runner'){
    // Coco Concha Pirata cargando con lanza hacia Talon
    enemies.push({
      id: entityIdCounter++,
      type: 'coco_concha',
      x: targetX + 120,
      y: GROUND_Y - 66,
      w: 56,
      h: 66,
      vx: -130,
      vy: 0,
      hp: 1,
      maxHp: 1,
      state: 'run',
      anim: 0,
      deadTimer: 0
    });
  } else if(pattern === 'coco_rolling'){
    // Coco salvaje rodando y rebotando a gran velocidad
    enemies.push({
      id: entityIdCounter++,
      type: 'coco_rodante',
      x: targetX + 80,
      y: GROUND_Y - 38,
      w: 36,
      h: 36,
      vx: -210,
      vy: -120,
      hp: 1,
      maxHp: 1,
      state: 'run',
      anim: 0,
      deadTimer: 0
    });
    // Moneda en el aire sobre el coco
    coins.push({ id: entityIdCounter++, x: targetX + 80, y: GROUND_Y - 105, collected: false, rot: 0 });
  } else if(pattern === 'double_jump'){
    // Dos obstáculos bajos seguidos con monedas
    obstacles.push({
      id: entityIdCounter++,
      type: 'low_stump',
      x: targetX,
      y: GROUND_Y - 48,
      w: 48,
      h: 48,
      broken: false
    });
    obstacles.push({
      id: entityIdCounter++,
      type: 'low_stump',
      x: targetX + 170,
      y: GROUND_Y - 48,
      w: 48,
      h: 48,
      broken: false
    });
    for(let i = 0; i < 5; i++){
      const cx = targetX - 30 + i * 55;
      const cy = GROUND_Y - 110 - Math.sin((i / 4) * Math.PI) * 45;
      coins.push({ id: entityIdCounter++, x: cx, y: cy, collected: false, rot: 0 });
    }
  } else if(pattern === 'slide_and_foe'){
    // Barrera alta (deslizarse) seguida inmediatamente por un coco
    obstacles.push({
      id: entityIdCounter++,
      type: 'high_barrier',
      x: targetX,
      y: GROUND_Y - 110,
      w: 85,
      h: 52,
      broken: false
    });
    enemies.push({
      id: entityIdCounter++,
      type: 'coco_concha',
      x: targetX + 190,
      y: GROUND_Y - 66,
      w: 56,
      h: 66,
      vx: -120,
      vy: 0,
      hp: 1,
      maxHp: 1,
      state: 'run',
      anim: 0,
      deadTimer: 0
    });
  }

  // Cada ~250 metros aparece una Reliquia Sagrada de Poder
  if(Math.random() < 0.22 && targetX > 1400){
    const rTypes = [
      { type: 'shield', color: '#00e5ff', icon: '🛡️', text: '¡ESCUDO TIKI!' },
      { type: 'magnet', color: '#ff9100', icon: '🧲', text: '¡IMÁN DE ORO!' },
      { type: 'gem',    color: '#ffd700', icon: '💎', text: '¡JOYA SAGRADA!' }
    ];
    const chosen = rTypes[Math.floor(Math.random() * rTypes.length)];
    relics.push({
      id: entityIdCounter++,
      type: chosen.type,
      text: chosen.text,
      x: targetX + 280,
      y: GROUND_Y - 115,
      color: chosen.color,
      icon: chosen.icon,
      collected: false
    });
  }
}

function updateProceduralSpawning(){
  const cam = cameraX();
  while(nextSpawnX < cam + 1900){
    spawnChunkAhead(nextSpawnX);
    nextSpawnX += 360 + Math.random() * 220;
  }

  // Limpieza de entidades que quedaron atrás de la cámara
  const cullX = cam - 300;
  for(let i = obstacles.length - 1; i >= 0; i--){ if(obstacles[i].x < cullX) obstacles.splice(i, 1); }
  for(let i = enemies.length - 1; i >= 0; i--){ if(enemies[i].x < cullX) enemies.splice(i, 1); }
  for(let i = coins.length - 1; i >= 0; i--){ if(coins[i].x < cullX) coins.splice(i, 1); }
  for(let i = relics.length - 1; i >= 0; i--){ if(relics[i].x < cullX) relics.splice(i, 1); }
  for(let i = stones.length - 1; i >= 0; i--){ if(stones[i].x < cullX || stones[i].x > cam + 2000) stones.splice(i, 1); }
}

// REINICIO DE EXPEDICIÓN TRAS GAME OVER
function restartRunner(){
  player.x = 120;
  player.y = GROUND_Y - MASTER_CHARACTER.h;
  player.vx = 320;
  player.vy = 0;
  player.onGround = true;
  player.hearts = 3;
  player.hurtTime = 0;
  player.shield = false;
  player.shieldTime = 0;
  player.magnetTime = 0;
  player.sliding = false;

  gameDistance = 0;
  coinsCollected = 0;
  cocosDefeated = 0;
  comboStreak = 0;
  comboTimer = 0;
  isGameOver = false;
  gameOverTime = 0;
  isNewRecord = false;

  obstacles.length = 0;
  enemies.length = 0;
  coins.length = 0;
  relics.length = 0;
  stones.length = 0;
  particles.length = 0;
  floatingTexts.length = 0;

  nextSpawnX = 900;
  entityIdCounter = 1;
}

// BUCLE DE FÍSICA Y ACTUALIZACIÓN
let last = performance.now();
function update(dt){
  if(isInMenu) return;

  if(isGameOver){
    gameOverTime += dt;
    return;
  }

  // Cálculo de distancia recorrida
  gameDistance = Math.floor(player.x / 18);
  if(gameDistance > highRecord){
    highRecord = gameDistance;
    isNewRecord = true;
    localStorage.setItem('talon_runner_best_meters', highRecord.toString());
  }

  // Combo decay
  if(comboTimer > 0){
    comboTimer -= dt;
    if(comboTimer <= 0) comboStreak = 0;
  }

  // Controles del jugador
  const upKey = pressed('ArrowUp', 'w', 'KeyW', 'Space', 'KeyC', 'c', 'C') || runTapJump;
  const downKey = pressed('ArrowDown', 's', 'KeyS');
  const leftKey = pressed('ArrowLeft', 'a', 'KeyA');
  const rightKey = pressed('ArrowRight', 'd', 'KeyD', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight');
  const attackPressed = pressed('KeyX', 'x', 'X', 'KeyZ', 'z', 'Z', 'KeyJ');

  // Velocidad hacia adelante estilo Action Runner
  const baseSpeed = 330 + Math.min(150, gameDistance * 0.2);
  let moveVx = baseSpeed;
  if(rightKey) moveVx += 120; // Turbo / acelerón
  if(leftKey) moveVx -= 140;  // Freno táctico

  player.vx = moveVx;

  // Mecánica de Deslizamiento (Slide / Agacharse)
  const wantsSlide = downKey && player.onGround;
  if(wantsSlide){
    player.sliding = true;
    player.slideTime += dt;
    player.h = 56; // Hitbox baja: pasa perfectamente bajo barreras altas
    spawnSlideDust(player.x + 20, GROUND_Y);
  } else {
    player.sliding = false;
    player.slideTime = 0;
    player.h = MASTER_CHARACTER.h; // 124px altura normal
  }

  // Mecánica de Salto y Doble Salto
  if(upKey && !player.jumpLatch){
    if(player.onGround){
      player.vy = -540;
      player.onGround = false;
      player.jumpCount = 1;
      playStep('stone');
    } else if(player.jumpCount === 1){
      player.vy = -480;
      player.jumpCount = 2;
      player.doubleJumpTime = 0.001;
      spawnSlashSparks(player.x + player.w/2, player.y + player.h, 10, '#00e5ff');
    }
  }
  player.jumpLatch = upKey;
  runTapJump = false;

  // Mecánica de Ataque con Resortera 360°
  let targetAim = 0;
  if(pressed('ArrowUp', 'KeyW', 'w')){
    targetAim = -Math.PI / 3; // Diagonal arriba
  } else {
    targetAim = 0; // Horizontal al frente
  }

  if(attackPressed && !player.attackLatch && player.attackTime <= 0){
    player.attackTime = 0.001;
    player.slingFired = false;
    player.aimAngle = targetAim;
    playSlingshotStretch();
  }
  player.attackLatch = attackPressed;

  if(player.attackTime > 0){
    player.attackTime += dt;
    player.aimAngle = targetAim;

    if(player.attackTime >= 0.16 && !player.slingFired){
      player.slingFired = true;
      const angle = player.aimAngle;
      const stoneSpeed = 820;
      const pvx = Math.cos(angle) * stoneSpeed + player.vx;
      const pvy = Math.sin(angle) * stoneSpeed;

      const spawnX = player.x + player.w + 12;
      const spawnY = player.sliding ? player.y + 24 : player.y + 45;
      spawnStone(spawnX, spawnY, pvx, pvy);
      playSlingshotShoot();
      spawnSlashSparks(spawnX, spawnY, 8, '#ffe082');
    }
    if(player.attackTime >= 0.34){
      player.attackTime = 0;
      player.slingFired = false;
    }
  }

  // Integración física de Talon
  player.x += player.vx * dt;
  player.vy += 1350 * dt; // Gravedad
  player.y += player.vy * dt;

  // Suelo continuo de piedra calibrado
  if(player.y + player.h >= GROUND_Y){
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    if(!player.onGround){
      playStep('stone');
      spawnSlideDust(player.x + 20, GROUND_Y);
    }
    player.onGround = true;
    player.jumpCount = 0;
    player.doubleJumpTime = 0;
  }

  // Efectos de pasos rítmicos
  if(player.onGround && !player.sliding){
    stepDistance += player.vx * dt;
    if(stepDistance >= 85){
      stepDistance = 0;
      playStep('stone');
    }
  }

  // Actualización de animaciones de Talon
  if(player.onGround){
    player.anim += dt * (player.vx > 360 ? 14 : 9);
    player.frame = Math.floor(player.anim) % 6;
  }
  if(player.doubleJumpTime > 0) player.doubleJumpTime += dt;
  if(player.hurtTime > 0) player.hurtTime -= dt;

  // Powerups temporales
  if(player.shieldTime > 0){
    player.shieldTime -= dt;
    if(player.shieldTime <= 0) player.shield = false;
  }
  if(player.magnetTime > 0){
    player.magnetTime -= dt;
  }

  // ACTUALIZACIÓN DE PROYECTILES DE LA RESORTERA
  for(let sIdx = stones.length - 1; sIdx >= 0; sIdx--){
    const st = stones[sIdx];
    st.life -= dt;
    if(st.life <= 0){ stones.splice(sIdx, 1); continue; }

    st.prevX = st.x; st.prevY = st.y;
    st.trail.push({ x: st.x, y: st.y });
    if(st.trail.length > 5) st.trail.shift();

    st.x += st.vx * dt;
    st.y += st.vy * dt;
    st.vy += 220 * dt; // Gravedad ligera de la piedra
    st.rot += 12 * dt;

    // Colisión de la piedra con el suelo
    if(st.y >= GROUND_Y - 4){
      spawnSlashSparks(st.x, GROUND_Y - 4, 6, '#b0bec5');
      stones.splice(sIdx, 1);
      continue;
    }

    // Colisión de la piedra con obstáculos rompibles
    let stoneHit = false;
    for(const ob of obstacles){
      if(ob.broken) continue;
      if(ob.type === 'low_stump' && st.x >= ob.x && st.x <= ob.x + ob.w && st.y >= ob.y && st.y <= ob.y + ob.h){
        ob.broken = true;
        stoneHit = true;
        spawnSlashSparks(ob.x + ob.w/2, ob.y + ob.h/2, 14, '#ffb74d');
        spawnFloatingText('+30', ob.x + ob.w/2, ob.y - 10, '#ffd700');
        playCoconutCrack();
        break;
      }
    }
    if(stoneHit){ stones.splice(sIdx, 1); continue; }

    // Colisión de la piedra con enemigos Cocos
    for(const en of enemies){
      if(en.state === 'hit') continue;
      if(st.x >= en.x && st.x <= en.x + en.w && st.y >= en.y && st.y <= en.y + en.h){
        en.hp--;
        stoneHit = true;
        if(en.hp <= 0){
          en.state = 'hit';
          en.deadTimer = 0.001;
          cocosDefeated++;
          comboStreak++;
          comboTimer = 2.4;
          const comboMult = Math.min(4, comboStreak);
          const pts = 50 * comboMult;
          spawnCoconutShatter(en.x + en.w/2, en.y + en.h/2);
          playCoconutCrack();
          spawnFloatingText(comboStreak > 1 ? `K.O. x${comboStreak}! +${pts}` : `+${pts}`, en.x + en.w/2, en.y - 15, '#ff3d00', 17);
        } else {
          spawnSlashSparks(st.x, st.y, 8, '#fff');
          playHollowThud();
        }
        break;
      }
    }
    if(stoneHit){ stones.splice(sIdx, 1); continue; }
  }

  // ACTUALIZACIÓN DE ENEMIGOS COCOS
  for(const en of enemies){
    if(en.state === 'hit'){
      en.deadTimer += dt;
      continue;
    }

    en.anim += dt * 10;
    en.x += en.vx * dt;

    if(en.type === 'coco_rodante'){
      en.y += en.vy * dt;
      en.vy += 980 * dt;
      if(en.y + en.h >= GROUND_Y){
        en.y = GROUND_Y - en.h;
        en.vy = -180; // Rebote continuo
      }
    }

    // Comprobación de PISOTÓN (Jump Stomp de Talon sobre la cabeza del coco)
    const stompCondition = player.vy > 50 && (player.y + player.h <= en.y + 32) && (player.y + player.h >= en.y - 12) &&
                           (player.x + player.w * 0.8 > en.x) && (player.x + player.w * 0.2 < en.x + en.w);

    if(stompCondition){
      en.state = 'hit';
      en.deadTimer = 0.001;
      player.vy = -530; // Rebote acrobático hacia arriba
      player.jumpCount = 1;
      cocosDefeated++;
      comboStreak++;
      comboTimer = 2.4;
      spawnCoconutShatter(en.x + en.w/2, en.y + en.h/2);
      playCoconutCrack();
      spawnFloatingText(`¡PISOTÓN! +100`, en.x + en.w/2, en.y - 20, '#00e676', 18);
      continue;
    }

    // Colisión cuerpo a cuerpo de Talon contra el coco
    const hitBox = {
      x: player.x + 8,
      y: player.y + 10,
      w: player.w - 16,
      h: player.h - 10
    };
    const enBox = { x: en.x, y: en.y, w: en.w, h: en.h };

    const collides = (hitBox.x < enBox.x + enBox.w && hitBox.x + hitBox.w > enBox.x &&
                      hitBox.y < enBox.y + enBox.h && hitBox.y + hitBox.h > enBox.y);

    if(collides && player.hurtTime <= 0){
      handlePlayerDamage();
    }
  }

  // ACTUALIZACIÓN DE OBSTÁCULOS Y COLISIONES
  for(const ob of obstacles){
    if(ob.broken) continue;

    const hitBox = {
      x: player.x + 8,
      y: player.y + 6,
      w: player.w - 16,
      h: player.h - 6
    };

    const collides = (hitBox.x < ob.x + ob.w && hitBox.x + hitBox.w > ob.x &&
                      hitBox.y < ob.y + ob.h && hitBox.y + hitBox.h > ob.y);

    if(collides && player.hurtTime <= 0){
      handlePlayerDamage();
    }
  }

  // ACTUALIZACIÓN DE MONEDAS
  for(const c of coins){
    if(c.collected) continue;
    c.rot += dt * 5;

    // Efecto de Imán de Monedas
    if(player.magnetTime > 0){
      const dx = (player.x + player.w/2) - c.x;
      const dy = (player.y + player.h/2) - c.y;
      const dist = Math.hypot(dx, dy);
      if(dist < 380){
        c.x += (dx / dist) * 620 * dt;
        c.y += (dy / dist) * 620 * dt;
      }
    }

    const distPlayer = Math.hypot((player.x + player.w/2) - c.x, (player.y + player.h/2) - c.y);
    if(distPlayer < 42){
      c.collected = true;
      coinsCollected++;
      playCoinSound();
      spawnSlashSparks(c.x, c.y, 8, '#ffd700');
    }
  }

  // ACTUALIZACIÓN DE RELIQUIAS DE PODER
  for(const r of relics){
    if(r.collected) continue;
    const distPlayer = Math.hypot((player.x + player.w/2) - r.x, (player.y + player.h/2) - r.y);
    if(distPlayer < 50){
      r.collected = true;
      playRelicSound();
      spawnSlashSparks(r.x, r.y, 25, r.color);
      spawnFloatingText(r.text, r.x, r.y - 25, r.color, 19);

      if(r.type === 'shield'){
        player.shield = true;
        player.shieldTime = 12.0;
      } else if(r.type === 'magnet'){
        player.magnetTime = 10.0;
      } else if(r.type === 'gem'){
        coinsCollected += 25;
      }
    }
  }

  // Partículas y textos flotantes
  if(screenShake > 0) screenShake -= dt;
  for(let i = particles.length - 1; i >= 0; i--){
    const p = particles[i];
    p.life -= dt;
    if(p.life <= 0){ particles.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 380 * dt;
  }
  for(let i = floatingTexts.length - 1; i >= 0; i--){
    const ft = floatingTexts[i];
    ft.life -= dt;
    if(ft.life <= 0){ floatingTexts.splice(i, 1); continue; }
    ft.y += ft.vy * dt;
  }

  // Generación procedural continúa
  updateProceduralSpawning();
}

function handlePlayerDamage(){
  if(player.shield){
    player.shield = false;
    player.shieldTime = 0;
    player.hurtTime = 1.0;
    screenShake = 0.2;
    playHollowThud();
    spawnSlashSparks(player.x + player.w/2, player.y + player.h/2, 20, '#00e5ff');
    spawnFloatingText('¡ESCUDO ROTO!', player.x + player.w/2, player.y - 20, '#00e5ff', 17);
    return;
  }

  player.hearts--;
  player.hurtTime = 1.5;
  screenShake = 0.32;
  playHollowThud();
  spawnSlashSparks(player.x + player.w/2, player.y + player.h/2, 16, '#ff1744');

  if(player.hearts <= 0){
    isGameOver = true;
    gameOverTime = 0;
    playGameOverSound();
  }
}

// ============================================================================
// SISTEMA DE RENDERIZADO VISUAL
// ============================================================================
function drawWorld(image){
  const s = scale();
  const cam = cameraX();
  const relCam = ((cam % BG_WIDTH) + BG_WIDTH) % BG_WIDTH;

  // Fondo continuo infinito: se dibujan dos instancias empalmadas perfectamente
  ctx.drawImage(image, -relCam * s, 0, BG_WIDTH * s, VIEW_BASE.h * s);
  ctx.drawImage(image, (BG_WIDTH - relCam) * s, 0, BG_WIDTH * s, VIEW_BASE.h * s);
}

function drawAtmosphere(now){
  const s = scale(), cam = cameraX(), t = now * 0.001;
  ctx.save();
  ctx.scale(s, s);

  // Rayos de sol dinámicos
  for(let r = 0; r < 4; r++){
    const rx = ((r * 600 - cam * 0.2) % (innerWidth / s + 400)) - 100;
    const rayGrad = ctx.createLinearGradient(rx, 0, rx + 140, 600);
    const alpha = 0.05 + 0.03 * Math.sin(t * 1.5 + r);
    rayGrad.addColorStop(0, `rgba(255, 245, 180, ${alpha * 1.6})`);
    rayGrad.addColorStop(0.5, `rgba(255, 230, 150, ${alpha})`);
    rayGrad.addColorStop(1, 'rgba(255, 220, 140, 0)');

    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(rx - 20, 0); ctx.lineTo(rx + 40, 0); ctx.lineTo(rx + 240, 650); ctx.lineTo(rx + 160, 650);
    ctx.closePath();
    ctx.fill();
  }

  // Motes dorados de polvo solar en el aire
  for(let m = 0; m < 22; m++){
    const mx = (((m * 97 + t * 25) - cam * 0.5) % (innerWidth / s + 200)) - 50;
    const my = 120 + (m * 31) % 400 + Math.sin(t * 2 + m) * 12;
    const alpha = 0.3 + 0.25 * Math.sin(t * 3 + m);
    ctx.fillStyle = `rgba(255, 240, 170, ${alpha})`;
    ctx.beginPath();
    ctx.arc(mx, my, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function render(){
  ctx.clearRect(0, 0, innerWidth, gameHeight());

  let shakeX = 0, shakeY = 0;
  if(screenShake > 0){
    shakeX = (Math.random() - 0.5) * 10 * (screenShake / 0.32);
    shakeY = (Math.random() - 0.5) * 8 * (screenShake / 0.32);
  }
  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawWorld(bg);
  drawAtmosphere(performance.now());

  const s = scale(), cam = cameraX();

  // 1. RENDERIZADO DE OBSTÁCULOS
  for(const ob of obstacles){
    if(ob.broken) continue;
    const ox = (ob.x - cam) * s, oy = ob.y * s, ow = ob.w * s, oh = ob.h * s;

    if(ob.type === 'low_stump'){
      // Tótem de piedra ancestral tallada
      ctx.save();
      ctx.fillStyle = '#4e342e';
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 2.5 * s;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(ox, oy, ow, oh, 6 * s);
      else ctx.rect(ox, oy, ow, oh);
      ctx.fill(); ctx.stroke();

      // Detalles tallados de tiki / grietas
      ctx.strokeStyle = '#271711';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(ox + ow * 0.25, oy + oh * 0.3); ctx.lineTo(ox + ow * 0.75, oy + oh * 0.3);
      ctx.moveTo(ox + ow * 0.3, oy + oh * 0.65); ctx.lineTo(ox + ow * 0.7, oy + oh * 0.65);
      ctx.stroke();

      // Ojos brillantes amarillos
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath();
      ctx.arc(ox + ow * 0.35, oy + oh * 0.45, 3.5 * s, 0, Math.PI * 2);
      ctx.arc(ox + ow * 0.65, oy + oh * 0.45, 3.5 * s, 0, Math.PI * 2);
      ctx.fill();

      // Hierba sobre el tocón
      ctx.fillStyle = '#43a047';
      ctx.fillRect(ox + 2 * s, oy - 3 * s, ow - 4 * s, 4 * s);
      ctx.restore();
    } else if(ob.type === 'high_barrier'){
      // Tronco de bambú y lianas colgantes elevadas (para deslizarse por debajo)
      ctx.save();
      // Postes laterales de soporte
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(ox + 4 * s, oy, 8 * s, (GROUND_Y - ob.y) * s);
      ctx.fillRect(ox + ow - 12 * s, oy, 8 * s, (GROUND_Y - ob.y) * s);

      // Travesaño superior de bambú
      const gradBamboo = ctx.createLinearGradient(ox, oy, ox, oy + oh);
      gradBamboo.addColorStop(0, '#8bc34a');
      gradBamboo.addColorStop(0.5, '#558b2f');
      gradBamboo.addColorStop(1, '#33691e');
      ctx.fillStyle = gradBamboo;
      ctx.strokeStyle = '#1b5e20';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(ox, oy, ow, oh, 8 * s);
      else ctx.rect(ox, oy, ow, oh);
      ctx.fill(); ctx.stroke();

      // Cartel indicativo de peligro / agacharse
      ctx.fillStyle = '#ffeb3b';
      ctx.font = `bold ${Math.round(11 * s)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('⌄ DESLIZAR ⌄', ox + ow/2, oy + oh * 0.65);

      // Lianas colgando hacia abajo
      ctx.strokeStyle = '#2e7d32';
      ctx.lineWidth = 2.5 * s;
      ctx.beginPath();
      ctx.moveTo(ox + 16 * s, oy + oh); ctx.lineTo(ox + 14 * s, oy + oh + 16 * s);
      ctx.moveTo(ox + ow - 20 * s, oy + oh); ctx.lineTo(ox + ow - 18 * s, oy + oh + 22 * s);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 2. RENDERIZADO DE MONEDAS DORADAS GIRATORIAS
  for(const c of coins){
    if(c.collected) continue;
    const cx = (c.x - cam) * s, cy = c.y * s;
    const rotScale = Math.cos(c.rot);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rotScale, 1);

    // Resplandor
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 16 * s);
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.45)');
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 16 * s, 0, Math.PI * 2);
    ctx.fill();

    // Moneda de oro maya
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#ff8f00';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(0, 0, 10 * s, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Símbolo central
    ctx.fillStyle = '#ff8f00';
    ctx.fillRect(-2 * s, -5 * s, 4 * s, 10 * s);
    ctx.restore();
  }

  // 3. RENDERIZADO DE RELIQUIAS DE PODER
  for(const r of relics){
    if(r.collected) continue;
    const rx = (r.x - cam) * s;
    const bob = Math.sin(performance.now() * 0.004 + r.id) * 6 * s;
    const ry = r.y * s + bob;

    ctx.save();
    const gradGlow = ctx.createRadialGradient(rx, ry, 2, rx, ry, 24 * s);
    gradGlow.addColorStop(0, r.color);
    gradGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradGlow;
    ctx.beginPath();
    ctx.arc(rx, ry, 24 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${Math.round(24 * s)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(r.icon, rx, ry);
    ctx.restore();
  }

  // 4. RENDERIZADO DE ENEMIGOS COCOS
  for(const en of enemies){
    const ex = (en.x + en.w / 2 - cam) * s;
    const ey = (en.y + en.h) * s;

    if(en.type === 'coco_concha'){
      if(cocoConchaWalkSheet.complete && cocoConchaWalkSheet.naturalWidth){
        const psc = (en.h / 193) * s;
        ctx.save();
        if(en.state === 'hit'){
          const wobble = Math.sin(en.deadTimer * 12) * 0.15;
          ctx.translate(ex, ey - 12 * s);
          ctx.rotate(1.42 + wobble);
          ctx.globalAlpha = Math.max(0, 1 - en.deadTimer / 0.8);
          ctx.scale(psc, psc);
          ctx.drawImage(cocoConchaWalkSheet, 0, 0, 180, 240, -83, -218, 180, 240);
        } else {
          const f = Math.floor(en.anim * 18) % 16;
          ctx.translate(ex, ey);
          ctx.scale(-psc, psc); // Mira hacia la izquierda (hacia Talon)
          ctx.drawImage(cocoConchaWalkSheet, f * 180, 0, 180, 240, -83, -218, 180, 240);
        }
        ctx.restore();
      }
    } else if(en.type === 'coco_rodante'){
      if(cocoSheet.complete && cocoSheet.naturalWidth){
        ctx.save();
        ctx.translate(ex, ey - en.h * s / 2);
        if(en.state === 'hit'){
          ctx.globalAlpha = Math.max(0, 1 - en.deadTimer / 0.6);
        } else {
          ctx.rotate(-en.anim * 8);
        }
        const sc = (en.w / 44) * s;
        ctx.scale(sc, sc);
        ctx.drawImage(cocoSheet, 0, 0, 64, 64, -32, -32, 64, 64);
        ctx.restore();
      }
    }
  }

  // 5. RENDERIZADO DEL JUGADOR (TALON 3D MASTER)
  const px = (player.x - cam) * s;
  const py = player.y * s;

  let animKey = 'run';
  let activeSheet = runSheet;
  let frame = player.frame;

  if(player.attackTime > 0){
    animKey = 'slingshot';
    activeSheet = slingSheet;
    const nFrames = FRAMES.slingshot.list.length;
    frame = Math.min(nFrames - 1, Math.floor((player.attackTime / 0.34) * nFrames));
  } else if(!player.onGround){
    animKey = 'jump';
    activeSheet = jumpSheet;
    frame = player.vy < -200 ? 1
          : player.vy < -50 ? 1
          : player.vy < 120 ? 2
          : player.vy < 300 ? 3
          : 4;
  } else if(player.sliding){
    animKey = 'crouch';
    activeSheet = crouchSheet;
    frame = 4; // Pose de deslizamiento pegado al suelo
  } else {
    animKey = 'run';
    activeSheet = runSheet;
  }

  if(activeSheet.complete && activeSheet.width){
    const meta = FRAMES[animKey];
    const f = meta?.list ? meta.list[frame % meta.list.length] : null;
    const sc = meta?.scale || 124/460;
    const fh = activeSheet.height;

    ctx.save();
    // Parpadeo de invulnerabilidad
    if(player.hurtTime > 0 && Math.floor(player.hurtTime * 24) % 2 === 0){
      ctx.globalAlpha = 0.35;
    }

    // Escudo Tiki visual
    if(player.shield){
      ctx.save();
      const shieldGlow = ctx.createRadialGradient(px + player.w*s/2, py + player.h*s/2, 10, px + player.w*s/2, py + player.h*s/2, 45 * s);
      shieldGlow.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
      shieldGlow.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = shieldGlow;
      ctx.beginPath();
      ctx.arc(px + player.w*s/2, py + player.h*s/2, 45 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.translate(px + player.w * s / 2, py + player.h * s);
    ctx.scale(player.face * s * sc, s * sc);
    if(f){
      ctx.drawImage(activeSheet, f.x, 0, f.w, fh, -f.cx, -f.fy, f.w, fh);
    }
    ctx.restore();
  }

  // 6. RENDERIZADO DE PROYECTILES DE RESORTERA
  for(const st of stones){
    const sx = (st.x - cam) * s, sy = st.y * s;
    for(let t = 0; t < st.trail.length; t++){
      const pt = st.trail[t];
      const tx = (pt.x - cam) * s, ty = pt.y * s;
      const prog = (t + 1) / st.trail.length;
      ctx.save();
      ctx.fillStyle = `rgba(176, 190, 197, ${prog * 0.45})`;
      ctx.beginPath();
      ctx.arc(tx, ty, st.r * s * prog * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(st.rot);
    const grad = ctx.createRadialGradient(-st.r * s * 0.35, -st.r * s * 0.35, 1, 0, 0, st.r * s);
    grad.addColorStop(0, '#eceff1');
    grad.addColorStop(0.45, '#90a4ae');
    grad.addColorStop(1, '#37474f');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, st.r * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 1.2 * s;
    ctx.stroke();
    ctx.restore();
  }

  // 7. RENDERIZADO DE PARTÍCULAS
  for(const p of particles){
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    const sx = (p.x - cam) * s, sy = p.y * s;
    ctx.fillRect(sx - (p.size * s) / 2, sy - (p.size * s) / 2, p.size * s, p.size * s);
    ctx.restore();
  }

  // 8. RENDERIZADO DE TEXTOS FLOTANTES ARCADE
  for(const ft of floatingTexts){
    const alpha = Math.max(0, ft.life / ft.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = ft.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = `bold ${Math.round(ft.fontSize * s)}px system-ui`;
    ctx.textAlign = 'center';
    const tx = (ft.x - cam) * s, ty = ft.y * s;
    ctx.strokeText(ft.text, tx, ty);
    ctx.fillText(ft.text, tx, ty);
    ctx.restore();
  }

  // 9. HUD ARCADE EN PANTALLA (CORREDOR INFINITO)
  // Panel Superior Izquierdo: Vidas y Distancia
  const hudTopX = 18, hudTopY = 22;
  ctx.save();
  // Vidas (Corazones)
  let heartStr = '';
  for(let h = 0; h < player.maxHearts; h++){
    heartStr += (h < player.hearts) ? '❤️ ' : '🖤 ';
  }
  ctx.font = `bold ${Math.round(20 * s)}px system-ui`;
  ctx.fillText(heartStr, hudTopX, hudTopY + 16 * s);

  // Distancia actual y Récord
  ctx.font = `bold ${Math.round(18 * s)}px system-ui`;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3.5;
  ctx.strokeText(`🏃 ${gameDistance} m`, hudTopX, hudTopY + 44 * s);
  ctx.fillText(`🏃 ${gameDistance} m`, hudTopX, hudTopY + 44 * s);

  ctx.font = `bold ${Math.round(13 * s)}px system-ui`;
  ctx.fillStyle = '#ffd700';
  ctx.strokeText(`🏆 Récord: ${highRecord} m`, hudTopX, hudTopY + 65 * s);
  ctx.fillText(`🏆 Récord: ${highRecord} m`, hudTopX, hudTopY + 65 * s);

  // Panel Superior Derecho: Monedas y Cocos K.O.
  const rightHUDX = innerWidth - 190 * s;
  ctx.font = `bold ${Math.round(16 * s)}px system-ui`;
  ctx.fillStyle = '#ffd700';
  ctx.strokeText(`🪙 Monedas: ${coinsCollected}`, rightHUDX, hudTopY + 20 * s);
  ctx.fillText(`🪙 Monedas: ${coinsCollected}`, rightHUDX, hudTopY + 20 * s);

  ctx.fillStyle = '#ff5722';
  ctx.strokeText(`💥 Cocos K.O.: ${cocosDefeated}`, rightHUDX, hudTopY + 44 * s);
  ctx.fillText(`💥 Cocos K.O.: ${cocosDefeated}`, rightHUDX, hudTopY + 44 * s);

  // Notificador de Combo Activo
  if(comboStreak > 1){
    ctx.font = `bold ${Math.round(18 * s)}px system-ui`;
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'center';
    ctx.strokeText(`🔥 COMBO x${comboStreak}!`, innerWidth / 2, 42 * s);
    ctx.fillText(`🔥 COMBO x${comboStreak}!`, innerWidth / 2, 42 * s);
  }
  ctx.restore();

  // 10. OVERLAY DE GAME OVER (ARCADE STYLE)
  if(isGameOver){
    ctx.save();
    // Oscurecimiento de pantalla
    ctx.fillStyle = 'rgba(10, 20, 28, 0.85)';
    ctx.fillRect(0, 0, innerWidth, gameHeight());

    const popW = Math.min(520, innerWidth - 36);
    const popH = 340;
    const popX = (innerWidth - popW) / 2;
    const popY = (gameHeight() - popH) / 2;

    // Panel central
    ctx.fillStyle = '#1c2833';
    ctx.strokeStyle = isNewRecord ? '#ffd700' : '#ff5722';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(popX, popY, popW, popH, 18);
    else ctx.rect(popX, popY, popW, popH);
    ctx.fill(); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff3d00';
    ctx.font = 'bold 28px system-ui';
    ctx.fillText('💀 FIN DE LA EXPEDICIÓN', innerWidth / 2, popY + 48);

    if(isNewRecord){
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 18px system-ui';
      ctx.fillText('✨ ¡NUEVO RÉCORD DE DISTANCIA! ✨', innerWidth / 2, popY + 84);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText(`Distancia alcanzada: ${gameDistance} m`, innerWidth / 2, popY + 124);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Mejor Récord: ${highRecord} m`, innerWidth / 2, popY + 158);

    ctx.fillStyle = '#81d4fa';
    ctx.font = '16px system-ui';
    ctx.fillText(`🪙 Monedas: ${coinsCollected}   ·   💥 Cocos K.O.: ${cocosDefeated}`, innerWidth / 2, popY + 196);

    // Botón / Indicación de reintento
    ctx.fillStyle = '#00e676';
    ctx.font = 'bold 20px system-ui';
    ctx.fillText('🔄 PRESIONA ESPACIO O TOCA AQUÍ', innerWidth / 2, popY + 260);
    ctx.fillStyle = '#b0bec5';
    ctx.font = '14px system-ui';
    ctx.fillText('¡Para iniciar una nueva carrera!', innerWidth / 2, popY + 288);

    ctx.restore();
  }

  ctx.restore(); // Screen shake restore
}

function loop(now){
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

const loadImg = img => (img.complete && img.naturalWidth !== 0) ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; });
Promise.all([
  loadImg(bg), loadImg(runSheet), loadImg(idleSheet),
  loadImg(crouchSheet), loadImg(jumpSheet), loadImg(slingSheet),
  loadImg(cocoConchaWalkSheet), loadImg(cocoPiratasSheet), loadImg(cocoSheet), loadImg(enemySheet)
]).then(() => requestAnimationFrame(loop));

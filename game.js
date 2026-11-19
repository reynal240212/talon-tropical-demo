// ============================================================================
// TALON TROPICAL — CORREDOR DE ACCIÓN TROPICAL: LA LEYENDA DEL CORAZÓN SOLAR
// 4 Zonas Biomas Extendidos · 4 Jefes Generales Coco · 4 Fragmentos del Tótem
// ============================================================================

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');

// IMÁGENES Y FONDOS DE LOS 4 BIOMAS DE LA ISLA
const bgJungle = new Image();
const bgTemple = new Image();
const bgCenote = new Image();
const bgVolcano = new Image();

bgJungle.src = 'assets/nivel_tropical_runner_clean.png?v=25';
bgTemple.src = 'assets/nivel_bioma_templo_atardecer.png?v=25';
bgCenote.src = 'assets/nivel_bioma_cenote_mistico.png?v=25';
bgVolcano.src = 'assets/nivel_bioma_volcanico.png?v=25';

// SPRITESHEETS 3D CGI DE TALON Y ENEMIGOS
const runSheet = new Image();
const idleSheet = new Image();
const crouchSheet = new Image();
const jumpSheet = new Image();
const slingSheet = new Image();
const cocoConchaWalkSheet = new Image();
const cocoPiratasSheet = new Image();
const cocoSheet = new Image();
const enemySheet = new Image();

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

// FOTOGRAMAS Y ESCALAS 3D ARMONIZADAS
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

// ============================================================================
// DEFINICIÓN DE LOS 4 BIOMAS DEL MUNDO EXTENDIDO
// ============================================================================
const BIOMES = [
  {
    id: 0,
    name: 'Selva Esmeralda',
    title: '🌿 Selva y Cascadas Esmeralda',
    startMeters: 0,
    endMeters: 600,
    bg: bgJungle,
    banner: '🌿 ZONA 1: SELVA ESMERALDA',
    color: '#00e676',
    ambientColor: 'rgba(76, 175, 80, 0.12)'
  },
  {
    id: 1,
    name: 'Templo del Jaguar',
    title: '🏛️ Templo Ancestral del Jaguar',
    startMeters: 600,
    endMeters: 1400,
    bg: bgTemple,
    banner: '🏛️ ZONA 2: TEMPLO DEL JAGUAR (ATARDECER)',
    color: '#ff9800',
    ambientColor: 'rgba(255, 152, 0, 0.15)'
  },
  {
    id: 2,
    name: 'Cenote de Cristal',
    title: '💎 Cenote Sagrado y Cavernas',
    startMeters: 1400,
    endMeters: 2200,
    bg: bgCenote,
    banner: '💎 ZONA 3: CENOTE SAGRADO DE CRISTAL',
    color: '#00e5ff',
    ambientColor: 'rgba(0, 229, 255, 0.14)'
  },
  {
    id: 3,
    name: 'Fortaleza Volcánica',
    title: '🌋 Fortaleza Volcánica Pirata',
    startMeters: 2200,
    endMeters: 99999,
    bg: bgVolcano,
    banner: '🌋 ZONA 4: FORTALEZA VOLCÁNICA PIRATA',
    color: '#ff1744',
    ambientColor: 'rgba(244, 67, 54, 0.18)'
  }
];

// ============================================================================
// HISTORIA Y LOS 4 FRAGMENTOS SAGRADOS DEL TÓTEM SOLAR
// ============================================================================
const storyFragments = [
  { id: 0, name: 'Esmeralda del Río',   icon: '🟢', color: '#00e676', bossMeters: 500,  bossName: 'Capitán Coco Concha',  bossTitle: 'Guardián del Río',      collected: false },
  { id: 1, name: 'Ojo del Dios Jaguar', icon: '🟡', color: '#ffd700', bossMeters: 1200, bossName: 'Chamán Tiki Solar',    bossTitle: 'Sacerdote del Fuego',   collected: false },
  { id: 2, name: 'Zafiro de los Cenotes',icon: '🟣', color: '#b388ff', bossMeters: 2000, bossName: 'Gran Bruto Acorazado',bossTitle: 'Terror de las Cuevas', collected: false },
  { id: 3, name: 'Corazón del Volcán',  icon: '🔴', color: '#ff1744', bossMeters: 2800, bossName: 'Almirante Barba-Coco', bossTitle: 'Gran Señor Pirata',    collected: false }
];

// Carga de fragmentos guardados
try {
  const savedFrags = JSON.parse(localStorage.getItem('talon_story_fragments') || '[]');
  if(Array.isArray(savedFrags)){
    savedFrags.forEach(id => {
      if(storyFragments[id]) storyFragments[id].collected = true;
    });
  }
} catch {}

// ESTADO DEL JUGADOR
const player = {
  x: 120,
  y: GROUND_Y - MASTER_CHARACTER.h,
  w: MASTER_CHARACTER.w,
  h: MASTER_CHARACTER.h,
  vx: 330,
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
  sliding: false,
  slideTime: 0,
  hurtTime: 0,
  hearts: 3,
  maxHearts: 3,
  shield: false,
  shieldTime: 0,
  magnetTime: 0
};

// ESTADÍSTICAS GLOBALES DEL JUEGO
let gameDistance = 0; // en metros
let highRecord = parseInt(localStorage.getItem('talon_runner_best_meters') || '0', 10);
let unlockedZone = parseInt(localStorage.getItem('talon_unlocked_zone') || '0', 10);
let coinsCollected = 0;
let cocosDefeated = 0;
let comboStreak = 0;
let comboTimer = 0;
let isGameOver = false;
let gameOverTime = 0;
let isNewRecord = false;
let screenShake = 0;
let stepDistance = 0;

// SISTEMA DE JEFES DE HISTORIA
let currentBoss = null;
let bossWarningTimer = 0;
let zoneBannerText = '';
let zoneBannerTimer = 0;
let lastAnnouncedBiome = -1;
let isStoryVictory = false;
let storyVictoryTimer = 0;

// COLECCIONES PROCEDURALES DINÁMICAS
const obstacles = [];
const enemies = [];
const coins = [];
const relics = [];
const stones = [];
const bossProjectiles = [];
const particles = [];
const floatingTexts = [];

let nextSpawnX = 900;
let entityIdCounter = 1;

// ENTRADA Y CONTROLES
const keyboardKeys = new Set();
const touchKeys = new Set();
let runTapJump = false;

addEventListener('keydown', e => {
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','ControlLeft','ControlRight','KeyZ','KeyX','KeyC'].includes(e.code)) {
    e.preventDefault();
  }
  if(e.code) keyboardKeys.add(e.code);

  if((isGameOver || isStoryVictory) && (gameOverTime > 0.6 || storyVictoryTimer > 0.6) && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ' || e.code === 'KeyX')){
    restartRunner(0);
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

// ESCALADO RESPONSIVO
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
  if(fullscreenButton) fullscreenButton.textContent = document.fullscreenElement ? '⤢' : '⛶';
  resize();
});

// MENÚ, MÚSICA Y MODALES
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

const btnOpenStory = document.querySelector('#btn-open-story');
const storyModal = document.querySelector('#story-modal');
const btnCloseStory = document.querySelector('#btn-close-story');
const btnStoryStart = document.querySelector('#btn-story-start');

function startGame(startZoneMeters = 0){
  ensureAudio();
  playMenuConfirm();
  if(!isMusicMuted) startMusic();
  isInMenu = false;
  mainMenu?.classList.add('hidden');
  btnInGameMenu?.classList.remove('hidden');
  if(controlsModal) controlsModal.hidden = true;
  if(storyModal) storyModal.hidden = true;
  if(startZoneMeters > 0) restartRunner(startZoneMeters);
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

btnPlay?.addEventListener('click', () => startGame(0));
btnModalStart?.addEventListener('click', () => startGame(0));
btnStoryStart?.addEventListener('click', () => startGame(0));
btnInGameMenu?.addEventListener('click', openMainMenu);
btnMusicToggle?.addEventListener('click', toggleMusic);

btnOpenControls?.addEventListener('click', () => { if(controlsModal) controlsModal.hidden = false; });
btnCloseControls?.addEventListener('click', () => { if(controlsModal) controlsModal.hidden = true; });

btnOpenStory?.addEventListener('click', () => { if(storyModal) storyModal.hidden = false; });
btnCloseStory?.addEventListener('click', () => { if(storyModal) storyModal.hidden = true; });

// Selección de Biomas en los Portales del Menú Principal
document.querySelector('#portal-world-1')?.addEventListener('click', () => startGame(0));
document.querySelector('#portal-world-2')?.addEventListener('click', () => startGame(600));
document.querySelector('#portal-world-3')?.addEventListener('click', () => startGame(1400));
document.querySelector('#portal-world-4')?.addEventListener('click', () => startGame(2200));

canvas.addEventListener('pointerdown', e => {
  if((isGameOver || isStoryVictory) && (gameOverTime > 0.5 || storyVictoryTimer > 0.5)){
    restartRunner(0);
  }
});

// SINTETIZADOR DE EFECTOS SONOROS
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
  osc.type = 'triangle'; osc.frequency.setValueAtTime(987.77, now);
  osc.frequency.setValueAtTime(1318.51, now + 0.06);
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

function playBossWarningSound(){
  if(!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator(), gain = audioContext.createGain();
  osc.type = 'sawtooth'; osc.frequency.setValueAtTime(160, now); osc.frequency.linearRampToValueAtTime(260, now + 0.35);
  gain.gain.setValueAtTime(0.22, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  osc.connect(gain); gain.connect(audioContext.destination); osc.start(now); osc.stop(now + 0.45);
}

function playVictoryFanfare(){
  if(!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach((freq, i) => {
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, now + i * 0.10);
    gain.gain.setValueAtTime(0.18, now + i * 0.10); gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.10 + 0.4);
    osc.connect(gain); gain.connect(audioContext.destination); osc.start(now + i * 0.10); osc.stop(now + i * 0.10 + 0.4);
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
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60,
      size: 2.5 + Math.random() * 3.5, color: i % 2 === 0 ? '#ffffff' : color,
      life: 0.26 + Math.random() * 0.16, maxLife: 0.42
    });
  }
}

function spawnCoconutShatter(x, y){
  for(let i = 0; i < 9; i++){
    const angle = (Math.PI * 2 * i / 9) + (Math.random() - 0.5) * 0.6;
    const speed = 120 + Math.random() * 240;
    particles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 130,
      size: 4 + Math.random() * 5, color: i % 2 === 0 ? '#4e342e' : '#795548',
      life: 0.45 + Math.random() * 0.2, maxLife: 0.65
    });
  }
  for(let i = 0; i < 14; i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * 200;
    particles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 70,
      size: 2.5 + Math.random() * 3.5, color: '#ffffff',
      life: 0.35 + Math.random() * 0.2, maxLife: 0.55
    });
  }
}

function spawnSlideDust(x, y){
  for(let i = 0; i < 3; i++){
    particles.push({
      x: x + (Math.random() - 0.5) * 20, y: y - 4,
      vx: -180 - Math.random() * 120, vy: -20 - Math.random() * 60,
      size: 3 + Math.random() * 4, color: 'rgba(215, 204, 180, 0.7)',
      life: 0.22 + Math.random() * 0.15, maxLife: 0.37
    });
  }
}

function spawnFloatingText(text, x, y, color = '#ffd700', fontSize = 16){
  floatingTexts.push({
    text, x, y, color, fontSize,
    vy: -75, life: 0.95, maxLife: 0.95
  });
}

function spawnStone(x, y, vx, vy){
  stones.push({
    x, y, prevX: x, prevY: y,
    vx, vy, rot: 0, r: 6.5, life: 2.2, trail: []
  });
}

// DETERMINAR EL BIOMA ACTUAL SEGÚN LA DISTANCIA
function getCurrentBiome(distMeters){
  for(let i = BIOMES.length - 1; i >= 0; i--){
    if(distMeters >= BIOMES[i].startMeters) return BIOMES[i];
  }
  return BIOMES[0];
}

// GENERADOR PROCEDURAL ADAPTATIVO POR BIOMA
function spawnChunkAhead(targetX){
  if(currentBoss) return; // Mientras pelea con un jefe, no satura de obstáculos
  const distM = Math.floor(targetX / 18);
  const curBiome = getCurrentBiome(distM);

  const patterns = ['stump', 'high_barrier', 'coco_runner', 'coco_rolling', 'double_threat'];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];

  if(pattern === 'stump'){
    // Obstáculo bajo contextual al bioma
    obstacles.push({
      id: entityIdCounter++,
      type: 'low_stump',
      biomeId: curBiome.id,
      x: targetX,
      y: GROUND_Y - 48,
      w: 48,
      h: 48,
      broken: false
    });
    // Arco de 3 monedas doradas
    for(let i = 0; i < 3; i++){
      const cx = targetX - 45 + i * 45;
      const cy = GROUND_Y - 95 - Math.sin((i / 2) * Math.PI) * 55;
      coins.push({ id: entityIdCounter++, x: cx, y: cy, collected: false, rot: 0 });
    }
  } else if(pattern === 'high_barrier'){
    // Barrera alta (obligatorio agacharse/deslizarse)
    obstacles.push({
      id: entityIdCounter++,
      type: 'high_barrier',
      biomeId: curBiome.id,
      x: targetX,
      y: GROUND_Y - 110,
      w: 90,
      h: 52,
      broken: false
    });
    for(let i = 0; i < 3; i++){
      coins.push({ id: entityIdCounter++, x: targetX - 35 + i * 35, y: GROUND_Y - 22, collected: false, rot: 0 });
    }
  } else if(pattern === 'coco_runner'){
    // Coco guerrero corriendo hacia Talon
    enemies.push({
      id: entityIdCounter++,
      type: 'coco_concha',
      biomeId: curBiome.id,
      x: targetX + 120,
      y: GROUND_Y - 66,
      w: 56,
      h: 66,
      vx: -135,
      vy: 0,
      hp: 1,
      maxHp: 1,
      state: 'run',
      anim: 0,
      deadTimer: 0
    });
  } else if(pattern === 'coco_rolling'){
    // Coco salvaje rebotando
    enemies.push({
      id: entityIdCounter++,
      type: 'coco_rodante',
      biomeId: curBiome.id,
      x: targetX + 90,
      y: GROUND_Y - 38,
      w: 36,
      h: 36,
      vx: -210,
      vy: -130,
      hp: 1,
      maxHp: 1,
      state: 'run',
      anim: 0,
      deadTimer: 0
    });
    coins.push({ id: entityIdCounter++, x: targetX + 90, y: GROUND_Y - 105, collected: false, rot: 0 });
  } else if(pattern === 'double_threat'){
    // Obstáculo alto seguido de coco o doble salto
    obstacles.push({
      id: entityIdCounter++,
      type: 'high_barrier',
      biomeId: curBiome.id,
      x: targetX,
      y: GROUND_Y - 110,
      w: 86,
      h: 52,
      broken: false
    });
    enemies.push({
      id: entityIdCounter++,
      type: 'coco_concha',
      biomeId: curBiome.id,
      x: targetX + 180,
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
  }

  // Reliquias de poder aleatorias
  if(Math.random() < 0.20 && targetX > 1200){
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
      x: targetX + 260,
      y: GROUND_Y - 110,
      color: chosen.color,
      icon: chosen.icon,
      collected: false
    });
  }
}

// COMPROBACIÓN DE EVENTOS DE JEFES DE HISTORIA
function checkStoryBossEvents(){
  if(currentBoss || isStoryVictory) return;

  for(let i = 0; i < storyFragments.length; i++){
    const frag = storyFragments[i];
    // Si aún no está recolectado y el jugador llegó a la distancia del jefe
    if(!frag.collected && gameDistance >= frag.bossMeters && gameDistance <= frag.bossMeters + 120){
      triggerBossEncounter(frag);
      break;
    }
  }
}

function triggerBossEncounter(frag){
  playBossWarningSound();
  screenShake = 0.45;
  bossWarningTimer = 3.2;

  const hpTable = [3, 4, 5, 6];
  currentBoss = {
    fragmentId: frag.id,
    name: frag.bossName,
    title: frag.bossTitle,
    icon: frag.icon,
    color: frag.color,
    hp: hpTable[frag.id] || 4,
    maxHp: hpTable[frag.id] || 4,
    x: player.x + 950,
    y: GROUND_Y - 82,
    w: 78,
    h: 82,
    vx: -95,
    attackTimer: 0,
    hurtTimer: 0,
    state: 'fight',
    deadTimer: 0
  };

  spawnFloatingText(`⚠️ ¡ALERTA DE JEFE! ${frag.bossName}`, player.x + 350, GROUND_Y - 180, '#ff1744', 22);
}

// REINICIO DE EXPEDICIÓN CON POSIBILIDAD DE CHECKPOINT DE BIOMA
function restartRunner(startMeters = 0){
  const startX = startMeters * 18 + 120;
  player.x = startX;
  player.y = GROUND_Y - MASTER_CHARACTER.h;
  player.vx = 330;
  player.vy = 0;
  player.onGround = true;
  player.hearts = 3;
  player.hurtTime = 0;
  player.shield = false;
  player.shieldTime = 0;
  player.magnetTime = 0;
  player.sliding = false;

  gameDistance = startMeters;
  isGameOver = false;
  gameOverTime = 0;
  isStoryVictory = false;
  storyVictoryTimer = 0;
  currentBoss = null;
  bossWarningTimer = 0;

  obstacles.length = 0;
  enemies.length = 0;
  coins.length = 0;
  relics.length = 0;
  stones.length = 0;
  bossProjectiles.length = 0;
  particles.length = 0;
  floatingTexts.length = 0;

  nextSpawnX = startX + 800;
  lastAnnouncedBiome = -1;
}

// BUCLE DE FÍSICA Y ACTUALIZACIÓN
let last = performance.now();
function update(dt){
  if(isInMenu) return;

  if(isGameOver){
    gameOverTime += dt;
    return;
  }
  if(isStoryVictory){
    storyVictoryTimer += dt;
    return;
  }

  // Distancia recorrida
  gameDistance = Math.floor(player.x / 18);
  if(gameDistance > highRecord){
    highRecord = gameDistance;
    isNewRecord = true;
    localStorage.setItem('talon_runner_best_meters', highRecord.toString());
  }

  // Notificador de entrada de Bioma
  const curBiome = getCurrentBiome(gameDistance);
  if(curBiome.id !== lastAnnouncedBiome){
    lastAnnouncedBiome = curBiome.id;
    zoneBannerText = curBiome.banner;
    zoneBannerTimer = 3.5;
    playVictoryFanfare();
    // Desbloqueo permanente de zona para portales
    if(curBiome.id > unlockedZone){
      unlockedZone = curBiome.id;
      localStorage.setItem('talon_unlocked_zone', unlockedZone.toString());
    }
  }
  if(zoneBannerTimer > 0) zoneBannerTimer -= dt;
  if(bossWarningTimer > 0) bossWarningTimer -= dt;

  // Comprobar eventos de jefes
  checkStoryBossEvents();

  // Combo decay
  if(comboTimer > 0){
    comboTimer -= dt;
    if(comboTimer <= 0) comboStreak = 0;
  }

  // Controles
  const upKey = pressed('ArrowUp', 'w', 'KeyW', 'Space', 'KeyC', 'c', 'C') || runTapJump;
  const downKey = pressed('ArrowDown', 's', 'KeyS');
  const leftKey = pressed('ArrowLeft', 'a', 'KeyA');
  const rightKey = pressed('ArrowRight', 'd', 'KeyD', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight');
  const attackPressed = pressed('KeyX', 'x', 'X', 'KeyZ', 'z', 'Z', 'KeyJ');

  // Velocidad de avance
  const baseSpeed = 330 + Math.min(140, gameDistance * 0.15);
  let moveVx = baseSpeed;
  if(rightKey) moveVx += 120;
  if(leftKey) moveVx -= 140;
  player.vx = moveVx;

  // Mecánica de Deslizamiento (Slide)
  const wantsSlide = downKey && player.onGround;
  const oldH = player.h;
  if(wantsSlide){
    player.sliding = true;
    player.slideTime += dt;
    player.h = 56; // Hitbox baja
    if(player.onGround && oldH !== player.h){
      player.y += (oldH - player.h); // Ancla las botas firmemente al suelo sin saltos
    }
    spawnSlideDust(player.x + 20, GROUND_Y);
  } else {
    player.sliding = false;
    player.slideTime = 0;
    player.h = MASTER_CHARACTER.h;
    if(player.onGround && oldH !== player.h){
      player.y -= (player.h - oldH); // Ancla las botas firmemente al suelo sin saltos
    }
  }

  // Salto y Doble Salto
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
      spawnSlashSparks(player.x + player.w/2, player.y + player.h, 10, curBiome.color);
    }
  }
  player.jumpLatch = upKey;
  runTapJump = false;

  // Ataque de Resortera 360°
  let targetAim = 0;
  if(pressed('ArrowUp', 'KeyW', 'w')) targetAim = -Math.PI / 3;
  else targetAim = 0;

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
      const stoneSpeed = 850;
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

  // Físicas del jugador
  player.x += player.vx * dt;
  player.vy += 1350 * dt;
  player.y += player.vy * dt;

  // Contacto con el suelo continuo de piedra
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

  if(player.onGround && !player.sliding){
    stepDistance += player.vx * dt;
    if(stepDistance >= 85){
      stepDistance = 0;
      playStep('stone');
    }
  }

  if(player.onGround){
    player.anim += dt * (player.vx > 360 ? 14 : 9);
    player.frame = Math.floor(player.anim) % 6;
  }
  if(player.doubleJumpTime > 0) player.doubleJumpTime += dt;
  if(player.hurtTime > 0) player.hurtTime -= dt;

  if(player.shieldTime > 0){
    player.shieldTime -= dt;
    if(player.shieldTime <= 0) player.shield = false;
  }
  if(player.magnetTime > 0) player.magnetTime -= dt;

  // ACTUALIZACIÓN DE PROYECTILES DE RESORTERA
  for(let sIdx = stones.length - 1; sIdx >= 0; sIdx--){
    const st = stones[sIdx];
    st.life -= dt;
    if(st.life <= 0){ stones.splice(sIdx, 1); continue; }

    st.prevX = st.x; st.prevY = st.y;
    st.trail.push({ x: st.x, y: st.y });
    if(st.trail.length > 5) st.trail.shift();

    st.x += st.vx * dt;
    st.y += st.vy * dt;
    st.vy += 220 * dt;
    st.rot += 12 * dt;

    if(st.y >= GROUND_Y - 4){
      spawnSlashSparks(st.x, GROUND_Y - 4, 6, '#b0bec5');
      stones.splice(sIdx, 1);
      continue;
    }

    // Impacto con obstáculos rompibles
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

    // Impacto contra el Jefe de Historia
    if(currentBoss && currentBoss.state === 'fight'){
      if(st.x >= currentBoss.x && st.x <= currentBoss.x + currentBoss.w && st.y >= currentBoss.y && st.y <= currentBoss.y + currentBoss.h){
        currentBoss.hp--;
        currentBoss.hurtTimer = 0.28;
        stoneHit = true;
        screenShake = 0.25;
        playCoconutCrack();
        spawnSlashSparks(st.x, st.y, 16, currentBoss.color);
        spawnFloatingText('-1 HP!', currentBoss.x + currentBoss.w/2, currentBoss.y - 15, '#ff1744', 18);

        if(currentBoss.hp <= 0){
          defeatStoryBoss();
        }
        stones.splice(sIdx, 1);
        continue;
      }
    }

    // Impacto contra enemigos normales
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

  // ACTUALIZACIÓN DEL JEFE DE HISTORIA
  if(currentBoss){
    if(currentBoss.state === 'fight'){
      currentBoss.x += currentBoss.vx * dt;
      currentBoss.attackTimer += dt;
      if(currentBoss.hurtTimer > 0) currentBoss.hurtTimer -= dt;

      // Ataques especiales del Jefe (orbes de fuego o proyectiles piratas)
      if(currentBoss.attackTimer >= 2.2){
        currentBoss.attackTimer = 0;
        const bpx = currentBoss.x - 10;
        const bpy = (Math.random() < 0.5) ? (GROUND_Y - 95) : (GROUND_Y - 35); // Alto o bajo
        bossProjectiles.push({
          x: bpx, y: bpy, vx: -380, r: 12,
          color: currentBoss.color, life: 3.0
        });
        playSlingshotShoot();
      }

      // Evita alejarse demasiado de Talon
      if(currentBoss.x < player.x + 380) currentBoss.vx = 40;
      else if(currentBoss.x > player.x + 650) currentBoss.vx = -120;

      // PISOTÓN contra el Jefe (Jump Stomp)
      const bossStomp = player.vy > 50 && (player.y + player.h <= currentBoss.y + 35) && (player.y + player.h >= currentBoss.y - 15) &&
                        (player.x + player.w * 0.8 > currentBoss.x) && (player.x + player.w * 0.2 < currentBoss.x + currentBoss.w);

      if(bossStomp){
        currentBoss.hp--;
        currentBoss.hurtTimer = 0.28;
        player.vy = -540; // Gran rebote
        screenShake = 0.35;
        playCoconutCrack();
        spawnSlashSparks(currentBoss.x + currentBoss.w/2, currentBoss.y, 22, currentBoss.color);
        spawnFloatingText('¡PISOTÓN ÉPICO! -1 HP', currentBoss.x + currentBoss.w/2, currentBoss.y - 25, '#00e676', 19);

        if(currentBoss.hp <= 0){
          defeatStoryBoss();
        }
      }

      // Colisión cuerpo a cuerpo con el Jefe
      const bHitBox = { x: player.x + 8, y: player.y + 10, w: player.w - 16, h: player.h - 10 };
      const bBossBox = { x: currentBoss.x, y: currentBoss.y, w: currentBoss.w, h: currentBoss.h };
      if(bHitBox.x < bBossBox.x + bBossBox.w && bHitBox.x + bHitBox.w > bBossBox.x &&
         bHitBox.y < bBossBox.y + bBossBox.h && bHitBox.y + bHitBox.h > bBossBox.y){
        if(player.hurtTime <= 0) handlePlayerDamage();
      }
    } else if(currentBoss.state === 'dead'){
      currentBoss.deadTimer += dt;
      if(currentBoss.deadTimer > 2.0){
        currentBoss = null;
      }
    }
  }

  // ACTUALIZACIÓN DE PROYECTILES DEL JEFE
  for(let pIdx = bossProjectiles.length - 1; pIdx >= 0; pIdx--){
    const bp = bossProjectiles[pIdx];
    bp.life -= dt;
    if(bp.life <= 0){ bossProjectiles.splice(pIdx, 1); continue; }
    bp.x += bp.vx * dt;

    // Colisión de proyectil del jefe con Talon
    const bpHit = (player.x + player.w > bp.x - bp.r && player.x < bp.x + bp.r &&
                   player.y + player.h > bp.y - bp.r && player.y < bp.y + bp.r);

    if(bpHit){
      bossProjectiles.splice(pIdx, 1);
      spawnSlashSparks(bp.x, bp.y, 14, bp.color);
      if(player.hurtTime <= 0) handlePlayerDamage();
    }
  }

  // ACTUALIZACIÓN DE ENEMIGOS COCOS NORMALES
  for(const en of enemies){
    if(en.state === 'hit'){ en.deadTimer += dt; continue; }
    en.anim += dt * 10;
    en.x += en.vx * dt;

    if(en.type === 'coco_rodante'){
      en.y += en.vy * dt;
      en.vy += 980 * dt;
      if(en.y + en.h >= GROUND_Y){
        en.y = GROUND_Y - en.h;
        en.vy = -180;
      }
    }

    // Pisotón normal
    const stompCondition = player.vy > 50 && (player.y + player.h <= en.y + 32) && (player.y + player.h >= en.y - 12) &&
                           (player.x + player.w * 0.8 > en.x) && (player.x + player.w * 0.2 < en.x + en.w);

    if(stompCondition){
      en.state = 'hit';
      en.deadTimer = 0.001;
      player.vy = -530;
      player.jumpCount = 1;
      cocosDefeated++;
      comboStreak++;
      comboTimer = 2.4;
      spawnCoconutShatter(en.x + en.w/2, en.y + en.h/2);
      playCoconutCrack();
      spawnFloatingText(`¡PISOTÓN! +100`, en.x + en.w/2, en.y - 20, '#00e676', 18);
      continue;
    }

    const hitBox = { x: player.x + 8, y: player.y + 10, w: player.w - 16, h: player.h - 10 };
    const enBox = { x: en.x, y: en.y, w: en.w, h: en.h };
    if(hitBox.x < enBox.x + enBox.w && hitBox.x + hitBox.w > enBox.x &&
       hitBox.y < enBox.y + enBox.h && hitBox.y + hitBox.h > enBox.y){
      if(player.hurtTime <= 0) handlePlayerDamage();
    }
  }

  // ACTUALIZACIÓN DE OBSTÁCULOS
  for(const ob of obstacles){
    if(ob.broken) continue;
    const hitBox = { x: player.x + 8, y: player.y + 6, w: player.w - 16, h: player.h - 6 };
    if(hitBox.x < ob.x + ob.w && hitBox.x + hitBox.w > ob.x &&
       hitBox.y < ob.y + ob.h && hitBox.y + hitBox.h > ob.y){
      if(player.hurtTime <= 0) handlePlayerDamage();
    }
  }

  // ACTUALIZACIÓN DE MONEDAS
  for(const c of coins){
    if(c.collected) continue;
    c.rot += dt * 5;

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

  // ACTUALIZACIÓN DE RELIQUIAS
  for(const r of relics){
    if(r.collected) continue;
    const distPlayer = Math.hypot((player.x + player.w/2) - r.x, (player.y + player.h/2) - r.y);
    if(distPlayer < 50){
      r.collected = true;
      playRelicSound();
      spawnSlashSparks(r.x, r.y, 25, r.color);
      spawnFloatingText(r.text, r.x, r.y - 25, r.color, 19);

      if(r.type === 'shield'){ player.shield = true; player.shieldTime = 12.0; }
      else if(r.type === 'magnet'){ player.magnetTime = 10.0; }
      else if(r.type === 'gem'){ coinsCollected += 25; }
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

  // Spawner procedural infinito
  const cam = cameraX();
  while(nextSpawnX < cam + 1900){
    spawnChunkAhead(nextSpawnX);
    nextSpawnX += 360 + Math.random() * 220;
  }

  // Limpieza de memoria
  const cullX = cam - 320;
  for(let i = obstacles.length - 1; i >= 0; i--){ if(obstacles[i].x < cullX) obstacles.splice(i, 1); }
  for(let i = enemies.length - 1; i >= 0; i--){ if(enemies[i].x < cullX) enemies.splice(i, 1); }
  for(let i = coins.length - 1; i >= 0; i--){ if(coins[i].x < cullX) coins.splice(i, 1); }
  for(let i = relics.length - 1; i >= 0; i--){ if(relics[i].x < cullX) relics.splice(i, 1); }
  for(let i = stones.length - 1; i >= 0; i--){ if(stones[i].x < cullX || stones[i].x > cam + 2000) stones.splice(i, 1); }
  for(let i = bossProjectiles.length - 1; i >= 0; i--){ if(bossProjectiles[i].x < cullX) bossProjectiles.splice(i, 1); }
}

// DERROTA DEL JEFE DE HISTORIA Y OBTENCIÓN DEL FRAGMENTO DEL TÓTEM
function defeatStoryBoss(){
  if(!currentBoss) return;
  currentBoss.state = 'dead';
  currentBoss.deadTimer = 0.001;
  screenShake = 0.65;
  playVictoryFanfare();

  // Explosión cinematográfica
  spawnCoconutShatter(currentBoss.x + currentBoss.w/2, currentBoss.y + currentBoss.h/2);
  spawnSlashSparks(currentBoss.x + currentBoss.w/2, currentBoss.y + currentBoss.h/2, 40, '#ffd700');
  spawnSlashSparks(currentBoss.x + currentBoss.w/2, currentBoss.y + currentBoss.h/2, 30, currentBoss.color);

  // Otorgar Fragmento del Tótem
  const frag = storyFragments[currentBoss.fragmentId];
  if(frag){
    frag.collected = true;
    // Guardar progreso en localStorage
    const collectedIds = storyFragments.filter(f => f.collected).map(f => f.id);
    localStorage.setItem('talon_story_fragments', JSON.stringify(collectedIds));

    spawnFloatingText(`✨ ¡${frag.name.toUpperCase()} RECUPERADO! ✨`, player.x + 200, GROUND_Y - 160, frag.color, 24);
    coinsCollected += 100;
    cocosDefeated += 5;
  }

  // Comprobar si los 4 fragmentos fueron reunidos -> ¡VICTORIA DE LA HISTORIA!
  const allCollected = storyFragments.every(f => f.collected);
  if(allCollected){
    setTimeout(() => {
      isStoryVictory = true;
      storyVictoryTimer = 0.001;
      playVictoryFanfare();
    }, 1200);
  }
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
  screenShake = 0.35;
  playHollowThud();
  spawnSlashSparks(player.x + player.w/2, player.y + player.h/2, 16, '#ff1744');

  if(player.hearts <= 0){
    isGameOver = true;
    gameOverTime = 0;
    playGameOverSound();
  }
}

// ============================================================================
// RENDERIZADO VISUAL DEL MUNDO EXTENDIDO Y BIOMAS (SIN GLITCHES NI SALTOS)
// ============================================================================
function drawWorld(){
  const s = scale();
  const cam = cameraX();
  const tileW = BG_WIDTH * s;
  const tileH = VIEW_BASE.h * s;
  const distM = gameDistance;

  // Determinar bioma activo y bioma siguiente
  let activeBiomeIdx = 0;
  for(let i = BIOMES.length - 1; i >= 0; i--){
    if(distM >= BIOMES[i].startMeters){
      activeBiomeIdx = i;
      break;
    }
  }

  const curB = BIOMES[activeBiomeIdx];
  const nextB = BIOMES[Math.min(BIOMES.length - 1, activeBiomeIdx + 1)];

  // Cálculo de mezcla de transición suave (fade de 80 metros)
  let blendAlpha = 0;
  if(activeBiomeIdx < BIOMES.length - 1){
    const transitionStart = nextB.startMeters - 80;
    if(distM >= transitionStart){
      blendAlpha = Math.min(1, Math.max(0, (distM - transitionStart) / 80));
    }
  }

  // Desplazamiento horizontal continuo
  const offset = ((cam * s) % tileW + tileW) % tileW;
  const startX = -offset;

  // Dibuja suficientes baldosas con solapamiento de 2px para que NUNCA haya líneas ni saltos
  const wDraw = Math.ceil(tileW) + 2;
  const hDraw = Math.ceil(tileH) + 2;
  const yDraw = 0;

  for(let x = Math.floor(startX); x < innerWidth + tileW; x += Math.floor(tileW)){
    ctx.drawImage(curB.bg, x, yDraw, wDraw, hDraw);
    if(blendAlpha > 0 && nextB){
      ctx.save();
      ctx.globalAlpha = blendAlpha;
      ctx.drawImage(nextB.bg, x, yDraw, wDraw, hDraw);
      ctx.restore();
    }
  }
}

function drawAtmosphere(now){
  const s = scale(), cam = cameraX(), t = now * 0.001;
  const curBiome = getCurrentBiome(gameDistance);
  const viewW = innerWidth / s;
  const maxW = viewW + 400;

  ctx.save();
  ctx.scale(s, s);

  if(curBiome.id === 0){
    // Selva Esmeralda: Rayos de sol y motes dorados
    for(let r = 0; r < 4; r++){
      const rx = ((((r * 600 - cam * 0.25) % maxW) + maxW) % maxW) - 100;
      const rayGrad = ctx.createLinearGradient(rx, 0, rx + 140, 600);
      const alpha = 0.05 + 0.03 * Math.sin(t * 1.5 + r);
      rayGrad.addColorStop(0, `rgba(255, 245, 180, ${alpha * 1.6})`);
      rayGrad.addColorStop(0.5, `rgba(255, 230, 150, ${alpha})`);
      rayGrad.addColorStop(1, 'rgba(255, 220, 140, 0)');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(rx - 20, 0); ctx.lineTo(rx + 40, 0); ctx.lineTo(rx + 240, 650); ctx.lineTo(rx + 160, 650);
      ctx.closePath(); ctx.fill();
    }
  } else if(curBiome.id === 1){
    // Templo del Jaguar (Atardecer): Chispas de fuego
    for(let m = 0; m < 25; m++){
      const mx = ((((m * 85 + t * 45 - cam * 0.35) % maxW) + maxW) % maxW) - 50;
      const my = 150 + (m * 29) % 380 - (t * 20) % 50;
      ctx.fillStyle = `rgba(255, 179, 0, ${0.4 + 0.3 * Math.sin(t * 4 + m)})`;
      ctx.beginPath(); ctx.arc(mx, my, 2.2, 0, Math.PI * 2); ctx.fill();
    }
  } else if(curBiome.id === 2){
    // Cenote Sagrado: Esporas bioluminiscentes turquesas
    for(let c = 0; c < 30; c++){
      const cx = ((((c * 73 + t * 20 - cam * 0.3) % maxW) + maxW) % maxW) - 50;
      const cy = 100 + (c * 27) % 440 + Math.sin(t * 2 + c) * 14;
      ctx.fillStyle = `rgba(0, 229, 255, ${0.35 + 0.3 * Math.sin(t * 3 + c)})`;
      ctx.beginPath(); ctx.arc(cx, cy, 2.0, 0, Math.PI * 2); ctx.fill();
    }
  } else if(curBiome.id === 3){
    // Fortaleza Volcánica: Cenizas incandescentes
    for(let v = 0; v < 35; v++){
      const vx = ((((v * 64 - t * 40 - cam * 0.45) % maxW) + maxW) % maxW) - 50;
      const vy = 120 + (v * 33) % 420 - (t * 35) % 60;
      ctx.fillStyle = (v % 2 === 0) ? `rgba(255, 87, 34, ${0.5 + 0.3 * Math.sin(t * 5 + v)})` : 'rgba(255, 23, 68, 0.6)';
      ctx.beginPath(); ctx.arc(vx, vy, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function render(){
  ctx.clearRect(0, 0, innerWidth, gameHeight());

  let shakeX = 0, shakeY = 0;
  if(screenShake > 0){
    shakeX = (Math.random() - 0.5) * 12 * (screenShake / 0.35);
    shakeY = (Math.random() - 0.5) * 10 * (screenShake / 0.35);
  }
  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawWorld();
  drawAtmosphere(performance.now());

  const s = scale(), cam = cameraX();

  // 1. RENDERIZADO DE OBSTÁCULOS
  for(const ob of obstacles){
    if(ob.broken) continue;
    const ox = (ob.x - cam) * s, oy = ob.y * s, ow = ob.w * s, oh = ob.h * s;
    const biomeColor = BIOMES[ob.biomeId]?.color || '#ffd700';

    if(ob.type === 'low_stump'){
      ctx.save();
      ctx.fillStyle = '#4e342e';
      ctx.strokeStyle = biomeColor;
      ctx.lineWidth = 2.5 * s;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(ox, oy, ow, oh, 6 * s);
      else ctx.rect(ox, oy, ow, oh);
      ctx.fill(); ctx.stroke();

      // Ojos tiki luminosos
      ctx.fillStyle = biomeColor;
      ctx.beginPath();
      ctx.arc(ox + ow * 0.35, oy + oh * 0.45, 3.5 * s, 0, Math.PI * 2);
      ctx.arc(ox + ow * 0.65, oy + oh * 0.45, 3.5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if(ob.type === 'high_barrier'){
      ctx.save();
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(ox + 4 * s, oy, 8 * s, (GROUND_Y - ob.y) * s);
      ctx.fillRect(ox + ow - 12 * s, oy, 8 * s, (GROUND_Y - ob.y) * s);

      const gradBamboo = ctx.createLinearGradient(ox, oy, ox, oy + oh);
      gradBamboo.addColorStop(0, '#558b2f');
      gradBamboo.addColorStop(1, '#2e7d32');
      ctx.fillStyle = gradBamboo;
      ctx.strokeStyle = biomeColor;
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(ox, oy, ow, oh, 8 * s);
      else ctx.rect(ox, oy, ow, oh);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#ffeb3b';
      ctx.font = `bold ${Math.round(11 * s)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('⌄ DESLIZAR ⌄', ox + ow/2, oy + oh * 0.65);
      ctx.restore();
    }
  }

  // 2. RENDERIZADO DE MONEDAS
  for(const c of coins){
    if(c.collected) continue;
    const cx = (c.x - cam) * s, cy = c.y * s;
    const rotScale = Math.cos(c.rot);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rotScale, 1);
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#ff8f00';
    ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.arc(0, 0, 10 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // 3. RENDERIZADO DE RELIQUIAS DE PODER
  for(const r of relics){
    if(r.collected) continue;
    const rx = (r.x - cam) * s;
    const bob = Math.sin(performance.now() * 0.004 + r.id) * 6 * s;
    const ry = r.y * s + bob;
    ctx.save();
    ctx.font = `${Math.round(24 * s)}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(r.icon, rx, ry);
    ctx.restore();
  }

  // 4. RENDERIZADO DE PROYECTILES DEL JEFE
  for(const bp of bossProjectiles){
    const bpx = (bp.x - cam) * s, bpy = bp.y * s;
    ctx.save();
    ctx.fillStyle = bp.color;
    ctx.beginPath(); ctx.arc(bpx, bpy, bp.r * s, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // 5. RENDERIZADO DE ENEMIGOS COCOS
  for(const en of enemies){
    const ex = (en.x + en.w / 2 - cam) * s, ey = (en.y + en.h) * s;
    if(en.type === 'coco_concha'){
      if(cocoConchaWalkSheet.complete && cocoConchaWalkSheet.naturalWidth){
        const psc = (en.h / 193) * s;
        ctx.save();
        if(en.state === 'hit'){
          ctx.translate(ex, ey - 12 * s);
          ctx.rotate(1.42);
          ctx.globalAlpha = Math.max(0, 1 - en.deadTimer / 0.8);
          ctx.scale(psc, psc);
          ctx.drawImage(cocoConchaWalkSheet, 0, 0, 180, 240, -83, -218, 180, 240);
        } else {
          const f = Math.floor(en.anim * 18) % 16;
          ctx.translate(ex, ey); ctx.scale(-psc, psc);
          ctx.drawImage(cocoConchaWalkSheet, f * 180, 0, 180, 240, -83, -218, 180, 240);
        }
        ctx.restore();
      }
    } else if(en.type === 'coco_rodante'){
      if(cocoSheet.complete && cocoSheet.naturalWidth){
        ctx.save();
        ctx.translate(ex, ey - en.h * s / 2);
        if(en.state === 'hit') ctx.globalAlpha = Math.max(0, 1 - en.deadTimer / 0.6);
        else ctx.rotate(-en.anim * 8);
        const sc = (en.w / 44) * s;
        ctx.scale(sc, sc);
        ctx.drawImage(cocoSheet, 0, 0, 64, 64, -32, -32, 64, 64);
        ctx.restore();
      }
    }
  }

  // 6. RENDERIZADO DEL JEFE DE HISTORIA
  if(currentBoss){
    const bx = (currentBoss.x + currentBoss.w / 2 - cam) * s;
    const by = (currentBoss.y + currentBoss.h) * s;
    ctx.save();
    ctx.translate(bx, by);

    // Si recibió daño, parpadea en blanco
    if(currentBoss.hurtTimer > 0){
      ctx.filter = 'brightness(2.2)';
    }

    // Dibujar figura colosal del Jefe
    const bossScale = (currentBoss.h / 140) * s;
    ctx.scale(-bossScale, bossScale); // Mirando hacia Talon

    if(cocoPiratasSheet.complete && cocoPiratasSheet.naturalWidth){
      const row = Math.min(3, currentBoss.fragmentId);
      const col = Math.floor(performance.now() * 0.008) % 4;
      ctx.drawImage(cocoPiratasSheet, col * 140, row * 160, 140, 160, -70, -155, 140, 160);
    }
    ctx.restore();

    // Corona / Corona sagrada sobre el Jefe
    ctx.save();
    ctx.font = `${Math.round(22 * s)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText('👑', bx, by - currentBoss.h * s - 12 * s);
    ctx.restore();
  }

  // 7. RENDERIZADO DEL JUGADOR (TALON 3D)
  const px = (player.x - cam) * s, py = player.y * s;
  let animKey = 'run', activeSheet = runSheet, frame = player.frame;

  if(player.attackTime > 0){
    animKey = 'slingshot'; activeSheet = slingSheet;
    frame = Math.min(FRAMES.slingshot.list.length - 1, Math.floor((player.attackTime / 0.34) * FRAMES.slingshot.list.length));
  } else if(!player.onGround){
    animKey = 'jump'; activeSheet = jumpSheet;
    frame = player.vy < -200 ? 1 : player.vy < 120 ? 2 : 3;
  } else if(player.sliding){
    animKey = 'crouch'; activeSheet = crouchSheet; frame = 4;
  } else {
    animKey = 'run'; activeSheet = runSheet;
  }

  if(activeSheet.complete && activeSheet.width){
    const meta = FRAMES[animKey];
    const f = meta?.list ? meta.list[frame % meta.list.length] : null;
    const sc = meta?.scale || 124/460;
    const fh = activeSheet.height;

    ctx.save();
    if(player.hurtTime > 0 && Math.floor(player.hurtTime * 24) % 2 === 0){
      ctx.globalAlpha = 0.35;
    }
    if(player.shield){
      ctx.save();
      const sGlow = ctx.createRadialGradient(px + player.w*s/2, py + player.h*s/2, 10, px + player.w*s/2, py + player.h*s/2, 45 * s);
      sGlow.addColorStop(0, 'rgba(0, 229, 255, 0.45)');
      sGlow.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = sGlow;
      ctx.beginPath(); ctx.arc(px + player.w*s/2, py + player.h*s/2, 45 * s, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    ctx.translate(px + player.w * s / 2, py + player.h * s);
    ctx.scale(player.face * s * sc, s * sc);
    if(f) ctx.drawImage(activeSheet, f.x, 0, f.w, fh, -f.cx, -f.fy, f.w, fh);
    ctx.restore();
  }

  // 8. PROYECTILES DE RESORTERA
  for(const st of stones){
    const sx = (st.x - cam) * s, sy = st.y * s;
    ctx.save();
    ctx.fillStyle = '#eceff1';
    ctx.beginPath(); ctx.arc(sx, sy, st.r * s, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // 9. PARTÍCULAS Y TEXTOS FLOTANTES
  for(const p of particles){
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.fillStyle = p.color; ctx.globalAlpha = alpha;
    ctx.fillRect((p.x - cam) * s - (p.size * s)/2, p.y * s - (p.size * s)/2, p.size * s, p.size * s);
    ctx.restore();
  }

  for(const ft of floatingTexts){
    const alpha = Math.max(0, ft.life / ft.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = ft.color; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.font = `bold ${Math.round(ft.fontSize * s)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.strokeText(ft.text, (ft.x - cam) * s, ft.y * s);
    ctx.fillText(ft.text, (ft.x - cam) * s, ft.y * s);
    ctx.restore();
  }

  // ==========================================================================
  // 10. HUD DE HISTORIA Y ESTADO EN PANTALLA
  // ==========================================================================
  const curBiomeInfo = getCurrentBiome(gameDistance);
  const hudTopX = 18, hudTopY = 20;

  ctx.save();
  // Vidas
  let heartStr = '';
  for(let h = 0; h < player.maxHearts; h++) heartStr += (h < player.hearts) ? '❤️ ' : '🖤 ';
  ctx.font = `bold ${Math.round(20 * s)}px system-ui`;
  ctx.fillText(heartStr, hudTopX, hudTopY + 16 * s);

  // Distancia y Zona Activa
  ctx.font = `bold ${Math.round(18 * s)}px system-ui`;
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#000000'; ctx.lineWidth = 3.5;
  ctx.strokeText(`🏃 ${gameDistance} m  ·  ${curBiomeInfo.name}`, hudTopX, hudTopY + 44 * s);
  ctx.fillText(`🏃 ${gameDistance} m  ·  ${curBiomeInfo.name}`, hudTopX, hudTopY + 44 * s);

  ctx.font = `bold ${Math.round(13 * s)}px system-ui`;
  ctx.fillStyle = '#ffd700';
  ctx.strokeText(`🏆 Récord: ${highRecord} m`, hudTopX, hudTopY + 65 * s);
  ctx.fillText(`🏆 Récord: ${highRecord} m`, hudTopX, hudTopY + 65 * s);

  // MONEDAS Y COCOS (DERECHA)
  const rightHUDX = innerWidth - 190 * s;
  ctx.font = `bold ${Math.round(16 * s)}px system-ui`;
  ctx.fillStyle = '#ffd700';
  ctx.strokeText(`🪙 Monedas: ${coinsCollected}`, rightHUDX, hudTopY + 20 * s);
  ctx.fillText(`🪙 Monedas: ${coinsCollected}`, rightHUDX, hudTopY + 20 * s);

  ctx.fillStyle = '#ff5722';
  ctx.strokeText(`💥 Cocos K.O.: ${cocosDefeated}`, rightHUDX, hudTopY + 44 * s);
  ctx.fillText(`💥 Cocos K.O.: ${cocosDefeated}`, rightHUDX, hudTopY + 44 * s);

  // ALTAR DE LOS 4 FRAGMENTOS DEL TÓTEM SOLAR (CENTRO SUPERIOR)
  const totemHUDW = 280 * s;
  const totemHUDX = (innerWidth - totemHUDW) / 2;
  ctx.fillStyle = 'rgba(12, 28, 32, 0.82)';
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(totemHUDX, hudTopY, totemHUDW, 36 * s, 10 * s);
  else ctx.rect(totemHUDX, hudTopY, totemHUDW, 36 * s);
  ctx.fill(); ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.round(12 * s)}px system-ui`;
  ctx.fillStyle = '#ffe082';
  let fragStr = '☀️ TÓTEM: ';
  storyFragments.forEach(f => {
    fragStr += f.collected ? `${f.icon} ` : '🔒 ';
  });
  ctx.fillText(fragStr, innerWidth / 2, hudTopY + 23 * s);

  // BARRA DE VIDA DEL JEFE DE HISTORIA
  if(currentBoss && currentBoss.state === 'fight'){
    const bBarW = Math.min(380 * s, innerWidth - 40);
    const bBarX = (innerWidth - bBarW) / 2;
    const bBarY = hudTopY + 44 * s;

    ctx.fillStyle = 'rgba(20, 10, 10, 0.88)';
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(bBarX, bBarY, bBarW, 30 * s, 8 * s);
    else ctx.rect(bBarX, bBarY, bBarW, 30 * s);
    ctx.fill(); ctx.stroke();

    const hpPercent = Math.max(0, currentBoss.hp / currentBoss.maxHp);
    ctx.fillStyle = currentBoss.color;
    ctx.fillRect(bBarX + 4 * s, bBarY + 4 * s, (bBarW - 8 * s) * hpPercent, 22 * s);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(12 * s)}px system-ui`;
    ctx.fillText(`👑 ${currentBoss.name.toUpperCase()} (HP: ${currentBoss.hp}/${currentBoss.maxHp})`, innerWidth / 2, bBarY + 19 * s);
  }

  // CARTEL MONUMENTAL DE ENTRADA A NUEVO BIOMA
  if(zoneBannerTimer > 0){
    const bAlpha = Math.min(1, zoneBannerTimer / 0.5);
    ctx.globalAlpha = bAlpha;
    ctx.fillStyle = 'rgba(10, 24, 28, 0.9)';
    ctx.strokeStyle = curBiomeInfo.color;
    ctx.lineWidth = 3 * s;
    const zBoxW = Math.min(520 * s, innerWidth - 30);
    const zBoxX = (innerWidth - zBoxW) / 2;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(zBoxX, 90 * s, zBoxW, 55 * s, 14 * s);
    else ctx.rect(zBoxX, 90 * s, zBoxW, 55 * s);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = curBiomeInfo.color;
    ctx.font = `bold ${Math.round(19 * s)}px system-ui`;
    ctx.fillText(zoneBannerText, innerWidth / 2, 125 * s);
    ctx.globalAlpha = 1.0;
  }
  ctx.restore();

  // OVERLAY DE GRAN VICTORIA DE LA HISTORIA
  if(isStoryVictory){
    ctx.save();
    ctx.fillStyle = 'rgba(6, 18, 22, 0.92)';
    ctx.fillRect(0, 0, innerWidth, gameHeight());

    const popW = Math.min(560, innerWidth - 36), popH = 420;
    const popX = (innerWidth - popW) / 2, popY = (gameHeight() - popH) / 2;

    ctx.fillStyle = '#102e2b';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(popX, popY, popW, popH, 20);
    else ctx.rect(popX, popY, popW, popH);
    ctx.fill(); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 30px system-ui';
    ctx.fillText('☀️ ¡EL CORAZÓN DEL SOL RESTAURADO!', innerWidth / 2, popY + 54);

    ctx.fillStyle = '#a5d6a7'; ctx.font = 'bold 16px system-ui';
    ctx.fillText('Talon derrotó a los 4 Generales Coco y salvó la Isla Tropical', innerWidth / 2, popY + 92);

    // Los 4 Fragmentos Reinstalados
    ctx.font = '36px system-ui';
    ctx.fillText('🟢 🟡 🟣 🔴', innerWidth / 2, popY + 150);

    ctx.fillStyle = '#ffffff'; ctx.font = '17px system-ui';
    ctx.fillText(`Distancia Épica: ${gameDistance} m`, innerWidth / 2, popY + 205);
    ctx.fillStyle = '#ffd54f';
    ctx.fillText(`Monedas: 🪙 ${coinsCollected}   ·   Cocos K.O.: 💥 ${cocosDefeated}`, innerWidth / 2, popY + 238);

    ctx.fillStyle = '#80e27e'; ctx.font = 'bold 20px system-ui';
    ctx.fillText('🏆 RANGO: HÉROE LEGENDARIO DE LA SELVA', innerWidth / 2, popY + 285);

    ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 18px system-ui';
    ctx.fillText('🔄 PRESIONA ESPACIO O TOCA PARA OTRA EXPEDICIÓN', innerWidth / 2, popY + 348);
    ctx.restore();
  }

  // OVERLAY DE GAME OVER
  if(isGameOver){
    ctx.save();
    ctx.fillStyle = 'rgba(10, 20, 28, 0.88)';
    ctx.fillRect(0, 0, innerWidth, gameHeight());

    const popW = Math.min(520, innerWidth - 36), popH = 340;
    const popX = (innerWidth - popW) / 2, popY = (gameHeight() - popH) / 2;

    ctx.fillStyle = '#1c2833';
    ctx.strokeStyle = isNewRecord ? '#ffd700' : '#ff5722';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(popX, popY, popW, popH, 18);
    else ctx.rect(popX, popY, popW, popH);
    ctx.fill(); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff3d00'; ctx.font = 'bold 28px system-ui';
    ctx.fillText('💀 FIN DE LA EXPEDICIÓN', innerWidth / 2, popY + 48);

    ctx.fillStyle = '#ffffff'; ctx.font = '18px system-ui';
    ctx.fillText(`Distancia alcanzada: ${gameDistance} m (${curBiomeInfo.name})`, innerWidth / 2, popY + 115);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Mejor Récord: ${highRecord} m`, innerWidth / 2, popY + 150);

    ctx.fillStyle = '#81d4fa'; ctx.font = '16px system-ui';
    ctx.fillText(`🪙 Monedas: ${coinsCollected}   ·   💥 Cocos K.O.: ${cocosDefeated}`, innerWidth / 2, popY + 190);

    ctx.fillStyle = '#00e676'; ctx.font = 'bold 20px system-ui';
    ctx.fillText('🔄 PRESIONA ESPACIO O TOCA PARA REINTENTAR', innerWidth / 2, popY + 260);
    ctx.restore();
  }

  ctx.restore(); // screenShake restore
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
  loadImg(bgJungle), loadImg(bgTemple), loadImg(bgCenote), loadImg(bgVolcano),
  loadImg(runSheet), loadImg(idleSheet), loadImg(crouchSheet),
  loadImg(jumpSheet), loadImg(slingSheet), loadImg(cocoConchaWalkSheet),
  loadImg(cocoPiratasSheet), loadImg(cocoSheet), loadImg(enemySheet)
]).then(() => requestAnimationFrame(loop));

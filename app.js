// ==========================================================
// STATE MANAGEMENT
// ==========================================================
const state = {
  role: 'psychologist', // 'psychologist' | 'patient'
  username: 'dr. Elz, Psikolog',
  roomCode: 'TRQ-482-SEA',
  environment: 'beach', // 'beach' | 'forest' | 'sanctuary'
  avatarColor: 'teal', // 'teal' | 'indigo' | 'rose' | 'amber'
  isInVR: false,
  micMuted: false,
  activeBgm: null, // null | 'ocean' | 'rain' | 'forest'
  activeCard: null, // null | 'love' | 'worry' | 'calm'
  sessionStartTime: null,
  timerInterval: null,
  demoMode: false,
  breathingActive: false
};

// ==========================================================
// ENVIRONMENT DEFINITIONS FOR A-FRAME
// ==========================================================
// Maps each lobby environment choice to an A-Frame environment-component preset
const envPresets = {
  beach:     { preset: 'default', seed: 3, extra: '; groundColor: #e8d5a0; groundColor2: #d4b87a; skyType: atmosphere; skyColor: #87ceeb; horizonColor: #ffe8c0; dressing: none; grid: none; fog: 0.6' },
  forest:    { preset: 'forest',  seed: 7, extra: '' },
  sanctuary: { preset: 'japan',   seed: 5, extra: '' }
};

const partnerAvatarColors = {
  teal: '#6366f1',  // If user is teal, partner is indigo
  indigo: '#14b8a6',// If user is indigo, partner is teal
  rose: '#f59e0b',  // If user is rose, partner is amber
  amber: '#f43f5e'  // If user is amber, partner is rose
};

// ==========================================================
// SYNTHESIZED SOUNDS & DYNAMIC CONTROL
// ==========================================================
let audioCtx = null;
let activeAmbient = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function stopAmbient(fadeDuration = 0) {
  if (!activeAmbient) return;
  
  const oldAmbient = activeAmbient;
  activeAmbient = null;
  
  if (oldAmbient.interval) {
    clearInterval(oldAmbient.interval);
    oldAmbient.interval = null;
  }
  
  if (fadeDuration > 0 && oldAmbient.gain && audioCtx) {
    const now = audioCtx.currentTime;
    const currentGain = oldAmbient.gain.gain.value;
    oldAmbient.gain.gain.setValueAtTime(currentGain, now);
    oldAmbient.gain.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);
    
    setTimeout(() => {
      try { if (oldAmbient.source) oldAmbient.source.stop(); } catch(e) {}
      try { if (oldAmbient.lfo) oldAmbient.lfo.stop(); } catch(e) {}
      
      if (oldAmbient.source) oldAmbient.source.disconnect();
      if (oldAmbient.gain) oldAmbient.gain.disconnect();
      if (oldAmbient.filter) oldAmbient.filter.disconnect();
      if (oldAmbient.lfo) oldAmbient.lfo.disconnect();
    }, fadeDuration * 1000 + 100);
  } else {
    try { if (oldAmbient.source) oldAmbient.source.stop(); } catch(e) {}
    try { if (oldAmbient.lfo) oldAmbient.lfo.stop(); } catch(e) {}
    
    if (oldAmbient.source) oldAmbient.source.disconnect();
    if (oldAmbient.gain) oldAmbient.gain.disconnect();
    if (oldAmbient.filter) oldAmbient.filter.disconnect();
    if (oldAmbient.lfo) oldAmbient.lfo.disconnect();
  }
}

function createNoiseBuffer(type = 'white') {
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  let b0, b1, b2, b3, b4, b5, b6;
  b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    if (type === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    } else {
      output[i] = white;
    }
  }
  return noiseBuffer;
}

function playAmbientOcean() {
  initAudio();
  stopAmbient(1.5);
  
  const now = audioCtx.currentTime;
  const noise = audioCtx.createBufferSource();
  noise.buffer = createNoiseBuffer('pink');
  noise.loop = true;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(350, now);
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 1.5);
  
  const lfo = audioCtx.createOscillator();
  lfo.frequency.setValueAtTime(0.12, now);
  
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.setValueAtTime(0.08, now);
  
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  
  noise.start(0);
  lfo.start(0);
  
  activeAmbient = {
    source: noise,
    gain: gain,
    filter: filter,
    lfo: lfo,
    interval: null
  };
  
  updateBgmTextInVR("Ocean Waves");
}

function playAmbientRain() {
  initAudio();
  stopAmbient(1.5);
  
  const now = audioCtx.currentTime;
  const noise = audioCtx.createBufferSource();
  noise.buffer = createNoiseBuffer('white');
  noise.loop = true;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.Q.setValueAtTime(1.0, now);
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 1.5);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  
  noise.start(0);
  
  activeAmbient = {
    source: noise,
    gain: gain,
    filter: filter,
    lfo: null,
    interval: null
  };
  
  updateBgmTextInVR("Soft Rain");
}

function playAmbientForest() {
  initAudio();
  stopAmbient(1.5);
  
  const now = audioCtx.currentTime;
  const wind = audioCtx.createBufferSource();
  wind.buffer = createNoiseBuffer('pink');
  wind.loop = true;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(220, now);
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 1.5);
  
  wind.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  wind.start(0);
  
  const forestInterval = setInterval(() => {
    if (Math.random() > 0.4) {
      triggerBirdChirp();
    }
  }, 3000);
  
  activeAmbient = {
    source: wind,
    gain: gain,
    filter: filter,
    lfo: null,
    interval: forestInterval
  };
  
  updateBgmTextInVR("Forest Birds");
}

function triggerBirdChirp() {
  if (!audioCtx || audioCtx.state === 'suspended') return;
  
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const panner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  
  if (panner) {
    panner.pan.setValueAtTime(Math.random() * 2 - 1, now);
  }
  
  osc.type = 'sine';
  const startFreq = 2000 + Math.random() * 1500;
  const duration = 0.15 + Math.random() * 0.15;
  
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(startFreq + 800, now + duration * 0.4);
  osc.frequency.exponentialRampToValueAtTime(startFreq - 500, now + duration);
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.015, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  
  osc.connect(gain);
  if (panner) {
    gain.connect(panner);
    panner.connect(audioCtx.destination);
  } else {
    gain.connect(audioCtx.destination);
  }
  
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

function updateBgmTextInVR(text) {
  const textEl = document.querySelector('#active-bgm-text');
  if (textEl) {
    textEl.setAttribute('text', `value: Music: ${text}; align: center; color: #14b8a6; width: 1.0; font: kelsonsans;`);
  }
}

// --- Dynamic Mood Light Transitions ---
let moodLightAnim = null;

function transitionMoodLight(targetColorHex, targetIntensity) {
  const lightEl = document.querySelector('#mood-light');
  if (!lightEl) return;
  
  if (moodLightAnim) {
    cancelAnimationFrame(moodLightAnim);
  }
  
  const duration = 1500;
  const startTime = performance.now();
  
  const currentIntensity = parseFloat(lightEl.getAttribute('intensity')) || 0.25;
  const currentColorStr = lightEl.getAttribute('color') || '#ffffff';
  
  const parseHex = (hex) => {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  };
  
  const startColor = parseHex(currentColorStr);
  const endColor = parseHex(targetColorHex);
  
  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const ease = 0.5 * (1 - Math.cos(Math.PI * progress));
    
    const intensity = currentIntensity + (targetIntensity - currentIntensity) * ease;
    lightEl.setAttribute('intensity', intensity);
    
    const r = Math.round(startColor.r + (endColor.r - startColor.r) * ease);
    const g = Math.round(startColor.g + (endColor.g - startColor.g) * ease);
    const b = Math.round(startColor.b + (endColor.b - startColor.b) * ease);
    
    const hex = '#' + [r, g, b].map(x => {
      const s = x.toString(16);
      return s.length === 1 ? '0' + s : s;
    }).join('');
    
    lightEl.setAttribute('color', hex);
    
    if (progress < 1) {
      moodLightAnim = requestAnimationFrame(animate);
    } else {
      moodLightAnim = null;
    }
  }
  
  moodLightAnim = requestAnimationFrame(animate);
}

// --- Visual Guided Breathing (Metronome) ---
let breathingInterval = null;
let breathingPhaseIndex = 0;

function startBreathingGuide() {
  const container = document.querySelector('#breathing-guide-container');
  const sphere = document.querySelector('#breathing-guide-sphere');
  const text = document.querySelector('#breathing-guide-text');
  
  if (!container || !sphere || !text) return;
  
  container.setAttribute('visible', 'true');
  state.breathingActive = true;
  breathingPhaseIndex = 0;
  
  runBreathingPhase();
}

function stopBreathingGuide() {
  const container = document.querySelector('#breathing-guide-container');
  const sphere = document.querySelector('#breathing-guide-sphere');
  if (container) container.setAttribute('visible', 'false');
  if (sphere) {
    sphere.setAttribute('scale', '1 1 1');
    sphere.setAttribute('color', '#14b8a6');
    sphere.removeAttribute('animation__scale');
    sphere.removeAttribute('animation__color');
  }
  
  if (breathingInterval) {
    clearTimeout(breathingInterval);
    breathingInterval = null;
  }
  state.breathingActive = false;
}

function runBreathingPhase() {
  const sphere = document.querySelector('#breathing-guide-sphere');
  const text = document.querySelector('#breathing-guide-text');
  if (!sphere || !text || !state.breathingActive) return;
  
  sphere.removeAttribute('animation__scale');
  sphere.removeAttribute('animation__color');
  
  if (breathingPhaseIndex === 0) {
    text.setAttribute('value', 'TARIK NAPAS\n(Inhale)');
    text.setAttribute('color', '#2dd4bf');
    sphere.setAttribute('animation__scale', 'property: scale; from: 1 1 1; to: 2.5 2.5 2.5; dur: 4000; easing: easeInOutSine; fill: forwards');
    sphere.setAttribute('animation__color', 'property: material.color; from: #14b8a6; to: #0ea5e9; dur: 4000; easing: easeInOutSine; fill: forwards');
  } else if (breathingPhaseIndex === 1) {
    text.setAttribute('value', 'TAHAN NAPAS\n(Hold)');
    text.setAttribute('color', '#f59e0b');
    sphere.setAttribute('scale', '2.5 2.5 2.5');
    sphere.setAttribute('color', '#0ea5e9');
  } else if (breathingPhaseIndex === 2) {
    text.setAttribute('value', 'HEMBUSKAN NAPAS\n(Exhale)');
    text.setAttribute('color', '#f43f5e');
    sphere.setAttribute('animation__scale', 'property: scale; from: 2.5 2.5 2.5; to: 1 1 1; dur: 4000; easing: easeInOutSine; fill: forwards');
    sphere.setAttribute('animation__color', 'property: material.color; from: #0ea5e9; to: #14b8a6; dur: 4000; easing: easeInOutSine; fill: forwards');
  } else if (breathingPhaseIndex === 3) {
    text.setAttribute('value', 'TAHAN NAPAS\n(Hold)');
    text.setAttribute('color', '#f59e0b');
    sphere.setAttribute('scale', '1 1 1');
    sphere.setAttribute('color', '#14b8a6');
  }
  
  breathingInterval = setTimeout(() => {
    breathingPhaseIndex = (breathingPhaseIndex + 1) % 4;
    runBreathingPhase();
  }, 4000);
}

// --- Partner AI Simulation / Demo Mode ---
let demoSimInterval = null;
let demoPartnerTime = 0;
let demoLastActionTime = 0;

function startDemoSimulation() {
  if (!state.demoMode) return;
  
  demoPartnerTime = 0;
  demoLastActionTime = 0;
  
  if (demoSimInterval) clearInterval(demoSimInterval);
  
  const partnerAvatar = document.querySelector('#partner-avatar');
  
  demoSimInterval = setInterval(() => {
    if (!state.isInVR) return;
    
    demoPartnerTime += 1;
    
    // 1. Subtle breathing animation (slow Y scale bobbing)
    const breatheScale = 1.6 + Math.sin(demoPartnerTime * 1.5) * 0.05;
    partnerAvatar.setAttribute('scale', `1.6 ${breatheScale} 1.6`);
    
    // 2. Head movements looking around slightly
    if (demoPartnerTime % 4 === 0) {
      const headGroup = document.querySelector('#avatar-head-group');
      if (headGroup) {
        const rx = (Math.random() - 0.5) * 10;
        const ry = (Math.random() - 0.5) * 15;
        headGroup.setAttribute('rotation', `${rx} ${ry} 0`);
      }
    }
    
    // 3. Trigger partner action
    if (demoPartnerTime - demoLastActionTime >= 10 + Math.random() * 5) {
      demoLastActionTime = demoPartnerTime;
      
      if (state.role === 'psychologist') {
        // Patient has no express emotion controls now, so the demo patient remains calm
      } else {
        const rand = Math.random();
        if (rand < 0.4) {
          const cards = [
            { symbol: "❤️", title: "KASIH SAYANG\n\n(Cinta, kehangatan, penerimaan diri)" },
            { symbol: "😰", title: "KECEMASAN\n\n(Kegelisahan, stres, ketakutan)" },
            { symbol: "🌊", title: "KEDAMAIAN\n\n(Ketenangan, mindfulness, relaksasi)" }
          ];
          const randCard = cards[Math.floor(Math.random() * cards.length)];
          showWhiteboardCard(randCard.symbol, randCard.title);
          
          if (randCard.symbol === "❤️") transitionMoodLight("#fda4af", 0.55);
          else if (randCard.symbol === "😰") transitionMoodLight("#312e81", 0.35);
          else if (randCard.symbol === "🌊") transitionMoodLight("#0891b2", 0.45);
        } else if (rand < 0.7) {
          updateWhiteboardText("Shared Board Bersih.\n\nPsikolog sedang meninjau sesi.");
          transitionMoodLight("#ffffff", 0.25);
        } else {
          if (state.breathingActive) {
            stopBreathingGuide();
          } else {
            startBreathingGuide();
          }
        }
      }
    }
  }, 1000);
}

function triggerDemoReaction(emoji, positionStr) {
  const scene = document.querySelector('a-scene');
  const tempText = document.createElement('a-text');
  
  tempText.setAttribute('value', emoji);
  tempText.setAttribute('align', 'center');
  tempText.setAttribute('position', positionStr);
  tempText.setAttribute('scale', '1.5 1.5 1.5');
  tempText.setAttribute('look-at-camera', '');
  tempText.setAttribute('floating-emoji', 'speed: 0.4; driftAmplitude: 0.12; driftSpeed: 2.2');
  
  scene.appendChild(tempText);
}

function stopDemoSimulation() {
  if (demoSimInterval) {
    clearInterval(demoSimInterval);
    demoSimInterval = null;
  }
}

// ==========================================================
// MICROPHONE ANALYZER (Lobby Mic Test)
// ==========================================================
let micStream = null;
let micAnalyser = null;
let micDataArray = null;
let micAnimationId = null;

async function startMicTest() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(micStream);
    
    micAnalyser = audioContext.createAnalyser();
    micAnalyser.fftSize = 32;
    source.connect(micAnalyser);
    
    const bufferLength = micAnalyser.frequencyBinCount;
    micDataArray = new Uint8Array(bufferLength);
    
    const statusText = document.querySelector('#mic-status');
    statusText.textContent = "Aktif (Terhubung)";
    statusText.classList.add('active');
    
    animateMicVisualizer();
  } catch (err) {
    console.warn("Microphone access denied or unavailable: ", err);
    document.querySelector('#mic-status').textContent = "Tidak Terdeteksi (Gunakan Mock)";
    document.querySelector('#mic-status').classList.remove('active');
    // Start fake mic visualizer for fallback demo
    animateMockMicVisualizer();
  }
}

function animateMicVisualizer() {
  if (!micAnalyser) return;
  
  micAnalyser.getByteFrequencyData(micDataArray);
  
  // Calculate average volume
  let sum = 0;
  for (let i = 0; i < micDataArray.length; i++) {
    sum += micDataArray[i];
  }
  const average = sum / micDataArray.length;
  const volumeScale = Math.min(100, (average / 128) * 100); // normalized 0 to 100
  
  const bars = document.querySelectorAll('.mic-bar');
  bars.forEach((bar, index) => {
    // Add some random variation per bar for dynamic look
    const barHeight = Math.max(20, volumeScale * (0.4 + Math.random() * 0.8));
    bar.style.height = `${barHeight}%`;
  });
  
  micAnimationId = requestAnimationFrame(animateMicVisualizer);
}

function animateMockMicVisualizer() {
  if (micStream) return; // real mic active
  
  const bars = document.querySelectorAll('.mic-bar');
  bars.forEach((bar) => {
    // Generate organic sine wave mock volume
    const time = Date.now() * 0.004;
    const baseHeight = 20 + Math.abs(Math.sin(time + Math.random())) * 45;
    bar.style.height = `${baseHeight}%`;
  });
  
  micAnimationId = requestAnimationFrame(animateMockMicVisualizer);
}

function stopMicTest() {
  if (micAnimationId) {
    cancelAnimationFrame(micAnimationId);
  }
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
}

// ==========================================================
// REGISTER A-FRAME COMPONENTS
// ==========================================================
// Make head follow user camera dynamically
AFRAME.registerComponent('look-at-camera', {
  init: function () {
    this.cameraEl = null;
    this.targetPos = new THREE.Vector3();
  },
  tick: function () {
    if (!this.el.object3D) return;
    if (!this.cameraEl) {
      this.cameraEl = document.querySelector('#user-camera');
    }
    if (!this.cameraEl || !this.cameraEl.object3D) return;
    this.cameraEl.object3D.getWorldPosition(this.targetPos);
    this.el.object3D.lookAt(this.targetPos);
  }
});

// Make panel follow user camera on Y axis only (prevents slanting/menceng)
AFRAME.registerComponent('look-at-camera-y', {
  init: function () {
    this.cameraEl = null;
    this.targetPos = new THREE.Vector3();
    this.entityPos = new THREE.Vector3();
  },
  tick: function () {
    if (!this.el.object3D) return;
    if (!this.cameraEl) {
      this.cameraEl = document.querySelector('#user-camera');
    }
    if (!this.cameraEl || !this.cameraEl.object3D) return;
    
    // Get camera world position
    this.cameraEl.object3D.getWorldPosition(this.targetPos);
    
    // Get entity world position
    this.el.object3D.getWorldPosition(this.entityPos);
    
    // Rotate around Y only by matching target Y with entity Y
    this.targetPos.y = this.entityPos.y;
    
    this.el.object3D.lookAt(this.targetPos);
  }
});

// A-Frame button hover/click feedback
AFRAME.registerComponent('interactive-button', {
  init: function () {
    const el = this.el;
    const origColor = el.getAttribute('color') || '#1e293b';

    el.addEventListener('mouseenter', () => {
      el.setAttribute('material', 'color', '#3b82f6');
      el.object3D.scale.set(1.05, 1.05, 1.05);
    });
    el.addEventListener('mouseleave', () => {
      el.setAttribute('material', 'color', origColor);
      el.object3D.scale.set(1, 1, 1);
    });
    el.addEventListener('mousedown', () => {
      el.object3D.scale.set(0.95, 0.95, 0.95);
      playClickSound();
    });
    el.addEventListener('mouseup', () => {
      el.object3D.scale.set(1.05, 1.05, 1.05);
    });
  }
});

// A-Frame component for floating particle drift reactions
AFRAME.registerComponent('floating-emoji', {
  schema: {
    speed: { type: 'number', default: 0.45 },
    driftAmplitude: { type: 'number', default: 0.15 },
    driftSpeed: { type: 'number', default: 2.5 }
  },
  init: function () {
    this.randomOffset = Math.random() * 100;
    this.initialPos = this.el.getAttribute('position');
    this.posY = this.initialPos.y;
    this.time = 0;
    
    const rotation = this.el.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
    rotation.z = (Math.random() - 0.5) * 20;
    this.el.setAttribute('rotation', rotation);
  },
  tick: function (t, dt) {
    if (!dt) return;
    const sec = dt / 1000;
    this.time += sec;
    
    this.posY += this.data.speed * sec;
    
    const driftX = Math.sin(this.time * this.data.driftSpeed + this.randomOffset) * this.data.driftAmplitude;
    const driftZ = Math.cos(this.time * this.data.driftSpeed + this.randomOffset * 1.5) * (this.data.driftAmplitude * 0.5);
    
    this.el.setAttribute('position', {
      x: this.initialPos.x + driftX,
      y: this.posY,
      z: this.initialPos.z + driftZ
    });
    
    const maxAge = 2.5;
    if (this.time >= maxAge) {
      if (this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }
    } else {
      const opacity = Math.max(0, 1 - (this.time / maxAge));
      this.el.setAttribute('opacity', opacity);
    }
  }
});

function playClickSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.06);
}

// ==========================================================
// LOBBY INTERFACE INITIALIZATION
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
  // Generate random Room Code
  generateRoomCode();
  
  // Set environment after scene is loaded (avoids silent fail)
  const scene = document.querySelector('a-scene');
  if (scene && scene.hasLoaded) {
    updateSceneEnvironment(state.environment);
  } else if (scene) {
    scene.addEventListener('loaded', () => {
      updateSceneEnvironment(state.environment);
    }, { once: true });
  }
  
  // Initialize microphone test
  startMicTest();
  
  // Role selection click events
  document.querySelector('#btn-role-therapist').addEventListener('click', (e) => {
    changeRole('psychologist');
  });
  
  document.querySelector('#btn-role-patient').addEventListener('click', (e) => {
    changeRole('patient');
  });
  
  // Copy Code button
  document.querySelector('#btn-copy-code').addEventListener('click', () => {
    navigator.clipboard.writeText(state.roomCode);
    const btn = document.querySelector('#btn-copy-code');
    btn.textContent = "✅";
    setTimeout(() => { btn.textContent = "📋"; }, 2000);
  });
  
  // Environment picker events
  document.querySelectorAll('.env-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (state.role !== 'psychologist') return; // restrict to psychologist
      
      const newEnv = btn.getAttribute('data-env');
      document.querySelectorAll('.env-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      state.environment = newEnv;
      updateSceneEnvironment(newEnv);
    });
  });
  
  // Avatar color dot events
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      const color = dot.getAttribute('data-color');
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      state.avatarColor = color;
      
      // Update partner avatar color dynamically (contrasting color)
      const partnerColor = partnerAvatarColors[color];
      document.querySelector('#avatar-body').setAttribute('color', partnerColor);
      document.querySelector('#avatar-hand-l').setAttribute('color', partnerColor);
      document.querySelector('#avatar-hand-r').setAttribute('color', partnerColor);
    });
  });
  
  // Enter VR Button
  document.querySelector('#btn-enter-vr').addEventListener('click', () => {
    const demoCheckbox = document.querySelector('#demo-mode-checkbox');
    state.demoMode = demoCheckbox ? demoCheckbox.checked : false;
    enterVRRoomFlow();
  });
  
  // Detect WebXR capability
  detectVRHeadset();
});

// Helper: Generate Random Room Code
function generateRoomCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const r1 = Array.from({length: 3}, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const r2 = Array.from({length: 3}, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  state.roomCode = `TRQ-${Math.floor(100 + Math.random() * 900)}-${r1}`;
  document.querySelector('#room-code-val').textContent = state.roomCode;
}

// Helper: Change Role (Psychologist / Patient)
function changeRole(newRole) {
  state.role = newRole;
  
  const btnTherapist = document.querySelector('#btn-role-therapist');
  const btnPatient = document.querySelector('#btn-role-patient');
  const setupTherapist = document.querySelector('#session-setup-therapist');
  const setupPatient = document.querySelector('#session-setup-patient');
  const envPickerOverlay = document.querySelector('#env-picker-restrict-msg');
  const envBtns = document.querySelectorAll('.env-btn');
  const nameInput = document.querySelector('#username-input');
  
  if (newRole === 'psychologist') {
    btnTherapist.classList.add('active');
    btnPatient.classList.remove('active');
    setupTherapist.classList.add('active');
    setupPatient.classList.remove('active');
    envPickerOverlay.style.display = 'none';
    envBtns.forEach(btn => btn.classList.remove('disabled'));
    nameInput.value = "dr. Elz, Psikolog";
  } else {
    btnTherapist.classList.remove('active');
    btnPatient.classList.add('active');
    setupTherapist.classList.remove('active');
    setupPatient.classList.add('active');
    envPickerOverlay.style.display = 'block';
    envBtns.forEach(btn => {
      btn.classList.add('disabled');
      // Reset environment to beach as fallback default for patient
      if (btn.getAttribute('data-env') === 'beach') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    state.environment = 'beach';
    updateSceneEnvironment('beach');
    nameInput.value = "Pasien Tenang";
  }
}

// Helper: Update A-Frame environment component preset
function updateSceneEnvironment(envKey) {
  const p = envPresets[envKey];
  if (!p) return;
  const envEl = document.querySelector('#scene-environment');
  if (envEl) {
    let configStr = `preset: ${p.preset}; seed: ${p.seed}; playArea: 1.2; ground: flat; active: true`;
    if (p.extra) {
      configStr += p.extra;
    }
    envEl.setAttribute('environment', configStr);
  }
}

// Helper: Detect if VR headset connected
function detectVRHeadset() {
  if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
      if (supported) {
        document.querySelector('#vr-status').textContent = "Terdeteksi (VR Siap)";
        document.querySelector('#vr-status').classList.add('active');
      }
    });
  }
}

// ==========================================================
// TRANSITION FLOW & VR STATE HANDLERS
// ==========================================================
function enterVRRoomFlow() {
  // Validate inputs
  const username = document.querySelector('#username-input').value.trim();
  state.username = username || (state.role === 'psychologist' ? 'Psikolog' : 'Pasien');
  
  if (state.role === 'patient') {
    const codeInput = document.querySelector('#room-code-input').value.trim();
    if (!codeInput) {
      alert("Silakan masukkan kode sesi terlebih dahulu untuk bergabung!");
      return;
    }
    state.roomCode = codeInput.toUpperCase();
  }
  
  // Stop mic testing (releases mic device to prevent feedback/leak)
  stopMicTest();
  
  // Show screen fade overlay
  const overlay = document.querySelector('#transition-overlay');
  const msgEl = document.querySelector('#transition-message');
  msgEl.textContent = `Menghubungkan ke Ruang Terapi (${state.roomCode})...`;
  overlay.classList.add('active');

  // Helper: actually do the transition into VR
  function doEnterVR() {
    // Wrap in try-catch so overlay is ALWAYS removed even if setup errors
    try {
      setupVRRoomEntities();
    } catch (err) {
      console.error('[TranquilVR] Error setting up VR room:', err);
    }

    // Hide Lobby, show VR scene
    document.querySelector('#lobby-container').classList.add('lobby-hidden');
    overlay.classList.remove('active');

    // Unhide A-Frame VR button
    const vrBtn = document.querySelector('.a-enter-vr');
    if (vrBtn) {
      vrBtn.style.setProperty('display', 'block', 'important');
    }

    // Activate Web Audio context (must be after user gesture)
    initAudio();

    // Start session stopwatch
    startSessionTimer();
    state.isInVR = true;

    // Start demo simulation if enabled
    if (state.demoMode) {
      startDemoSimulation();
    }
  }

  // Wait for A-Frame scene to be fully loaded before entering
  const scene = document.querySelector('a-scene');
  if (scene && scene.hasLoaded) {
    // Scene already loaded — just delay for loading UX
    setTimeout(doEnterVR, 1800);
  } else if (scene) {
    // Scene not yet loaded — wait for it, then enter
    msgEl.textContent = 'Memuat Dunia Virtual...';
    scene.addEventListener('loaded', () => {
      setTimeout(doEnterVR, 500);
    }, { once: true });
  } else {
    // Fallback: no scene found
    console.error('[TranquilVR] A-Frame scene not found!');
    setTimeout(doEnterVR, 1800);
  }
}

function setupVRRoomEntities() {
  const cameraRig = document.querySelector('#camera-rig');
  const partnerAvatar = document.querySelector('#partner-avatar');
  const therapistPanel = document.querySelector('#therapist-control-panel');
  const patientPanel = document.querySelector('#patient-expression-panel');
  const settingsPanel = document.querySelector('#universal-settings-panel');
  const whiteboard = document.querySelector('#shared-board');
  
  // Set room code text in settings panel
  document.querySelector('#vr-room-info-text').setAttribute('text', `value: Room: ${state.roomCode}; align: center; color: #94a3b8; width: 1.1; font: kelsonsans;`);
  
  // Register look-at-camera script to partner's head group
  document.querySelector('#avatar-head-group').setAttribute('look-at-camera', '');
  
  // Setup positions based on role
  if (state.role === 'psychologist') {
    // Camera: sitting at Y=1.2 Z=2 facing -Z (toward partner at Z=-2.2)
    cameraRig.setAttribute('position', '0 1.2 2');
    cameraRig.setAttribute('rotation', '0 0 0');
    partnerAvatar.setAttribute('position', '0 0.5 -2.2');
    partnerAvatar.setAttribute('rotation', '0 0 0');

    // Therapist panel: right of user seat, closer & angled dynamically via look-at-camera-y
    therapistPanel.setAttribute('position', '1.2 1.1 0.8');
    therapistPanel.setAttribute('visible', 'true');

    // Hide Patient reaction panel
    patientPanel.setAttribute('visible', 'false');

    // Settings panel: left of user seat, closer & angled dynamically
    settingsPanel.setAttribute('position', '-1.2 1.1 0.8');

    updateWhiteboardText("SILAKAN MULAI SESI\n\nGunakan kontrol di kanan Anda untuk memutar musik ambient atau menampilkan kartu terapi.");

  } else {
    // Patient sits facing psychologist (camera at Z=-2.2, looking toward +Z)
    cameraRig.setAttribute('position', '0 1.2 -2.2');
    cameraRig.setAttribute('rotation', '0 180 0');

    // Partner avatar (psychologist) at opposite side
    partnerAvatar.setAttribute('position', '0 0.5 2.2');
    partnerAvatar.setAttribute('rotation', '0 180 0');

    // Hide Therapist panel
    therapistPanel.setAttribute('visible', 'false');

    // Hide Patient reaction panel temporarily (simplifying/debugging)
    patientPanel.setAttribute('visible', 'false');

    // Settings panel: beside patient seat on their left (patient faces +Z from Z=-2.2)
    // World +X is patient's left since they're rotated 180deg
    settingsPanel.setAttribute('position', '1.4 1.1 -2.2');

    updateWhiteboardText("SESI TERAPI DIMULAI\n\nPsikolog Anda sedang menyiapkan materi. Silakan rileks dan nikmati sesi terapi.");
  }
  
  // Attach interactive button attributes to all 3D buttons
  document.querySelectorAll('.spatial-btn').forEach(btn => {
    btn.setAttribute('interactive-button', '');
    btn.classList.add('clickable');
  });
  
  // Init in-VR event listeners
  setupVRButtonEvents();
}

function startSessionTimer() {
  state.sessionStartTime = Date.now();
  if (state.timerInterval) clearInterval(state.timerInterval);
  
  state.timerInterval = setInterval(() => {
    const elapsed = Date.now() - state.sessionStartTime;
    const totalSecs = Math.floor(elapsed / 1000);
    const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    
    const timerText = document.querySelector('#vr-timer-text');
    if (timerText) {
      timerText.setAttribute('text', `value: Durasi: ${mins}:${secs}; align: center; color: #ffffff; width: 1.4; font: kelsonsans; fontStyle: bold;`);
    }
  }, 1000);
}

// Helper: Set text on the whiteboard
function updateWhiteboardText(msg) {
  const boardText = document.querySelector('#board-text-body');
  const cardImg = document.querySelector('#board-card-image');
  
  if (boardText && cardImg) {
    boardText.setAttribute('visible', 'true');
    cardImg.setAttribute('visible', 'false');
    boardText.setAttribute('text', `value: ${msg}; align: center; color: #1e293b; width: 1.5; font: kelsonsans; wrapCount: 22;`);
  }
}

// Helper: Show Emotion Card on Whiteboard
function showWhiteboardCard(symbol, title) {
  const boardText = document.querySelector('#board-text-body');
  const cardImg = document.querySelector('#board-card-image');
  const cardSymbol = document.querySelector('#board-card-symbol');
  const cardTitle = document.querySelector('#board-card-title');
  
  if (boardText && cardImg) {
    boardText.setAttribute('visible', 'false');
    cardImg.setAttribute('visible', 'true');
    
    cardSymbol.setAttribute('value', symbol);
    cardTitle.setAttribute('value', title);
    
    // Animate board card slightly
    cardImg.setAttribute('scale', '0.1 0.1 0.1');
    cardImg.setAttribute('animation', 'property: scale; to: 1 1 1; dur: 500; easing: easeOutBack');
  }
}

// ==========================================================
// IN-VR SPATIAL INTERACTION HANDLERS
// ==========================================================
let vrEventsBound = false;
function setupVRButtonEvents() {
  if (vrEventsBound) return;
  vrEventsBound = true;

  // --- Helper: Highlight active BGM button ---
  const bgmBtns = {
    ocean: document.querySelector('#btn-sound-ocean'),
    rain:  document.querySelector('#btn-sound-rain'),
    forest: document.querySelector('#btn-sound-forest')
  };
  function setActiveBgmBtn(key) {
    Object.entries(bgmBtns).forEach(([k, el]) => {
      if (!el) return;
      el.setAttribute('color', k === key ? '#14b8a6' : '#1e293b');
    });
  }

  // --- Helper: Highlight active Card button ---
  const cardBtns = {
    love:  document.querySelector('#btn-card-love'),
    worry: document.querySelector('#btn-card-worry'),
    calm:  document.querySelector('#btn-card-calm')
  };
  function setActiveCardBtn(key) {
    Object.entries(cardBtns).forEach(([k, el]) => {
      if (!el) return;
      el.setAttribute('color', k === key ? '#6366f1' : '#1e293b');
    });
  }

  // --- Ambient Music ---
  document.querySelector('#btn-sound-ocean').addEventListener('click', () => {
    if (state.activeBgm === 'ocean') {
      stopAmbient(1.5);
      state.activeBgm = null;
      updateBgmTextInVR("OFF");
      setActiveBgmBtn(null);
    } else {
      playAmbientOcean();
      state.activeBgm = 'ocean';
      setActiveBgmBtn('ocean');
    }
  });

  document.querySelector('#btn-sound-rain').addEventListener('click', () => {
    if (state.activeBgm === 'rain') {
      stopAmbient(1.5);
      state.activeBgm = null;
      updateBgmTextInVR("OFF");
      setActiveBgmBtn(null);
    } else {
      playAmbientRain();
      state.activeBgm = 'rain';
      setActiveBgmBtn('rain');
    }
  });

  document.querySelector('#btn-sound-forest').addEventListener('click', () => {
    if (state.activeBgm === 'forest') {
      stopAmbient(1.5);
      state.activeBgm = null;
      updateBgmTextInVR("OFF");
      setActiveBgmBtn(null);
    } else {
      playAmbientForest();
      state.activeBgm = 'forest';
      setActiveBgmBtn('forest');
    }
  });

  // --- Shared Emotion Cards (Therapist Panel) ---
  document.querySelector('#btn-card-love').addEventListener('click', () => {
    showWhiteboardCard("❤️", "KASIH SAYANG\n\n(Cinta, kehangatan, penerimaan diri)");
    setActiveCardBtn('love');
    transitionMoodLight("#fda4af", 0.55);
  });

  document.querySelector('#btn-card-worry').addEventListener('click', () => {
    showWhiteboardCard("😰", "KECEMASAN\n\n(Kegelisahan, stres, ketakutan)");
    setActiveCardBtn('worry');
    transitionMoodLight("#312e81", 0.35);
  });

  document.querySelector('#btn-card-calm').addEventListener('click', () => {
    showWhiteboardCard("🌊", "KEDAMAIAN\n\n(Ketenangan, mindfulness, relaksasi)");
    setActiveCardBtn('calm');
    transitionMoodLight("#0891b2", 0.45);
  });

  document.querySelector('#btn-card-clear').addEventListener('click', () => {
    updateWhiteboardText("Shared Board Bersih.\n\nPsikolog dapat membagikan kartu emosi lain.");
    setActiveCardBtn(null);
    transitionMoodLight("#ffffff", 0.25);
  });

  // --- Breathing Guide ---
  const breathingBtn = document.querySelector('#btn-breathing-toggle');
  const breathingText = document.querySelector('#txt-breathing-toggle');
  
  if (breathingBtn && breathingText) {
    breathingBtn.addEventListener('click', () => {
      if (state.breathingActive) {
        stopBreathingGuide();
        breathingBtn.setAttribute('color', '#1e293b');
        breathingText.setAttribute('text', 'value: Breathing Guide: OFF; align: center; color: #ffffff; width: 0.85; font: kelsonsans;');
      } else {
        startBreathingGuide();
        breathingBtn.setAttribute('color', '#14b8a6');
        breathingText.setAttribute('text', 'value: Breathing Guide: ON; align: center; color: #ffffff; width: 0.85; font: kelsonsans; fontStyle: bold;');
      }
    });
  }

  // --- Emoji Reactions (Patient Panel) ---
  const spawnReaction = (emoji) => {
    const scene = document.querySelector('a-scene');
    const tempText = document.createElement('a-text');
    const spawnPos = "0 0.8 -2.2";
    
    tempText.setAttribute('value', emoji);
    tempText.setAttribute('align', 'center');
    tempText.setAttribute('position', spawnPos);
    tempText.setAttribute('scale', '1.5 1.5 1.5');
    tempText.setAttribute('look-at-camera', '');
    tempText.setAttribute('floating-emoji', 'speed: 0.45; driftAmplitude: 0.15; driftSpeed: 2.5');
    
    scene.appendChild(tempText);
  };

  const btnEmojiHappy = document.querySelector('#btn-emoji-happy');
  const btnEmojiAnxious = document.querySelector('#btn-emoji-anxious');
  const btnEmojiSad = document.querySelector('#btn-emoji-sad');
  const btnEmojiCalm = document.querySelector('#btn-emoji-calm');

  if (btnEmojiHappy) btnEmojiHappy.addEventListener('click', () => spawnReaction("😊"));
  if (btnEmojiAnxious) btnEmojiAnxious.addEventListener('click', () => spawnReaction("😰"));
  if (btnEmojiSad) btnEmojiSad.addEventListener('click', () => spawnReaction("😢"));
  if (btnEmojiCalm) btnEmojiCalm.addEventListener('click', () => spawnReaction("😌"));

  // --- Session Control (Mute & Exit) ---
  const muteBtn = document.querySelector('#btn-vr-mute');
  const muteText = document.querySelector('#vr-mute-text');
  
  if (muteBtn && muteText) {
    muteBtn.addEventListener('click', () => {
      state.micMuted = !state.micMuted;
      if (state.micMuted) {
        muteBtn.setAttribute('color', '#ef4444');
        muteText.setAttribute('text', 'value: Unmute Mic; align: center; color: #ffffff; width: 1.1; font: outfit;');
      } else {
        muteBtn.setAttribute('color', '#1e293b');
        muteText.setAttribute('text', 'value: Mute Mic; align: center; color: #ffffff; width: 1.1; font: outfit;');
      }
    });
  }

  document.querySelector('#btn-vr-exit').addEventListener('click', () => {
    exitVRRoomFlow();
  });
}

function exitVRRoomFlow() {
  stopAmbient(1.0);
  stopBreathingGuide();
  stopDemoSimulation();
  
  // Reset mood light to default
  transitionMoodLight("#ffffff", 0.25);
  
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  
  // Show screen fade overlay
  const overlay = document.querySelector('#transition-overlay');
  const msgEl = document.querySelector('#transition-message');
  msgEl.textContent = "Keluar dari Ruang Terapi...";
  overlay.classList.add('active');
  
  // Reset state
  state.isInVR = false;
  state.activeBgm = null;
  state.activeCard = null;
  
  setTimeout(() => {
    // Hide VR Enter button
    const vrBtn = document.querySelector('.a-enter-vr');
    if (vrBtn) vrBtn.style.display = 'none';
    
    // Show Lobby UI
    document.querySelector('#lobby-container').classList.remove('lobby-hidden');
    overlay.classList.remove('active');
    
    // Restart mic testing
    startMicTest();
  }, 1500);
}

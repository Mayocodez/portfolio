// --- 1. Web Audio API Sound Effects (Controlled by Misc. -> Sound Effects) ---
let soundEnabled = true;
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playClickSound(freq = 620) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new AudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.045);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.045);
  } catch (e) {}
}

// Play subtle tick when hovering nav or scroll items
document.querySelectorAll('.nav-item, .scroll-item, .dropdown-row').forEach(el => {
  el.addEventListener('mouseenter', () => playClickSound(520));
});

// --- 2. Misc. Dropdown Toggle Switches ---
function toggleFeature(element, feature) {
  element.classList.toggle('off');
  const isOff = element.classList.contains('off');
  element.previousElementSibling.textContent = isOff ? 'Off' : 'On';
  playClickSound(isOff ? 380 : 740);

  if (feature === 'hover') {
    document.body.classList.toggle('hover-open-enabled', !isOff);
  } else if (feature === 'sound') {
    soundEnabled = !isOff;
  }
}

// Handle clicking Socials/Misc when "Open on Hover" is turned Off
function handleDropdownClick(event, wrapperId) {
  if (!document.body.classList.contains('hover-open-enabled')) {
    event.preventDefault();
    const wrapper = document.getElementById(wrapperId);
    wrapper.classList.toggle('open');
  }
}

// --- 3. Scroll-Spy & Smooth Section Navigation for the 17 Left Bars ---
const sections = document.querySelectorAll('.scroll-target');
const scrollLines = document.querySelectorAll('#scroll-indicator .scroll-line');

function scrollToSection(index) {
  playClickSound(680);
  if (sections[index]) {
    sections[index].scrollIntoView({ behavior: 'smooth' });
  }
}

window.addEventListener('scroll', () => {
  let currentIndex = 0;
  const triggerPoint = window.scrollY + window.innerHeight * 0.35;

  sections.forEach((sec, idx) => {
    if (sec.offsetTop <= triggerPoint) {
      currentIndex = idx;
    }
  });

  scrollLines.forEach((line, idx) => {
    line.classList.toggle('active', idx === currentIndex);
  });
});

// --- 4. Keyboard Shortcuts (h, b, r, s, m, g) ---
window.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  const key = e.key.toLowerCase();
  const targetNav = document.querySelector(`.nav-item[data-key="${key}"]`);
  if (targetNav) {
    playClickSound(700);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    targetNav.classList.add('active');

    if (key === 's') {
      document.getElementById('socials-dropdown').classList.toggle('open');
      document.getElementById('misc-dropdown').classList.remove('open');
    } else if (key === 'm') {
      document.getElementById('misc-dropdown').classList.toggle('open');
      document.getElementById('socials-dropdown').classList.remove('open');
    } else {
      targetNav.click();
    }
  }
});

// --- 5. Copy Email, Receipt Printer, & Radio Controls ---
function copyEmail() {
  navigator.clipboard.writeText('piyushsinghdhanwal@gmail.com');
  const label = document.getElementById('email-text');
  if (label) {
    label.textContent = 'Copied!';
    setTimeout(() => { label.textContent = 'Email'; }, 1500);
  }
  playClickSound(820);
}



let radioPlaying = false;
function toggleRadio() {
  radioPlaying = !radioPlaying;
  document.getElementById('radio-label').textContent = radioPlaying ? 'Radio ❚❚' : 'Radio ▶';
  playClickSound(radioPlaying ? 760 : 440);
}

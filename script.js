/* OpenStretch — production-ready player
   - External .jpg images for each exercise (picsum.photos used as guaranteed JPGs).
   - If an external image fails to load, an inline SVG data URL is used as fallback.
   - Full controls: Start/Stop (toggle), Prev/Next, +/- duration, speed selector, progress bar.
   - Robust pause/resume: computes elapsed and remaining correctly with speed applied.
   - No broken <img> issues; all <img> have alt attributes.
*/

// --------------------- Data: sections & exercises ---------------------
const SECTIONS = {
  posture: {
    title: "Posture Power Session",
    desc: "A series of squats and lunge holds designed to strengthen posture muscles.",
    exercises: [
      { name: "Squat Hold", duration: 30, variant: "squat", color: "#ff6b6b", img: "https://picsum.photos/id/1015/1200/800.jpg" },
      { name: "Split Lunge Hold", duration: 60, variant: "lunge", color: "#ff914d", img: "https://picsum.photos/id/1027/1200/800.jpg" },
      { name: "Side Lunge Hold", duration: 60, variant: "sidelunge", color: "#ffd24d", img: "https://picsum.photos/id/1035/1200/800.jpg" },
      { name: "Wall Sit", duration: 30, variant: "wallsit", color: "#ff6b6b", img: "https://picsum.photos/id/1025/1200/800.jpg" }
    ]
  },

  neck: {
    title: "Neck Mobility",
    desc: "Gentle to advanced neck holds and controlled rotations.",
    exercises: [
      { name: "Chin Tuck Hold", duration: 20, variant: "neck1", color: "#ffb86b", img: "https://picsum.photos/id/1062/1200/800.jpg" },
      { name: "Lateral Stretch", duration: 30, variant: "neck2", color: "#ffcc6b", img: "https://picsum.photos/id/1069/1200/800.jpg" }
    ]
  },

  pelvic: {
    title: "Pelvic Flow",
    desc: "Hip openers and pelvic stability holds.",
    exercises: [
      { name: "Hip Flexor Hold", duration: 40, variant: "hip", color: "#ff7b6b", img: "https://picsum.photos/id/1043/1200/800.jpg" },
      { name: "Bridge Hold", duration: 30, variant: "bridge", color: "#ffd24d", img: "https://picsum.photos/id/1041/1200/800.jpg" }
    ]
  },

  back: {
    title: "Lower & Upper Back",
    desc: "Mobility and anti-stress holds for the spine.",
    exercises: [
      { name: "Child's Pose", duration: 45, variant: "child", color: "#ffd24d", img: "https://picsum.photos/id/1059/1200/800.jpg" },
      { name: "Cat-Cow", duration: 40, variant: "catcow", color: "#ff914d", img: "https://picsum.photos/id/1057/1200/800.jpg" }
    ]
  },

  feet: {
    title: "Feet & Ankles",
    desc: "Improve balance and ankle mobility.",
    exercises: [
      { name: "Toe Raises", duration: 30, variant: "toe", color: "#ffd24d", img: "https://picsum.photos/id/1060/1200/800.jpg" },
      { name: "Single-leg Balance", duration: 40, variant: "balance", color: "#ff6b6b", img: "https://picsum.photos/id/1068/1200/800.jpg" }
    ]
  },

  shoulders: {
    title: "Shoulder Flow",
    desc: "Open & strengthen the shoulder girdle.",
    exercises: [
      { name: "Wall Slide", duration: 30, variant: "wallslide", color: "#ff6b6b", img: "https://picsum.photos/id/1076/1200/800.jpg" },
      { name: "Band Pullapart", duration: 30, variant: "band", color: "#ff914d", img: "https://picsum.photos/id/1080/1200/800.jpg" }
    ]
  },

  hamstrings: {
    title: "Hamstrings",
    desc: "Lengthening and controlled holds.",
    exercises: [
      { name: "Forward Fold", duration: 45, variant: "fold", color: "#ffd24d", img: "https://picsum.photos/id/1084/1200/800.jpg" },
      { name: "Standing Hamstring", duration: 40, variant: "standham", color: "#ff6b6b", img: "https://picsum.photos/id/1082/1200/800.jpg" }
    ]
  },

  jump: {
    title: "Massia Jump",
    desc: "Explosive + mobility combo.",
    exercises: [
      { name: "Counter Jump", duration: 30, variant: "jump1", color: "#ff6b6b", img: "https://picsum.photos/id/1081/1200/800.jpg" },
      { name: "Landing Hold", duration: 30, variant: "jump2", color: "#ffd24d", img: "https://picsum.photos/id/1019/1200/800.jpg" }
    ]
  }
};

// --------------------- App state ---------------------
let currentSectionId = null;
let currentSection = null; // cloned section
let currentIndex = 0;
let playing = false;
let remaining = 0;
let baseRemaining = 0;
let intervalId = null;
let playbackSpeed = 1;

// --------------------- DOM refs ---------------------
const el = id => document.getElementById(id);
const startBtn = el("start-btn");
const prevBtn = el("prev-btn");
const nextBtn = el("next-btn");
const exerciseName = el("exercise-name");
const exerciseDesc = el("exercise-desc");
const exerciseImage = el("exercise-image");
const timeLeftEl = el("time-left");
const progressInner = el("progress-inner");
const durationDisplay = el("duration-display");
const decBtn = el("dec-btn");
const incBtn = el("inc-btn");
const metaEl = el("meta");
const speedSelect = el("speed");

// --------------------- Initialization ---------------------
document.addEventListener("DOMContentLoaded", () => {
  // set year
  const year = el("year");
  if (year) year.textContent = new Date().getFullYear();

  // Set placeholder visual so no broken icon appears before first load
  exerciseImage.src = makeExerciseSVG("OpenStretch", "#333", "placeholder");
  exerciseImage.alt = "OpenStretch visual";

  // Hook up section buttons (ensure DOM buttons match keys above)
  document.querySelectorAll(".section-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.section;
      if (!id || !SECTIONS[id]) {
        console.warn("Unknown section:", id);
        return;
      }
      loadSection(id);
      // on mobile jump to player
      setTimeout(()=> { try { location.hash = "#player"; } catch(e){} }, 80);
    });
  });

  // Controls
  startBtn.addEventListener("click", togglePlay);
  prevBtn.addEventListener("click", prevExercise);
  nextBtn.addEventListener("click", nextExercise);
  decBtn.addEventListener("click", () => adjustDuration(-5));
  incBtn.addEventListener("click", () => adjustDuration(5));
  speedSelect.addEventListener("change", () => { playbackSpeed = parseFloat(speedSelect.value) || 1; });

  // image fallback: if external JPG fails we replace with inline SVG
  exerciseImage.addEventListener("error", () => {
    // use current exercise name to generate fallback
    const name = (currentSection && currentSection.exercises[currentIndex] && currentSection.exercises[currentIndex].name) || "OpenStretch";
    const color = (currentSection && currentSection.exercises[currentIndex] && currentSection.exercises[currentIndex].color) || "#ff6b6b";
    exerciseImage.src = makeExerciseSVG(name, color, "fallback");
  });

  // menu toggle (for small screens)
  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("main-nav");
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded")==="true";
      menuToggle.setAttribute("aria-expanded", String(!open));
      mainNav.setAttribute("aria-hidden", String(open));
      mainNav.style.display = open ? "none" : "block";
    });
  }
});

// --------------------- Core functions ---------------------
function loadSection(id) {
  currentSectionId = id;
  currentSection = JSON.parse(JSON.stringify(SECTIONS[id])); // clone to allow edits
  currentIndex = 0;
  playing = false;
  clearIntervalSafe();

  // header
  el("player-title").textContent = currentSection.title || "Session";
  if (exerciseDesc) exerciseDesc.textContent = currentSection.desc || "";

  loadExercise(currentIndex);
  updateMeta();
  startBtn.textContent = "Start";
  startBtn.setAttribute("aria-pressed","false");
}

function loadExercise(idx) {
  if (!currentSection) return;
  const ex = currentSection.exercises[idx];
  if (!ex) return;

  exerciseName.textContent = ex.name;
  durationDisplay.textContent = formatSeconds(ex.duration);
  remaining = ex.duration;
  baseRemaining = ex.duration;
  timeLeftEl.textContent = formatSeconds(remaining);
  progressInner.style.width = "0%";

  // set external JPG: this is a .jpg URL
  // picsum.photos returns JPG when path ends with .jpg
  exerciseImage.alt = ex.name + " visual";
  exerciseImage.src = ex.img;

  prevBtn.disabled = idx === 0;
  nextBtn.disabled = idx >= currentSection.exercises.length - 1;
  updateMeta();
}

// Toggle play/pause (Start <-> Stop)
function togglePlay() {
  if (!currentSection) { alert("Please choose a section first."); return; }
  if (!playing) startWorkout();
  else stopWorkout();
}

function startWorkout() {
  if (!currentSection) return;
  playing = true;
  startBtn.textContent = "Stop";
  startBtn.setAttribute("aria-pressed","true");

  const ex = currentSection.exercises[currentIndex];
  if (!ex) return;

  // handle resume vs fresh start
  const total = ex.duration;
  const startRemaining = remaining; // may be full or resumed
  const startTime = Date.now();

  clearIntervalSafe();
  intervalId = setInterval(() => {
    const elapsed = ((Date.now() - startTime) / 1000) * playbackSpeed;
    remaining = Math.max(0, Math.round(startRemaining - elapsed));
    timeLeftEl.textContent = formatSeconds(remaining);

    const filled = total === 0 ? 100 : ((total - remaining) / total) * 100;
    progressInner.style.width = `${filled}%`;

    if (remaining <= 0) {
      clearIntervalSafe();
      playing = false;
      startBtn.textContent = "Start";
      startBtn.setAttribute("aria-pressed","false");
      try { navigator.vibrate && navigator.vibrate(150); } catch (e) {}
      // advance to next exercise after a short pause
      setTimeout(() => {
        if (currentIndex < currentSection.exercises.length - 1) {
          currentIndex++;
          loadExercise(currentIndex);
          startWorkout(); // auto-start next
        } else {
          // session complete
          exerciseName.textContent = "Session Complete!";
          exerciseImage.hidden = true;
          timeLeftEl.textContent = "✔";
          progressInner.style.width = "100%";
        }
        updateMeta();
      }, 450);
    }
  }, 200);
}

function stopWorkout() {
  playing = false;
  clearIntervalSafe();
  startBtn.textContent = "Start";
  startBtn.setAttribute("aria-pressed","false");
}

function prevExercise() {
  if (!currentSection) return;
  if (currentIndex > 0) {
    currentIndex--;
    stopWorkout();
    loadExercise(currentIndex);
  }
}

function nextExercise() {
  if (!currentSection) return;
  if (currentIndex < currentSection.exercises.length - 1) {
    currentIndex++;
    stopWorkout();
    loadExercise(currentIndex);
  }
}

function adjustDuration(delta) {
  if (!currentSection) return;
  const ex = currentSection.exercises[currentIndex];
  ex.duration = Math.max(5, ex.duration + delta);
  remaining = ex.duration;
  baseRemaining = ex.duration;
  durationDisplay.textContent = formatSeconds(ex.duration);
  timeLeftEl.textContent = formatSeconds(remaining);
}

// --------------------- UI helpers ---------------------
function updateMeta() {
  if (!currentSection) return;
  metaEl.textContent = `${currentIndex + 1} / ${currentSection.exercises.length} exercises`;
}

function clearIntervalSafe() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}

function formatSeconds(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// --------------------- SVG Fallback generator ---------------------
function makeExerciseSVG(title, color = "#ff6b6b", variant = "pose") {
  const safe = String(title || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let shape = "";
  switch (variant) {
    case "lunge":
    case "sidelunge":
      shape = `<g transform="translate(48,30)">
        <circle cx="36" cy="26" r="14" fill="${color}" opacity="0.18"/>
        <path d="M12 54 q30 -40 56 0" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.9"/>
      </g>`; break;
    case "neck1":
    case "neck2":
      shape = `<g transform="translate(66,36)">
        <circle cx="32" cy="22" r="12" fill="${color}" opacity="0.16"/>
        <path d="M14 44 q18 -12 36 0" stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.9"/>
      </g>`; break;
    case "hip":
    case "bridge":
      shape = `<g transform="translate(40,40)">
        <ellipse cx="64" cy="74" rx="52" ry="12" fill="${color}" opacity="0.08"/>
        <path d="M16 60 q48 -40 96 0" stroke="${color}" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.9"/>
      </g>`; break;
    case "child":
    case "catcow":
      shape = `<g transform="translate(44,40)">
        <rect x="6" y="46" rx="10" ry="10" width="84" height="22" fill="${color}" opacity="0.08"/>
        <circle cx="32" cy="30" r="12" fill="${color}" opacity="0.15"/>
      </g>`; break;
    case "pose":
    case "squat":
    case "jump1":
    default:
      shape = `<g transform="translate(60,40)">
        <circle cx="40" cy="28" r="18" fill="${color}" opacity="0.15"/>
        <path d="M18 72 q40 -60 80 0" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.9"/>
      </g>`;
  }

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='720' height='480' viewBox='0 0 720 480'>
    <rect width='100%' height='100%' fill='#070707'/>
    <rect x='28' y='28' rx='22' width='664' height='424' fill='#0d0d0d' stroke='rgba(255,255,255,0.02)'/>
    ${shape}
    <text x='360' y='420' font-size='28' text-anchor='middle' fill='${color}' font-family='system-ui, Arial'>${safe}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Ensure cleanup on page unload
window.addEventListener('beforeunload', clearIntervalSafe);
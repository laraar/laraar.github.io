/** @format */

// ─── DOM References ───────────────────────────────────────────────────────────
// Grab all the elements we'll need to interact with throughout the game.
const grid = document.getElementById("keyGrid"); // The 4x4 key grid container
const soundToggle = document.getElementById("soundToggle"); // Sound on/off checkbox
const advancedToggle = document.getElementById("advancedToggle"); // Stroop mode checkbox
const infoDisplay = document.getElementById("infoDisplay"); // Glyph info box in footer
const clockDisplay = document.getElementById("clockDisplay"); // Elapsed time display
const bestDisplay = document.getElementById("bestDisplay"); // Best time display
const restartButton = document.getElementById("restartButton"); // Restart pseudo-button
const pauseButton = document.getElementById("pauseButton"); // Pause/resume button

// ─── Web Audio API Setup ───────────────────────────────────────────────────────
// Two distinct concerns that must be kept separate:
//
//  1. Fetching + decoding the audio buffer — does NOT require a user gesture.
//     We do this immediately at page load so the buffer is ready before the
//     first keypress. (Browsers allow fetch and decodeAudioData without a gesture;
//     only *playing* requires one.)
//
//  2. Creating + resuming the AudioContext — DOES require a user gesture in Safari.
//     Safari suspends any AudioContext not created inside a gesture handler, so we
//     create it lazily on the first mousedown/touchstart.
//
// Result: by the time the user presses the first key, the buffer is already decoded.
// The gesture on that first press creates/resumes the context, and playKeySound()
// fires immediately — no first-press silence.

let audioCtx = null;         // Created on first user gesture
let keyBuffer = null;        // Decoded PCM buffer — populated at page load
let audioCtxReady = false;   // True once context exists and is running

// Called at page load (no gesture needed): fetch and decode the MP3 into a
// raw PCM AudioBuffer. We use a temporary offline context for the decode step
// because AudioContext itself needs a gesture on Safari — OfflineAudioContext
// and decodeAudioData on a temporary context work fine without one.
(async function preloadAudioBuffer() {
  try {
    const response = await fetch("audio/keyclick.mp3");
    const arrayBuffer = await response.arrayBuffer();
    // OfflineAudioContext can be created without a gesture and is only used here
    // for decoding; it is discarded immediately after.
    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 1, 44100);
    keyBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.warn("Audio preload failed:", err);
  }
})();

// Called synchronously inside the first mousedown/touchstart gesture handler.
// Creates the real AudioContext (synchronous) and marks it ready immediately —
// a freshly-constructed AudioContext inside a gesture handler is usable right away
// even before resume() resolves. We then fire-and-forget resume() to satisfy
// Safari's policy, but audioCtxReady is already true so playKeySound() works on
// this very first press. Subsequent calls are no-ops (guarded by audioCtx check).
function unlockAudioContext() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Mark ready immediately — the context is usable now even if state is
    // technically "suspended" before resume() resolves its promise.
    audioCtxReady = true;
    // Fire-and-forget: resume() is required for Safari's autoplay policy but
    // we don't need to await it before playing — the first source.start(0)
    // will queue correctly once the context ticks.
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch((err) => console.warn("AudioContext resume failed:", err));
    }
  } catch (err) {
    console.warn("AudioContext unlock failed:", err);
  }
}

// Play one instance of the key-click sound with near-zero latency.
// Each call creates a fresh BufferSourceNode (they are single-use by design).
function playKeySound() {
  if (!soundToggle?.checked || !audioCtxReady || !keyBuffer) return;
  try {
    const source = audioCtx.createBufferSource();
    source.buffer = keyBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
  } catch (err) {
    console.warn("playKeySound error:", err);
  }
}

// ─── Game State ───────────────────────────────────────────────────────────────
// These variables persist across clicks and track the current state of the game.
let firstCard = null; // DOM element of the first-clicked unmatched key, or null
let pendingNoMatch = null; // { first, second, timeoutId } for a mismatched pair being shown/faded
let matchedCount = 0; // How many pairs have been successfully matched
const totalPairs = 8; // Total pairs on the board (must match grid size / 2)

// ─── Clock State ──────────────────────────────────────────────────────────────
let clockInterval = null; // Reference to the setInterval timer, so we can clear it
let clockSeconds = 0; // Running total of elapsed seconds
let clockRunning = false; // Guard flag to prevent starting the clock twice
let clockPaused = false; // True while the game is manually paused

// ─── Color Pairs for Stroop Mode ──────────────────────────────────────────────
// Each entry is a { from, to } gradient pair. In Stroop mode, each key is
// assigned one of these colors — but matched pairs are guaranteed different colors,
// so color cannot be used as a matching cue. This creates Stroop-effect interference:
// the brain wants to use color as a shortcut, but must suppress it and match by shape.
const COLOR_PAIRS = [
  { from: "#d4a800", to: "#f1c40f" }, // gold
  { from: "#ff2244", to: "#ff7788" }, // red
  { from: "#cc00e0", to: "#ee55ff" }, // magenta
  { from: "#0055e8", to: "#4d8aff" }, // blue
  { from: "#00c87a", to: "#00f295" }, // green
  { from: "#00c4d4", to: "#00eeff" }, // teal
  { from: "#e06800", to: "#f27900" }, // orange
  { from: "#9933ff", to: "#cc88ff" }, // purple
];

// ─── Kudos List ─────────────────────────────────────────────────────────────
let kudosList = [];

// ─── Cookie Helpers ───────────────────────────────────────────────────────────
// Cookies persist user settings and best times across browser sessions.

// Store a value in a cookie with an optional expiry (default 1 year)
function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

// Retrieve a cookie value by name, or null if not found
function getCookie(name) {
  return document.cookie.split("; ").reduce((acc, part) => {
    const [k, v] = part.split("=");
    return k === name ? decodeURIComponent(v) : acc;
  }, null);
}

// ─── Clock Helpers ────────────────────────────────────────────────────────────

// Format a raw seconds count into "M:SS" display format
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Start the clock — increments clockSeconds every second and updates the display.
// The clockRunning guard prevents double-starting if clicked rapidly.
function startClock() {
  if (clockRunning) return;
  clockRunning = true;
  clockPaused = false;
  pauseButton.classList.add("visible");
  pauseButton.classList.remove("paused");
  pauseButton.innerHTML = "&#10074;&#10074;"; // ❚❚ pause icon
  clockInterval = setInterval(() => {
    clockSeconds++;
    clockDisplay.textContent = formatTime(clockSeconds);
  }, 1000);
}

// Stop the clock by clearing the interval
function stopClock() {
  clearInterval(clockInterval);
  clockRunning = false;
}

// Reset the clock display and state for a new game
function resetClock() {
  stopClock();
  clockSeconds = 0;
  clockPaused = false;
  clockDisplay.textContent = "0:00";
  clockDisplay.classList.remove("finished"); // Remove the green "finished" color
  pauseButton.classList.remove("visible", "paused");
}

// Returns the correct cookie key for best time based on current mode.
// Separate best times are tracked for normal and Stroop modes.
function getBestTimeKey() {
  return advancedToggle.checked ? "bestTimeAdvanced" : "bestTimeNormal";
}

// Load and display the best time for the current mode from cookies
function loadBestTime() {
  const best = getCookie(getBestTimeKey());
  if (best) {
    bestDisplay.textContent = `(best: ${formatTime(parseInt(best))})`;
  } else {
    bestDisplay.textContent = "";
  }
}

// Compare current time to stored best — save if it's a new record, then refresh display
function checkAndSaveBestTime(seconds) {
  const key = getBestTimeKey();
  const existing = getCookie(key);
  if (!existing || seconds < parseInt(existing)) {
    setCookie(key, seconds);
  }
  loadBestTime();
}

// ─── Pause Helpers ────────────────────────────────────────────────────────────

// Pause the clock and update the button to show the "resume" state.
function pauseClock() {
  if (!clockRunning || clockPaused) return;
  stopClock();
  clockPaused = true;
  pauseButton.classList.add("paused");
  pauseButton.innerHTML = "&#9654;"; // ▶ play icon
}

// Resume the clock from a paused state.
function resumeClock() {
  if (!clockPaused) return;
  startClock(); // startClock resets clockPaused and updates the button
}

// ─── Game Completion ──────────────────────────────────────────────────────────

// Called when the last pair is matched. Stops the clock, shows the checkmark,
// saves the best time, and triggers the success pulse animation on all matched keys.
function handleGameComplete() {
  stopClock();
  clockPaused = false;
  pauseButton.classList.remove("visible", "paused"); // Hide pause button on completion
  clockDisplay.classList.add("finished"); // Turns the clock display bright green
  clockDisplay.textContent = formatTime(clockSeconds) + " ✓";
  checkAndSaveBestTime(clockSeconds);
  showCompletionKudos();

  // Wait briefly for the last match animation to settle, then pulse all matched keys
  setTimeout(() => {
    document.querySelectorAll(".key-container.matched").forEach((card) => {
      card.classList.add("success-pulse");
      // Listen on the SVG (the animated element) not the container, so we
      // don't risk consuming a bubbled animationend from a different child.
      const svg = card.querySelector(".glyph-svg");
      if (svg) {
        svg.addEventListener(
          "animationend",
          () => {
            card.classList.remove("success-pulse");
          },
          { once: true },
        );
      }
    });
  }, 600);
}

// ─── Settings Persistence ─────────────────────────────────────────────────────

// Save current toggle states to cookies whenever they change
function saveSettings() {
  setCookie("soundEnabled", soundToggle.checked ? "1" : "0");
  setCookie("advancedEnabled", advancedToggle.checked ? "1" : "0");
}

// Restore toggle states from cookies on page load
function loadSettings() {
  const sound = getCookie("soundEnabled");
  const advanced = getCookie("advancedEnabled");
  if (sound !== null) soundToggle.checked = sound === "1";
  if (advanced !== null) advancedToggle.checked = advanced === "1";
}

// ─── Array Shuffle ────────────────────────────────────────────────────────────

// Fisher-Yates shuffle — randomizes an array in place with perfectly uniform distribution.
// Used to randomize glyph selection, pair arrangement, and color assignment.
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── SVG Builder ──────────────────────────────────────────────────────────────

// Builds a glyph SVG element from glyph data. Used both for key glyphs and the
// footer info display. Parameters:
//   glyphData     — the glyph object from glyphs.json
//   extraClasses  — additional CSS classes to add (e.g. "footer-glyph-svg")
//   gradientColors — { from, to } color pair for Stroop mode, or null for default gold
//   cardIndex     — unique index used to generate a unique gradient ID per card
function buildGlyphSvg(glyphData, extraClasses = [], gradientColors = null, cardIndex = 0) {
  const b = glyphData.bounds;

  // Create the SVG element — must use createElementNS for SVG namespace
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  // viewBox uses the glyph's bounding box to auto-center and scale the path
  svg.setAttribute("viewBox", `${b.xMin} ${b.yMin} ${b.xMax - b.xMin} ${b.yMax - b.yMin}`);
  svg.classList.add("glyph-svg", ...extraClasses);

  // Default fill points to the shared gold gradient defined in index.html
  let fillRef = "url(#key-glyph-gradient)";

  if (gradientColors) {
    // In Stroop mode, each card gets its own inline gradient with a unique ID
    // so that two cards with the same glyph can have different colors.
    // The ID uses cardIndex (not glyphId) to ensure uniqueness even for matched pairs.
    const gradientId = `grad-${cardIndex}`;
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    gradient.setAttribute("id", gradientId);
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "0%");

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", gradientColors.from);

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", gradientColors.to);

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);
    fillRef = `url(#${gradientId})`;
  }

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", glyphData.path);

  // Font paths have Y increasing upward; screen coordinates have Y increasing downward.
  // scale(1,-1) flips vertically; translate corrects the resulting vertical offset.
  path.setAttribute("transform", `scale(1, -1) translate(0, -${b.yMax + b.yMin})`);

  // In Stroop mode, set fill via style (not attribute) so it can be overridden
  // later by setting path.style.fill directly when the card is matched
  if (gradientColors) {
    path.style.fill = fillRef;
  }

  svg.appendChild(path);
  return svg;
}

// ─── Footer Info Display ──────────────────────────────────────────────────────

// Updates the glyph info box in the footer when a key is clicked.
// Shows a small SVG copy of the glyph alongside its font name, hex code, and Alt code.
function updateFooter(glyphData) {
  // Build a small version of the glyph SVG for the footer (no gradient colors — always dark)
  const footerSvg = buildGlyphSvg(glyphData, ["footer-glyph-svg"]);

  infoDisplay.innerHTML = "";
  infoDisplay.classList.add("visible"); // Makes the info box appear (display: flex)
  infoDisplay.classList.remove("completion");

  infoDisplay.appendChild(footerSvg);

  const textBlock = document.createElement("div");
  textBlock.className = "info-box-text";

  const line1 = document.createElement("div");
  line1.textContent = glyphData.fontName;

  const line2 = document.createElement("div");
  line2.textContent = `${glyphData.hex} · Win: Alt+${glyphData.decimal}`;

  textBlock.appendChild(line1);
  textBlock.appendChild(line2);
  infoDisplay.appendChild(textBlock);
}

// ─── Color Assignment (Stroop Mode) ───────────────────────────────────────────

// Assigns a random color from COLOR_PAIRS to each card in the game set,
// guaranteeing that the two cards of every matched pair get DIFFERENT colors.
// This is the core of the Stroop effect mechanic.
function assignColors(gameSet) {
  const shuffledColors = shuffleArray([...COLOR_PAIRS]);

  // Build a map of glyphId -> [positionA, positionB] in the gameSet array
  const glyphPositions = {};
  gameSet.forEach((glyphData, i) => {
    if (!glyphPositions[glyphData.id]) glyphPositions[glyphData.id] = [];
    glyphPositions[glyphData.id].push(i);
  });

  const colorAssignments = new Array(gameSet.length);
  const pairs = Object.values(glyphPositions); // Array of 8 [posA, posB] pairs

  // Generate a shuffled sequence of color indices for the first card of each pair
  const firstCardColors = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7]);

  pairs.forEach(([posA, posB], i) => {
    const colorA = firstCardColors[i];
    // Offset by 1-7 guarantees colorB is always different from colorA (never 0 offset)
    const offset = Math.floor(Math.random() * 7) + 1;
    const colorB = (colorA + offset) % shuffledColors.length;

    colorAssignments[posA] = shuffledColors[colorA];
    colorAssignments[posB] = shuffledColors[colorB];
  });

  return colorAssignments;
}

// ─── Game Initialization ──────────────────────────────────────────────────────

// Resets all game state and populates the pre-existing skeleton key elements with
// fresh glyph data. Keys are never destroyed and recreated — their event listeners
// are managed via a delegated click handler on the grid — so this just wipes visual
// state and writes new data attributes and SVG children into the existing DOM nodes.
async function initGame() {
  // Reset game state
  firstCard = null;
  pendingNoMatch = null;
  matchedCount = 0;
  infoDisplay.innerHTML = "";
  infoDisplay.classList.remove("visible", "completion");
  resetClock();
  loadBestTime();

  // Blank out all skeleton keys while we fetch fresh data — remove any SVG children
  // and clear all game-state classes so the board looks clean during the fetch.
  const keyContainers = grid.querySelectorAll(".key-container");
  keyContainers.forEach((c) => {
    c.className = "key-container"; // Wipe matched / guess-color / fading etc.
    c.dataset.glyphId = "";
    c.dataset.gradientId = "";
    const img = c.querySelector(".key-image");
    if (img) img.innerHTML = "";
  });

  try {
    const [glyphResponse, kudosResponse] = await Promise.all([
      fetch("json/glyphs.json"),
      fetch("json/kudos.json"),
    ]);
    const data = await glyphResponse.json();
    kudosList = await kudosResponse.json();

    // Build a flat pool of all glyphs across all fonts in the JSON,
    // tagging each with its font name and a unique composite ID
    const allGlyphs = Object.entries(data).flatMap(([fontName, fontGlyphs]) =>
      Object.entries(fontGlyphs).map(([hex, glyph]) => ({
        ...glyph,
        fontName, // Stored so the footer can display the correct font name
        id: `${fontName}|${hex}`, // Unique ID combining font and hex — used for match comparisons
      })),
    );

    // Pick 8 random glyphs, duplicate them to make pairs, then shuffle
    const shuffled = shuffleArray([...allGlyphs]);
    const selected = shuffled.slice(0, 8);
    const gameSet = shuffleArray([...selected, ...selected]);

    // In Stroop mode, assign colors now — before keys are populated
    const colorAssignments = advancedToggle.checked ? assignColors(gameSet) : null;

    // Populate each pre-existing skeleton key with its assigned glyph data.
    // We reuse the DOM nodes rather than recreating them to avoid re-registering
    // event listeners and to prevent layout flash.
    keyContainers.forEach((container, i) => {
      populateKey(container, gameSet[i], colorAssignments ? colorAssignments[i] : null, i);
    });
  } catch (error) {
    console.error("Error loading glyphs:", error);
  }
}

// ─── Key Population ───────────────────────────────────────────────────────────

// Writes glyph data into an existing skeleton key container.
// Called once per key on each initGame(). The container element already lives in
// the DOM (pre-rendered in HTML), so this only updates data attributes and injects
// the SVG child — no new container is created, no event listeners are added here.
function populateKey(container, glyphData, gradientColors, cardIndex) {
  // Stash the full glyph object directly on the DOM node so the delegated
  // click handler can call updateFooter without maintaining a separate lookup map.
  container._glyphData = glyphData;

  // Write the glyph's unique ID as a data attribute for match comparisons
  container.dataset.glyphId = glyphData.id;

  // In Stroop mode, store the gradient ID so the match animation can reference
  // this card's own color rather than always starting from gold
  if (gradientColors) {
    container.dataset.gradientId = `grad-${cardIndex}`;
  } else {
    delete container.dataset.gradientId;
  }

  // Inject the glyph SVG into the key-image div (replacing any previous SVG)
  const img = container.querySelector(".key-image");
  img.innerHTML = "";
  img.appendChild(buildGlyphSvg(glyphData, [], gradientColors, cardIndex));
}

// ─── Click Handler (delegated) ────────────────────────────────────────────────

// All click logic lives on the grid itself (event delegation), rather than on
// each individual key container. This means the listener is registered exactly
// once — at startup — and survives initGame() calls that repopulate the keys.
grid.addEventListener("click", (e) => {
  const container = e.target.closest(".key-container");
  if (!container) return;

  // Retrieve the glyph data we'll need from the populated data attribute
  // (we look it up from the SVG's stored path rather than closing over stale data)
  const glyphId = container.dataset.glyphId;
  if (!glyphId) return; // Key not yet populated (shouldn't happen, but guard anyway)

  // Resume the clock if the game was paused — any key click resumes play
  if (clockPaused) {
    resumeClock();
    // Don't return — process this click normally so the tap isn't wasted
  }

  // Start the clock on the very first click of a new game.
  // The matchedCount guard prevents restarting after game completion.
  if (!clockRunning && matchedCount < totalPairs) {
    startClock();
  }

  // ── Pending no-match cleanup ─────────────────────────────────────────────
  // If a mismatched pair is currently visible or fading, the user's new click
  // clears them with a quick accelerated fade before processing the new click.
  if (pendingNoMatch) {
    clearTimeout(pendingNoMatch.timeoutId); // Cancel whatever fade timer was running
    pendingNoMatch.first.classList.add("fading");
    pendingNoMatch.second.classList.add("fading");

    const p = pendingNoMatch;
    pendingNoMatch = null; // Null immediately so rest of this click sees clean state

    // p captures the reference before null — the closure needs it 200ms later
    setTimeout(() => {
      p.first.classList.remove("guess-color", "fading");
      p.second.classList.remove("guess-color", "fading");
    }, 200);
  }

  // Ignore double-clicking the same card
  if (container === firstCard) return;

  // Reveal this card's glyph.
  // To update the footer we need the full glyph object, not just the id.
  // We read it from the SVG path data stored in the DOM rather than keeping a
  // separate JS map — the glyph object reference is stored on the element itself.
  container.classList.add("guess-color");

  // Retrieve the stored glyphData reference we attached during populateKey
  if (container._glyphData) updateFooter(container._glyphData);

  // Matched cards can still be clicked to show their info,
  // but they never re-enter pairing logic
  if (container.classList.contains("matched")) return;

  if (!firstCard) {
    // ── First card of a new pair ─────────────────────────────────────────
    firstCard = container;
  } else {
    // ── Second card — evaluate the pair ─────────────────────────────────

    // Edge case: if firstCard became matched during an animation,
    // quietly replace it with this new card as the first card instead
    if (firstCard.classList.contains("matched")) {
      firstCard = container;
      return;
    }

    const firstId = firstCard.dataset.glyphId;
    const secondId = container.dataset.glyphId;

    if (firstId === secondId) {
      // ✅ MATCH ────────────────────────────────────────────────────────────
      const matched1 = firstCard;
      const matched2 = container;
      firstCard = null; // Free firstCard immediately so user can start a new pair
      matchedCount++;

      matched1.classList.add("matched-flash");
      matched2.classList.add("matched-flash");

      // ── Safari-safe match transition ──────────────────────────────────────
      // We no longer animate the fill CSS property at all — Safari cannot
      // interpolate between SVG paint-server values (url(#grad-X)) and will
      // drop the fill for one frame, causing a visible flash/blink.
      //
      // Instead the keyframe only animates filter (drop-shadow glow), which
      // Safari handles reliably.  At animationend we swap to the .matched
      // class (which sets fill to the silver gradient via a plain CSS rule)
      // and force the path's inline style to match, overriding any Stroop color.
      //
      // IMPORTANT: we attach animationend to the SVG element itself, not the
      // container. The animation runs on .glyph-svg; if we listen on the
      // container and another nested element also fires animationend (e.g. a
      // child filter), the { once: true } listener would fire on the wrong event.
      // Listening on the exact animated element is always unambiguous.
      let animsComplete = 0;
      function onMatchGlowEnd(card) {
        const svg = card.querySelector(".glyph-svg");
        if (!svg) return;
        svg.addEventListener(
          "animationend",
          () => {
            card.classList.remove("matched-flash", "guess-color");
            card.classList.add("matched");

            // Override any Stroop-mode inline fill with the matched gradient
            const path = card.querySelector("path");
            if (path) path.style.fill = "url(#key-glyph-matched)";

            animsComplete++;
            if (animsComplete === 2 && matchedCount === totalPairs) {
              handleGameComplete();
            }
          },
          { once: true },
        );
      }

      onMatchGlowEnd(matched1);
      onMatchGlowEnd(matched2);

    } else {
      // ❌ NO MATCH ─────────────────────────────────────────────────────────
      // Store the pair in pendingNoMatch so it can be cancelled if the user
      // clicks again before the fade completes. Two nested timeouts handle
      // the two-phase exit: show briefly (700ms), then fade out (500ms CSS transition).
      const fadeCard1 = firstCard;
      const fadeCard2 = container;
      firstCard = null;
      pendingNoMatch = { first: fadeCard1, second: fadeCard2, timeoutId: null };

      const timeoutId = setTimeout(() => {
        fadeCard1.classList.add("fading");
        fadeCard2.classList.add("fading");

        const cleanupId = setTimeout(() => {
          fadeCard1.classList.remove("guess-color", "fading");
          fadeCard2.classList.remove("guess-color", "fading");
          pendingNoMatch = null;
        }, 600); // 600ms gives the 500ms CSS fade time to complete

        // Update timeoutId to the cleanup timer so the pending guard above
        // always has the correct timer to cancel regardless of which phase we're in
        if (pendingNoMatch) pendingNoMatch.timeoutId = cleanupId;
      }, 700); // 700ms: how long both mismatched glyphs stay fully visible

      pendingNoMatch.timeoutId = timeoutId;
    }
  }
});

// ─── Mouse / Touch Press Animation (delegated) ───────────────────────────────

// Delegated press animations so we don't register per-key listeners on every init.
grid.addEventListener("mousedown", (e) => {
  const container = e.target.closest(".key-container");
  if (!container) return;
  // Unlock the AudioContext on the first gesture (no-op on subsequent presses).
  // The buffer is already decoded from page load, so playKeySound() works immediately.
  unlockAudioContext();
  playKeySound();
  container.classList.add("pressed");
});

grid.addEventListener("mouseup", (e) => {
  const container = e.target.closest(".key-container");
  if (container) setTimeout(() => container.classList.remove("pressed"), 120);
});

grid.addEventListener("touchstart", (e) => {
  const container = e.target.closest(".key-container");
  if (!container) return;
  // touchstart is the gesture Safari recognises for AudioContext unlock on iOS.
  unlockAudioContext();
  playKeySound();
  container.classList.add("pressed");
}, { passive: true });

grid.addEventListener("touchend", (e) => {
  const container = e.target.closest(".key-container");
  if (container) setTimeout(() => container.classList.remove("pressed"), 120);
});

// ─── Pause Button ─────────────────────────────────────────────────────────────

pauseButton.addEventListener("click", () => {
  if (clockPaused) {
    resumeClock();
  } else {
    pauseClock();
  }
});

// ─── Best Time Modal ──────────────────────────────────────────────────────────

// Shows a confirmation modal when the user clicks the best time display.
// Allows clearing the best time for the current mode independently.
function showClearBestTimeModal() {
  const isAdvanced = advancedToggle.checked;
  const modeLabel = isAdvanced ? "Stroop" : "Normal";

  // Build the modal entirely in JS so no HTML markup is needed for it
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const box = document.createElement("div");
  box.className = "modal-box";

  const message = document.createElement("div");
  message.className = "modal-message";
  message.textContent = `Clear best time for ${modeLabel} mode?`;

  const buttons = document.createElement("div");
  buttons.className = "modal-buttons";

  const confirmBtn = document.createElement("button");
  confirmBtn.className = "modal-btn confirm";
  confirmBtn.textContent = "CLEAR";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "modal-btn";
  cancelBtn.textContent = "CANCEL";

  // Expire the cookie by setting days = -1, then refresh the display
  confirmBtn.addEventListener("click", () => {
    setCookie(getBestTimeKey(), "", -1);
    loadBestTime();
    document.body.removeChild(overlay);
  });

  cancelBtn.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  // Also dismiss by clicking the dark backdrop outside the modal box
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  buttons.appendChild(confirmBtn);
  buttons.appendChild(cancelBtn);
  box.appendChild(message);
  box.appendChild(buttons);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

// RESTART button — resets the board completely
restartButton.addEventListener("click", () => {
  initGame();
});

// Sound toggle — just save the new setting
soundToggle.addEventListener("change", saveSettings);

// Stroop mode toggle — save setting and restart the board since color
// assignment happens at game setup time and can't be applied retroactively
advancedToggle.addEventListener("change", () => {
  saveSettings();
  initGame();
});

// Best time display — clicking it opens the clear confirmation modal,
// but only if a best time actually exists for the current mode
bestDisplay.addEventListener("click", () => {
  const best = getCookie(getBestTimeKey());
  if (best) {
    showClearBestTimeModal();
  }
});

// ─── Completion Kudos ───────────────────────────────────────────────────────
// When the game is completed, show a random congratulatory message in the info box.
function showCompletionKudos() {
  const text = kudosList[Math.floor(Math.random() * kudosList.length)];

  infoDisplay.innerHTML = "";
  infoDisplay.classList.add("visible", "completion");

  const msg = document.createElement("div");
  msg.className = "kudos-text";
  msg.textContent = text;
  infoDisplay.appendChild(msg);

  const playAgain = document.createElement("a");
  playAgain.className = "play-again-link";
  playAgain.textContent = "PLAY AGAIN";
  playAgain.href = "#";
  playAgain.addEventListener("click", (e) => {
    e.preventDefault();
    initGame();
  });
  infoDisplay.appendChild(playAgain);
}

// ─── Startup ──────────────────────────────────────────────────────────────────

// If on a narrow screen, show a message instead of the game — it's not designed for mobile
if (window.innerWidth < 768) {
  document.body.innerHTML = `
    <div style="font-family: 'Segoe UI', sans-serif; font-size: 20px; 
    font-weight: 600; color: #37474f; text-align: center; padding: 40px;">
      Mobile version under construction.<br><br>
      Please visit on a desktop browser.
    </div>`;
}

// Restore saved settings from cookies, then initialize the first game
loadSettings();
initGame();

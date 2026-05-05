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
const keySound = new Audio("audio/keyclick.mp3"); // Audio object created once at startup

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
  clockDisplay.textContent = "0:00";
  clockDisplay.classList.remove("finished"); // Remove the green "finished" color
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

// ─── Game Completion ──────────────────────────────────────────────────────────

// Called when the last pair is matched. Stops the clock, shows the checkmark,
// saves the best time, and triggers the success pulse animation on all matched keys.
function handleGameComplete() {
  stopClock();
  clockDisplay.classList.add("finished"); // Turns the clock display bright green
  clockDisplay.textContent = formatTime(clockSeconds) + " ✓";
  checkAndSaveBestTime(clockSeconds);
  showCompletionKudos();

  // Wait briefly for the last match animation to settle, then pulse all matched keys
  setTimeout(() => {
    document.querySelectorAll(".key-container.matched").forEach((card) => {
      card.classList.add("success-pulse");
      // Remove the class once the animation ends so it can be re-triggered next game
      card.addEventListener(
        "animationend",
        () => {
          card.classList.remove("success-pulse");
        },
        { once: true }, // { once: true } means the listener removes itself after firing once
      );
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

// Resets all game state and builds a fresh board. Called on page load,
// when RESTART is clicked, and when the Stroop mode toggle changes.
async function initGame() {
  // Reset game state
  firstCard = null;
  pendingNoMatch = null;
  matchedCount = 0;
  grid.innerHTML = ""; // Clear all key elements from the DOM
  grid.classList.remove("ready"); // Hide the grid until new keys are created
  infoDisplay.innerHTML = "";
  infoDisplay.classList.remove("visible", "completion"); // Hide the info box until first click
  resetClock();
  loadBestTime();

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

    // In Stroop mode, assign colors now — before keys are created
    const colorAssignments = advancedToggle.checked ? assignColors(gameSet) : null;

    // Create a key element for each item in the game set
    gameSet.forEach((glyphData, i) => {
      createKey(glyphData, colorAssignments ? colorAssignments[i] : null, i);
    });
    grid.classList.add("ready"); // Makes the grid visible now that all keys are created
  } catch (error) {
    console.error("Error loading glyphs:", error);
  }
}

// ─── Key Creation ─────────────────────────────────────────────────────────────

// Builds a single key element and appends it to the grid.
// Each key is a three-layer DOM structure:
//   key-container > mask-wrapper > key-image > glyph SVG
// The container holds game-state CSS classes; the mask clips the keycap corners;
// the key-image shows the keycap texture and centers the glyph.
function createKey(glyphData, gradientColors = null, cardIndex = 0) {
  const container = document.createElement("div");
  container.className = "key-container";

  const mask = document.createElement("div");
  mask.className = "mask-wrapper";

  const img = document.createElement("div");
  img.className = "key-image";

  // Store the glyph's unique ID as a data attribute for match comparisons in click handler
  container.dataset.glyphId = glyphData.id;

  // In Stroop mode, store the gradient ID so the match animation can reference
  // this card's own color rather than always starting from gold
  if (gradientColors) {
    container.dataset.gradientId = `grad-${cardIndex}`;
  }

  const svg = buildGlyphSvg(glyphData, [], gradientColors, cardIndex);

  img.appendChild(svg);
  mask.appendChild(img);
  container.appendChild(mask);
  grid.appendChild(container);

  // Handle press animations on mouse and touch events.
  container.addEventListener("mousedown", () => {
    if (soundToggle?.checked) {
      keySound.currentTime = 0;
      keySound.play();
    }
    container.classList.add("pressed");
  });

  container.addEventListener("mouseup", () => {
    setTimeout(() => container.classList.remove("pressed"), 120);
  });

  container.addEventListener("touchstart", { passive: true }, () => {
    container.classList.add("pressed");
  });

  container.addEventListener("touchend", () => {
    setTimeout(() => container.classList.remove("pressed"), 120);
  });

  // ─── Click Handler (State Machine) ──────────────────────────────────────────
  // Manages the game's core matching logic. Think of it as a state machine with
  // these states: nothing selected | first card flipped | mismatched pair showing |
  // matched pair animating.
  container.addEventListener("click", () => {
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

    // Reveal this card's glyph and update the footer info box
    container.classList.add("guess-color");
    updateFooter(glyphData);

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

        // Determine each card's starting gradient for the match-glow animation.
        // In Stroop mode each card has its own color; in normal mode both use gold.
        const grad1 = matched1.dataset.gradientId
          ? `url(#${matched1.dataset.gradientId})`
          : "url(#key-glyph-gradient)";
        const grad2 = matched2.dataset.gradientId
          ? `url(#${matched2.dataset.gradientId})`
          : "url(#key-glyph-gradient)";

        // Set CSS custom properties so the keyframe animation starts from
        // each card's own color rather than always from gold
        matched1.style.setProperty("--match-start-fill", grad1);
        matched2.style.setProperty("--match-start-fill", grad2);

        matched1.classList.add("matched-flash");
        matched2.classList.add("matched-flash");

        setTimeout(() => {
          // Swap from animation class to permanent matched state
          matched1.classList.remove("matched-flash", "guess-color");
          matched2.classList.remove("matched-flash", "guess-color");
          matched1.classList.add("matched");
          matched2.classList.add("matched");

          // Force the path fill to the matched gradient via inline style,
          // overriding any Stroop-mode color that was set on the path
          const path1 = matched1.querySelector("path");
          const path2 = matched2.querySelector("path");
          if (path1) path1.style.fill = "url(#key-glyph-matched)";
          if (path2) path2.style.fill = "url(#key-glyph-matched)";

          // Check if this was the last pair
          if (matchedCount === totalPairs) {
            handleGameComplete();
          }
        }, 1000); // Matches the match-glow animation duration in CSS
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
}

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

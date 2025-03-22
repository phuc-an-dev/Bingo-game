// Use constants for values that don't change
const DOUBLE_TAP_THRESHOLD = 200;
const SINGLE_TAP_DELAY = 200;
const SWIPE_THRESHOLD = 10;
const GRID_SIZE = 25;

// Store DOM references once instead of querying each time
const elements = {
  bingoBoard: null,
  themeButtons: null,
};

let currentQuestions = [];
let activeTheme = "tinh_cach";

// Pure function that doesn't modify the original array
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function clearBingoBoard() {
  elements.bingoBoard.innerHTML = "";
}

function createBingoCell(question) {
  const cell = document.createElement("div");
  cell.className = "bingo-cell";
  cell.textContent = question;

  // Use object to store cell state instead of DOM properties
  const state = {
    lastTap: 0,
    startX: 0,
    startY: 0,
  };

  cell.addEventListener("pointerdown", (e) => handlePointerDown(e, state));
  cell.addEventListener("pointerup", (e) => handlePointerUp(e, cell, state));

  return cell;
}

function handlePointerDown(e, state) {
  state.startX = e.clientX;
  state.startY = e.clientY;
}

function handlePointerUp(e, cell, state) {
  // Check if this was a swipe rather than a tap
  if (
    Math.abs(e.clientX - state.startX) > SWIPE_THRESHOLD ||
    Math.abs(e.clientY - state.startY) > SWIPE_THRESHOLD
  ) {
    return;
  }

  const now = Date.now();

  // Double tap detection
  if (now - state.lastTap < DOUBLE_TAP_THRESHOLD) {
    toggleCellState(cell, "crossed");
    state.lastTap = 0;
  } else {
    // Single tap with delay to allow for double tap
    setTimeout(() => {
      if (state.lastTap !== 0) {
        toggleCellState(cell, "checked");
        state.lastTap = 0;
      }
    }, SINGLE_TAP_DELAY);

    state.lastTap = now;
  }
}

function toggleCellState(cell, newState) {
  console.log("newState", newState);
  console.log("cell.classList", cell.classList);

  if (
    newState === "checked" &&
    (cell.classList.contains("checked") || cell.classList.contains("crossed"))
  ) {
    cell.classList.remove("checked", "crossed");
    return;
  }

  // Only add the new state if the cell doesn't already have it
  if (newState === "checked" && !cell.classList.contains("checked")) {
    cell.classList.add("checked");
  } else if (newState === "crossed" && !cell.classList.contains("crossed")) {
    cell.classList.add("crossed");
  }
}

function initBingoBoard(theme) {
  clearBingoBoard();
  activeTheme = theme;

  // Get questions for the selected theme with a fallback
  currentQuestions = questionSets[theme] || questionSets.tinh_cach;

  // Only shuffle the number of questions we need
  const shuffledQuestions = shuffleArray(currentQuestions).slice(0, GRID_SIZE);

  // Create a document fragment to improve performance when adding multiple elements
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < GRID_SIZE; i++) {
    const cell = createBingoCell(shuffledQuestions[i]);
    fragment.appendChild(cell);
  }

  elements.bingoBoard.appendChild(fragment);
}

function renderThemeButtons() {
  // Use document fragment for better performance
  const fragment = document.createDocumentFragment();

  themes.forEach((theme) => {
    const button = document.createElement("button");
    button.className = "theme-button";
    button.textContent = theme.name;
    button.dataset.theme = theme.id;

    if (theme.id === activeTheme) {
      button.classList.add("active");
    }

    button.addEventListener("click", handleThemeClick);
    fragment.appendChild(button);
  });

  elements.themeButtons.appendChild(fragment);
}

function handleThemeClick(e) {
  // Update active button styling
  document
    .querySelectorAll(".theme-button")
    .forEach((btn) =>
      btn.classList.toggle(
        "active",
        btn.dataset.theme === e.target.dataset.theme
      )
    );

  // Initialize board with new theme
  initBingoBoard(e.target.dataset.theme);
}

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // Cache DOM elements
  elements.bingoBoard = document.getElementById("bingoBoard");
  elements.themeButtons = document.getElementById("themeButtons");

  renderThemeButtons();
  initBingoBoard(activeTheme);
});

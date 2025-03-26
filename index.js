const DOUBLE_TAP_THRESHOLD = 200;
const SINGLE_TAP_DELAY = 200;
const SWIPE_THRESHOLD = 10;
const GRID_SIZE = 25;
const SAVE_DELAY = 300;

const elements = {
  bingoBoard: null,
  themeButtons: null,
};

let currentQuestions = [];
let activeTheme = "suc_khoe";

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
  const state = {
    lastTap: 0,
    startX: 0,
    startY: 0,
  };
  cell.addEventListener("pointerdown", (e) => {
    cell.classList.add("tap-effect");
    handlePointerDown(e, state);
  });
  cell.addEventListener("pointerup", (e) => {
    cell.classList.remove("tap-effect");
    handlePointerUp(e, cell, state);
  });
  cell.addEventListener("pointercancel", () => {
    cell.classList.remove("tap-effect");
  });
  return cell;
}

function handlePointerDown(e, state) {
  state.startX = e.clientX;
  state.startY = e.clientY;
}

function handlePointerUp(e, cell, state) {
  if (
    Math.abs(e.clientX - state.startX) > SWIPE_THRESHOLD ||
    Math.abs(e.clientY - state.startY) > SWIPE_THRESHOLD
  ) {
    return;
  }

  const now = Date.now();
  if (now - state.lastTap < DOUBLE_TAP_THRESHOLD) {
    toggleCellState(cell, "crossed");
    state.lastTap = 0;
  } else {
    setTimeout(() => {
      if (state.lastTap !== 0) {
        toggleCellState(cell, "checked");
        state.lastTap = 0;
      }
    }, SINGLE_TAP_DELAY);

    state.lastTap = now;
  }
  setTimeout(saveBoardState, SAVE_DELAY);
}

function toggleCellState(cell, newState) {
  if (
    newState === "checked" &&
    (cell.classList.contains("checked") || cell.classList.contains("crossed"))
  ) {
    cell.classList.remove("checked", "crossed");
    return;
  }
  if (newState === "checked" && !cell.classList.contains("checked")) {
    cell.classList.add("checked");
  } else if (newState === "crossed" && !cell.classList.contains("crossed")) {
    cell.classList.add("crossed");
  }
}

function saveBoardState() {
  if (!activeTheme) return;
  const boardState = Array.from(elements.bingoBoard.children).map((cell) => ({
    text: cell.textContent,
    checked: cell.classList.contains("checked"),
    crossed: cell.classList.contains("crossed"),
  }));
  localStorage.setItem(
    `bingo_board_${activeTheme}`,
    JSON.stringify(boardState)
  );
}

function loadBoardState() {
  const savedState = localStorage.getItem(`bingo_board_${activeTheme}`);
  if (savedState) {
    const boardState = JSON.parse(savedState);
    const cells = elements.bingoBoard.children;
    boardState.forEach((cellState, index) => {
      if (index < cells.length) {
        const cell = cells[index];
        cell.textContent = cellState.text;
        cell.classList.remove("checked", "crossed");
        if (cellState.checked) cell.classList.add("checked");
        if (cellState.crossed) cell.classList.add("crossed");
      }
    });
  }
}

function initBingoBoard(theme) {
  clearBingoBoard();
  activeTheme = theme;
  currentQuestions = questionSets[theme] || questionSets.tinh_cach;
  const shuffledQuestions = shuffleArray(currentQuestions);
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < currentQuestions.length; i++) {
    const cell = createBingoCell(shuffledQuestions[i]);
    fragment.appendChild(cell);
  }
  elements.bingoBoard.appendChild(fragment);
  loadBoardState();
}

function renderThemeButtons() {
  const fragment = document.createDocumentFragment();
  themes.forEach((theme) => {
    const themeContainer = document.createElement("div");
    themeContainer.className = "theme-container";
    const button = document.createElement("button");
    button.className = "theme-button";
    button.textContent = theme.name;
    button.dataset.theme = theme.id;
    if (theme.id === activeTheme) {
      button.classList.add("active");
    }
    button.addEventListener("click", handleThemeClick);
    const resetButton = document.createElement("button");
    resetButton.className = "reset-button";
    resetButton.innerHTML = "&#x21bb;";
    resetButton.dataset.theme = theme.id;
    resetButton.addEventListener("click", handleResetClick);
    themeContainer.appendChild(button);
    themeContainer.appendChild(resetButton);
    fragment.appendChild(themeContainer);
  });
  elements.themeButtons.appendChild(fragment);
}

function handleThemeClick(e) {
  document
    .querySelectorAll(".theme-button")
    .forEach((btn) =>
      btn.classList.toggle(
        "active",
        btn.dataset.theme === e.target.dataset.theme
      )
    );
  initBingoBoard(e.target.dataset.theme);
}

function handleResetClick(e) {
  const theme = e.target.dataset.theme;
  localStorage.removeItem(`bingo_board_${theme}`);
  initBingoBoard(theme);
}

document.addEventListener("DOMContentLoaded", function () {
  elements.bingoBoard = document.getElementById("bingoBoard");
  elements.themeButtons = document.getElementById("themeButtons");
  renderThemeButtons();
  initBingoBoard(activeTheme);
});

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
let activeTheme = "1";
let themes = [];
let questionSets = {};

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
  currentQuestions = questionSets[theme] || questionSets[0];
  const shuffledQuestions = shuffleArray(currentQuestions);
  const fragment = document.createDocumentFragment();
  for (const element of shuffledQuestions) {
    const cell = createBingoCell(element);
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

async function getSheetData(retries = 3) {
  try {
    const spreadsheetId = "1FRs4QTxh03H3l4R7V4vZTQO2vGWsHUzjP_-bNHdvWu0";
    const sheetName = "data";
    const range = "A1:F70";
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}&range=${range}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const text = await response.text();
    const jsonData = JSON.parse(
      text.replace(
        /.*google\.visualization\.Query\.setResponse\((.*)\);.*/s,
        "$1"
      )
    );
    const rows = jsonData.table.rows;
    const data = rows.map((row) => row.c.map((cell) => (cell ? cell.v : "")));

    themes = data[0].map((theme, index) => ({ id: index, name: theme }));
    for (let i = 1; i < data.length; i++) {
      for (let j = 0; j < data[0].length; j++) {
        if (!questionSets[j]) {
          questionSets[j] = [];
        }
        if (data[i][j]) {
          questionSets[j].push(data[i][j]);
        }
      }
    }
    renderThemeButtons();
    initBingoBoard(activeTheme);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await getSheetData(retries - 1);
    } else {
      console.error("Failed to fetch data after multiple attempts");
    }
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  elements.bingoBoard = document.getElementById("bingoBoard");
  elements.themeButtons = document.getElementById("themeButtons");
  await getSheetData();
});

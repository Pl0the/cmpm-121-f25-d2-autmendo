import "./style.css";

const title = document.createElement("h1");
title.textContent = "My Canvas App";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "sketch_canvas";
document.body.append(canvas);

document.body.style.textAlign = "center";

const ctx = canvas.getContext("2d");

interface Point {
  x: number;
  y: number;
}

type Line = Point[];

const lines: Line[] = [];
const redoLines: Line[] = [];

let currentLine: Line | null = null;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = [];
  lines.push(currentLine);
  redoLines.splice(0, redoLines.length);
  currentLine.push({ x: cursor.x, y: cursor.y });

  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active && currentLine) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine.push({ x: cursor.x, y: cursor.y });

    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("drawing-changed", () => {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of lines) {
      if (line.length > 1) {
        ctx.beginPath();
        const point = line[0];
        if (!point) continue;
        ctx.moveTo(point.x, point.y);
        for (const point of line) {
          ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      }
    }
  }
});

const clearButton = document.createElement("button");
clearButton.innerText = "Clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  if (ctx) {
    lines.splice(0, lines.length);
    redoLines.splice(0, redoLines.length);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const undoButton = document.createElement("button");
undoButton.innerText = "Undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    const undo = lines.pop();
    if (undo) {
      redoLines.push(undo);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const redoButton = document.createElement("button");
redoButton.innerText = "Redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoLines.length > 0) {
    const redo = redoLines.pop();
    if (redo) {
      lines.push(redo);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

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

interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
}

const commands: Drawable[] = [];
const redoCommands: Drawable[] = [];

let toolMoved: Drawable | null = null;

const bus = new EventTarget();

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

function redraw() {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const command of commands) {
      command.display(ctx);
    }
    if (toolMoved) {
      toolMoved.display(ctx);
    }
  }
}

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("tool-moved", redraw);

function tick() {
  redraw();
  requestAnimationFrame(tick);
}
tick();

class MarkerLines implements Drawable {
  points: { x: number; y: number }[] = [];
  thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.points.push({ x, y });
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "blue";
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    ctx.moveTo(this.points[0]!.x, this.points[0]!.y);
    for (const point of this.points) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
}

class ToolMoved implements Drawable {
  x: number;
  y: number;
  thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  display(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.arc(this.x, this.y, this.thickness * 1.5, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

let currentLineCommand: MarkerLines | null = null;
let currentThickness = 2;

canvas.addEventListener("mousedown", (e) => {
  currentLineCommand = new MarkerLines(e.offsetX, e.offsetY, currentThickness);
  commands.push(currentLineCommand);
  redoCommands.splice(0, redoCommands.length);
  toolMoved = null;
  notify("drawing-changed");
});

canvas.addEventListener("mouseenter", (e) => {
  toolMoved = new ToolMoved(e.offsetX, e.offsetY, currentThickness);
  notify("tool-moved");
});

canvas.addEventListener("mousemove", (e) => {
  if (e.buttons == 1 && currentLineCommand) {
    currentLineCommand.drag(e.offsetX, e.offsetY);
    notify("drawing-changed");
  } else if (!currentLineCommand) {
    toolMoved = new ToolMoved(e.offsetX, e.offsetY, currentThickness);
    notify("tool-moved");
  }
});

canvas.addEventListener("mouseout", () => {
  toolMoved = null;
  notify("tool-moved");
});

canvas.addEventListener("mouseup", () => {
  currentLineCommand = null;
  notify("drawing-changed");
});

const buttonContainer = document.createElement("div");
buttonContainer.id = "button-container";
document.body.append(buttonContainer);

const thinButton = document.createElement("button");
thinButton.innerText = "Thin";
thinButton.classList.add("thin-thick-button", "selected");
buttonContainer.append(thinButton);

thinButton.addEventListener("click", () => {
  currentThickness = 2;
  thinButton.classList.add("selected");
  thickButton.classList.remove("selected");
});

const thickButton = document.createElement("button");
thickButton.innerText = "Thick";
thickButton.classList.add("thin-thick-button");
buttonContainer.append(thickButton);

thickButton.addEventListener("click", () => {
  currentThickness = 5;

  thickButton.classList.add("selected");
  thinButton.classList.remove("selected");
});

const clearButton = document.createElement("button");
clearButton.innerText = "Clear";
buttonContainer.append(clearButton);

clearButton.addEventListener("click", () => {
  commands.splice(0, commands.length);
  redoCommands.splice(0, redoCommands.length);
  notify("drawing-changed");
});

const undoButton = document.createElement("button");
undoButton.innerText = "Undo";
buttonContainer.append(undoButton);

undoButton.addEventListener("click", () => {
  if (commands.length > 0) {
    redoCommands.push(commands.pop()!);
    notify("drawing-changed");
  }
});

const redoButton = document.createElement("button");
redoButton.innerText = "Redo";
buttonContainer.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoCommands.length > 0) {
    commands.push(redoCommands.pop()!);
    notify("drawing-changed");
  }
});

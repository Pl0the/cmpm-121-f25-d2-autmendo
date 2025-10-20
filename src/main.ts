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
  }
}

bus.addEventListener("drawing-changed", redraw);

function tick() {
  redraw();
  requestAnimationFrame(tick);
}
tick();

class MarkerLines implements Drawable {
  points: { x: number; y: number }[] = [];

  constructor(x: number, y: number) {
    this.points.push({ x, y });
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(this.points[0]!.x, this.points[0]!.y);
    for (const point of this.points) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
}

let currentLineCommand: MarkerLines | null = null;

canvas.addEventListener("mousedown", (e) => {
  currentLineCommand = new MarkerLines(e.offsetX, e.offsetY);
  commands.push(currentLineCommand);
  redoCommands.splice(0, redoCommands.length);
  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  if (e.buttons == 1 && currentLineCommand) {
    currentLineCommand.drag(e.offsetX, e.offsetY);
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", () => {
  currentLineCommand = null;
  notify("drawing-changed");
});

const clearButton = document.createElement("button");
clearButton.innerText = "Clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  commands.splice(0, commands.length);
  redoCommands.splice(0, redoCommands.length);
  notify("drawing-changed");
});

const undoButton = document.createElement("button");
undoButton.innerText = "Undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (commands.length > 0) {
    redoCommands.push(commands.pop()!);
    notify("drawing-changed");
  }
});

const redoButton = document.createElement("button");
redoButton.innerText = "Redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoCommands.length > 0) {
    commands.push(redoCommands.pop()!);
    notify("drawing-changed");
  }
});

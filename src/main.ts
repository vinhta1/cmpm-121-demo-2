import "./style.css";

const APP_NAME = "Sketch-a-Stick";
const app = document.querySelector<HTMLDivElement>("#app")!;
const canvasArea = <HTMLDivElement> document.getElementById("canvasArea");
document.title = APP_NAME;
const appTitle = document.createElement("h1");
appTitle.innerHTML = APP_NAME;

//Canvas
const canvas = <HTMLCanvasElement> document.getElementById("canvas");
const context = <CanvasRenderingContext2D> canvas.getContext("2d");

//Line arrays
interface point {
    x: number,
    y: number
}
const lines: point[][] = [];
const redoLines: point[][] = [];

let currentLine: point[] = [];

//Mouse drawing, yoinked from https://quant-paint.glitch.me/paint0.html
const cursor = {active: false, x: 0, y: 0}
const drawingChanged = new Event("drawing-changed");

canvas?.addEventListener("mousedown", (input) => {
    cursor.active = true;
    cursor.x = input.offsetX; cursor.y = input.offsetY;
    
    currentLine = [];
    lines.push(currentLine);
    currentLine.push({x: cursor.x, y: cursor.y});
    dispatchEvent(drawingChanged);

});
canvas?.addEventListener("mousemove", (input) => {
    if (cursor.active){
        cursor.x = input.offsetX; cursor.y = input.offsetY;
        currentLine.push({x: cursor.x, y: cursor.y});
        dispatchEvent(drawingChanged);
    }
});
addEventListener("mouseup", () => {
    cursor.active = false;
    dispatchEvent(drawingChanged);
});

addEventListener("drawing-changed", ()=>{redraw()});

function redraw(){
    console.log("Redraw");
    context.clearRect(0, 0, canvas?.offsetWidth, canvas?.offsetHeight);
    for (const line of lines){
        context.beginPath();
        const {x, y} = line[0]
        context.moveTo(x, y);
        for (const {x, y} of line){
            context.lineTo(x,y);
        }
    context.stroke();
    }
}

//clear button
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
canvasArea.append(clearButton);

clearButton.addEventListener("click", () => {
    lines.splice(0, lines.length);
    dispatchEvent(drawingChanged);
});


app.append(appTitle);

//Test
for ( let i = 0; i <= 3; i ++){
    let x = i * 10 + 30; let y = i * 30;
    currentLine = [];
    currentLine.push({x,y});
    y *= 2;
    currentLine.push({x,y});
    lines.push(currentLine);
    dispatchEvent(drawingChanged);
}
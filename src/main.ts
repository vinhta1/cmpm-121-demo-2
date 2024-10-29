import "./style.css";

const APP_NAME = "Sketch-a-Stick";
const app = document.querySelector<HTMLDivElement>("#app")!;
const canvasArea = <HTMLDivElement> document.getElementById("canvasArea");
document.title = APP_NAME;
const appTitle = document.createElement("h1");
appTitle.innerHTML = APP_NAME;

//Constants

//The Canvas
const canvas = <HTMLCanvasElement> document.getElementById("canvas");
const context = <CanvasRenderingContext2D> canvas.getContext("2d");


//Mouse drawing, yoinked from https://quant-paint.glitch.me/paint0.html
const cursor = {active: false, x: 0, y: 0}
canvas?.addEventListener("mousedown", (input) => {
    cursor.active = true;
    cursor.x = input.offsetX;
    cursor.y = input.offsetY;
});
canvas?.addEventListener("mousemove", (input) => {
    if (cursor.active){
        context.beginPath();
        context.moveTo(cursor.x, cursor.y);
        context.lineTo(input.offsetX, input.offsetY);
        context.stroke();
        cursor.x = input.offsetX;
        cursor.y = input.offsetY;
    }
});
addEventListener("mouseup", (input) => {
    cursor.active = false;
});

//clear button
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
canvasArea.append(clearButton);

clearButton.addEventListener("click", () => {
    context.clearRect(0, 0, canvas?.offsetWidth, canvas?.offsetHeight);
});

//Main
app.append(appTitle);

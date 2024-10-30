import "./style.css";

const APP_NAME = "Sketch-a-Stick";
const app = document.querySelector<HTMLDivElement>("#app")!;
const canvasArea = <HTMLDivElement> document.getElementById("canvasArea");
const buttonArea = <HTMLDivElement> document.getElementById("buttonArea");
document.title = APP_NAME;
const appTitle = document.createElement("h1");
appTitle.innerHTML = APP_NAME;

//Canvas
const canvas = <HTMLCanvasElement> document.getElementById("canvas");
const context = <CanvasRenderingContext2D> canvas.getContext("2d");

//commands
interface Displayable{
    display(context: CanvasRenderingContext2D): void
}

interface DrawCommand extends Displayable{
    initialPositon: {initialX: number, initialY: number},
    display(context: CanvasRenderingContext2D): void;
}

interface LineCommand extends DrawCommand{
    initialPositon: {initialX: number, initialY: number},
    points: {x: number, y: number}[],
    display(context: CanvasRenderingContext2D): void,
    drag(x: number, y: number): void;
}

const commandArray: Displayable[] = [];
const redoCommandArray: Displayable[] = [];

let currentCommand: Displayable;

//createLineCommand thanks Brace
function createLineCommand(initialX: number, initialY: number, context: CanvasRenderingContext2D): LineCommand{
    const points: {x: number, y: number}[] = [{x: initialX, y: initialY}];

    return {
        initialPositon: {initialX, initialY},
        points,
        display(context): void {
            context.strokeStyle = "black";
            context.lineWidth = 5;
            context.beginPath();
            context.moveTo(initialX,initialY);
            this.points.forEach(point => {
                context.lineTo(point.x, point.y);
            });
            context.stroke();
        },
        drag(x, y){
            this.points.push({x, y});
        }
    };
}

//Mouse drawing, yoinked from https://quant-paint.glitch.me/paint0.html
const cursor = {active: false, x: 0, y: 0}
const drawingChanged = new Event("drawing-changed");

canvas?.addEventListener("mousedown", (input) => {
    cursor.active = true;
    cursor.x = input.offsetX; cursor.y = input.offsetY;
    
    
    redoCommandArray.splice(0,redoCommandArray.length);
    currentCommand = createLineCommand(cursor.x, cursor.y, context);
    commandArray.push(currentCommand);
    dispatchEvent(drawingChanged);

});
canvas?.addEventListener("mousemove", (input) => {
    if (cursor.active){
        cursor.x = input.offsetX; cursor.y = input.offsetY;
        (currentCommand as LineCommand).drag(cursor.x, cursor.y);
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
    
    commandArray.forEach((cmd) => cmd.display(context));
}

//clear button
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
buttonArea.append(clearButton);

clearButton.addEventListener("click", () => {
    commandArray.splice(0, commandArray.length);
    redoCommandArray.splice(0,redoCommandArray.length);
    dispatchEvent(drawingChanged);
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
buttonArea.append(undoButton);

undoButton.addEventListener("click", () => {
    if (commandArray.length > 0){
        redoCommandArray.push(commandArray.pop()!);
        dispatchEvent(drawingChanged);
    }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
buttonArea.append(redoButton);

redoButton.addEventListener("click", () => {
    if (redoCommandArray.length > 0){
        commandArray.push(redoCommandArray.pop()!);
        dispatchEvent(drawingChanged);
    }
});


app.append(appTitle);

//Test
// for ( let i = 0; i <= 3; i ++){
//     let x = i * 10 + 30; let y = i * 30 + 30;
//     currentCommand = [];
//     currentCommand.push({x,y});
//     y *= 2;
//     currentCommand.push({x,y});
//     commandArray.push(currentCommand);
//     dispatchEvent(drawingChanged);
// }
import "./style.css";

const APP_NAME = "Sketch-a-Stick";
const app = document.querySelector<HTMLDivElement>("#app")!;
const canvasArea = <HTMLDivElement> document.getElementById("canvasArea");
const canvasButtons = <HTMLDivElement> document.getElementById("canvasButtons");
const markerButtons = <HTMLDivElement> document.getElementById("markerButtons");
const stickerButtons = <HTMLDivElement> document.getElementById("stickerButtons");
document.title = APP_NAME;
const appTitle = document.createElement("h1");
appTitle.innerHTML = APP_NAME;

//Canvas
const canvas = <HTMLCanvasElement> document.getElementById("canvas");
const context = <CanvasRenderingContext2D> canvas.getContext("2d");

//Variables
let lineWidth: number = 1;
let stickerChoice: string = "";

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

interface StickerCommand extends DrawCommand{
    initialPositon: {initialX: number, initialY: number},
    display(context: CanvasRenderingContext2D): void,
    drag(x: number, y: number): void;
}

interface PreviewCommand extends DrawCommand{
    initialPositon: {initialX: number, initialY: number}
    display(context: CanvasRenderingContext2D): void,
}

const commandArray: Displayable[] = [];
const redoCommandArray: Displayable[] = [];

let currentCommand: Displayable;
let cursorCommand: any = null;

//createLineCommand thanks Brace
function createLineCommand(initialX: number, initialY: number, context: CanvasRenderingContext2D): LineCommand{
    const points: {x: number, y: number}[] = [{x: initialX, y: initialY}];
    const thisLineWidth = lineWidth;

    return {
        initialPositon: {initialX, initialY},
        points,
        display(context): void {
            context.save();
            context.strokeStyle = "black";
            context.lineWidth = thisLineWidth;
            context.beginPath();
            context.moveTo(initialX,initialY);
            this.points.forEach(point => {
                context.lineTo(point.x, point.y);
            });
            context.stroke();
            context.restore();
        },
        drag(x, y){
            this.points.push({x, y});
        }
    };
}

function createStickCommand(initialX: number, initialY: number, context: CanvasRenderingContext2D): StickerCommand{

    return {
        initialPositon: {initialX, initialY},
        display(context): void {
            context.save();
            context.beginPath();
            context.moveTo(initialX,initialY);
            this.points.forEach(point => {
                context.lineTo(point.x, point.y);
            });
            context.stroke();
            context.restore();
        },
        drag(x, y){
            this.points.push({x, y});
        }
    };
}

function createPreviewCommand(initialX: number, initialY: number, context: CanvasRenderingContext2D): PreviewCommand{
    const thisLineWidth = lineWidth;

    return {
        initialPositon: {initialX, initialY},
        display(context): void {
            context.save();
            context.strokeStyle = "black";
            context.lineWidth = thisLineWidth;
            context.fillText(stickerChoice, initialX-thisLineWidth/2,initialY-thisLineWidth/2);
            context.beginPath();
            context.moveTo(initialX-thisLineWidth/2,initialY-thisLineWidth/2);
            context.lineTo(initialX+thisLineWidth/2,initialY+thisLineWidth/2);
            context.stroke();
            context.restore();
        }
    };
}

//Mouse drawing, yoinked from https://quant-paint.glitch.me/paint0.html
const cursor = {active: false, x: 0, y: 0}
const drawingChanged = new Event("drawing-changed");
const toolMoved = new Event("tool-moved");

canvas?.addEventListener("mouseenter", (input) => {

    cursorCommand = createPreviewCommand(input.offsetX, input.offsetY, context);
    dispatchEvent(toolMoved);
});

canvas?.addEventListener("mouseout", () => {
    cursorCommand = null;
    dispatchEvent(toolMoved);

});

canvas?.addEventListener("mousedown", (input) => {
    cursor.active = true;
    cursorCommand = null;
    
    redoCommandArray.splice(0,redoCommandArray.length);
    currentCommand = createLineCommand(input.offsetX, input.offsetY, context);
    commandArray.push(currentCommand);
    dispatchEvent(drawingChanged);

});
canvas?.addEventListener("mousemove", (input) => {
    if (cursor.active){
        (currentCommand as LineCommand).drag(input.offsetX, input.offsetY);
        dispatchEvent(drawingChanged);
    } else {
        cursorCommand = createPreviewCommand(input.offsetX, input.offsetY, context);
        dispatchEvent(toolMoved);
    }
});
addEventListener("mouseup", (input) => {
    cursor.active = false;
    dispatchEvent(drawingChanged);
});



addEventListener("drawing-changed", ()=>{redraw()});
addEventListener("tool-moved", ()=>{redraw()});

function redraw(){
    console.log("Redraw");
    context.clearRect(0, 0, canvas?.offsetWidth, canvas?.offsetHeight);
    
    commandArray.forEach((cmd) => cmd.display(context));

    if (cursorCommand) {cursorCommand.display(context)};
}

//canvas buttons
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
canvasButtons.append(clearButton);

clearButton.addEventListener("click", () => {
    commandArray.splice(0, commandArray.length);
    redoCommandArray.splice(0,redoCommandArray.length);
    dispatchEvent(drawingChanged);
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
canvasButtons.append(undoButton);

undoButton.addEventListener("click", () => {
    if (commandArray.length > 0){
        redoCommandArray.push(commandArray.pop()!);
        dispatchEvent(drawingChanged);
    }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
canvasButtons.append(redoButton);

redoButton.addEventListener("click", () => {
    if (redoCommandArray.length > 0){
        commandArray.push(redoCommandArray.pop()!);
        dispatchEvent(drawingChanged);
    }
});

//marker buttons
const thinMarker = document.createElement("button");
thinMarker.innerHTML = "thin";
markerButtons.append(thinMarker);

thinMarker.addEventListener("click", () => {
    lineWidth = 1;
    stickerChoice = "";
});

const thickMarker = document.createElement("button");
thickMarker.innerHTML = "thick";
markerButtons.append(thickMarker);

thickMarker.addEventListener("click", () => {
    lineWidth = 5;
    stickerChoice = "";
});

//sticker buttons
const stickerArray: any = [];
function createSticker(sticker: string, effect: (any) => void) {   //create a new sticker function
    const newSticker = document.createElement("button");
    newSticker.innerHTML = sticker;
    stickerButtons.append(newSticker);

    newSticker.addEventListener("click", effect);

    return newSticker;
}

for (let i = 0; i < 3; i++){
    let stickers = ["👁️", "👄","🥚"];
    stickerArray[0] = createSticker(stickers[i],
        () => {
            stickerChoice = stickers[i];
            dispatchEvent(toolMoved);
        }
    );
}


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
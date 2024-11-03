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
let commandFlag = 0;

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

function createStickerCommand(initialX: number, initialY: number, context: CanvasRenderingContext2D): StickerCommand{
    const thisStickerChoice = stickerChoice;
    let theta = 0;
    let width = context.measureText(thisStickerChoice).width;
    let height = context.measureText(thisStickerChoice).actualBoundingBoxAscent - context.measureText(thisStickerChoice).actualBoundingBoxDescent
    let thisInitX = initialX - width;
    let thisInitY = initialY;

    return {
        initialPositon: {initialX, initialY},
        display(context): void {
            context.save();
            context.translate(thisInitX + width/2, thisInitY - height/2)
            context.rotate(theta);
            context.translate(-(thisInitX + width/2), -(thisInitY - height/2))
            context.fillText(thisStickerChoice, thisInitX, thisInitY);
            context.restore();
        },
        drag(x, y){
            theta = Math.atan2(y - initialY, x - initialX) + Math.PI/2;
        }
    };
}

function createPreviewCommand(initialX: number, initialY: number, context: CanvasRenderingContext2D): PreviewCommand{
    const thisLineWidth = lineWidth; 
    const thisStickerChoice = stickerChoice;
    let width = context.measureText(thisStickerChoice).width;
    let thisInitX = initialX - width;
    let thisInitY = initialY;

    return {
        initialPositon: {initialX, initialY},
        display(context): void {
            context.save();
            context.strokeStyle = "black";
            context.lineWidth = thisLineWidth;
            context.fillText(thisStickerChoice, thisInitX, thisInitY);
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
    switch (commandFlag){
        case 0:
            currentCommand = createLineCommand(input.offsetX, input.offsetY, context);
            break;
        case 1:
            currentCommand = createStickerCommand(input.offsetX, input.offsetY, context);
            break;
    }
    commandArray.push(currentCommand);
    dispatchEvent(drawingChanged);

});
canvas?.addEventListener("mousemove", (input) => {
    if (cursor.active){
        cursor.x = input.offsetX; cursor.y = input.offsetY;
        switch (commandFlag){
            case 0:
                (currentCommand as LineCommand).drag(input.offsetX, input.offsetY);
                break;
            case 1:
                (currentCommand as StickerCommand).drag(input.offsetX, input.offsetY);
                break;
        }
        dispatchEvent(drawingChanged);
    } else {
        cursorCommand = createPreviewCommand(input.offsetX, input.offsetY, context);
        dispatchEvent(toolMoved);
    }
});
addEventListener("mouseup", (input) => {
    cursor.active = false;
    context.resetTransform();
    dispatchEvent(drawingChanged);
});



addEventListener("drawing-changed", ()=>{redraw()});
addEventListener("tool-moved", ()=>{redraw()});

function redraw(){
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
const markerArray: any = [];
function createMarker(name: string, effect: (any) => void) {   //create a new sticker function
    const newMarker = document.createElement("button");
    newMarker.innerHTML = name;
    markerButtons.append(newMarker);

    newMarker.addEventListener("click", effect);

    return newMarker;
}

const markers = [
    {name: "thin", effect: () => {lineWidth = 1; stickerChoice = ""; commandFlag = 0;}},
    {name: "thick", effect: () => {lineWidth = 5; stickerChoice = ""; commandFlag = 0;}}
]

markers.forEach((marker)=>{
    markerArray.push(createMarker(marker.name, marker.effect));
})

//sticker buttons
const stickerArray: any = [];
function createSticker(sticker: string, effect: (any) => void) {   //create a new sticker function
    const newSticker = document.createElement("button");
    newSticker.innerHTML = sticker;
    stickerButtons.append(newSticker);

    newSticker.addEventListener("click", effect);

    return newSticker;
}

const stickers = [ //not sure why I have to hard set stickerChoice
    {sticker: "👁️", effect: () => {stickerChoice = "👁️"; lineWidth = 0; commandFlag = 1;}},
    {sticker: "👄", effect: () => {stickerChoice = "👄"; lineWidth = 0; commandFlag = 1;}},
    {sticker: "🥚", effect: () => {stickerChoice = "🥚"; lineWidth = 0; commandFlag = 1;}},
    ];

stickers.forEach((stick)=>{
    stickerArray.push(createSticker(stick.sticker, stick.effect));
})


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
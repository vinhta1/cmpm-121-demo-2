import "./style.css";

const APP_NAME = "Sketch-a-Stick";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
const appTitle = document.createElement("h1");
appTitle.innerHTML = APP_NAME;

//Constants


//The Canvas
    function draw(){
    const canvas = document.getElementById("canvas");
    if (canvas.getContext){
        const context = canvas.getContext("2d");
    }
}

//Main
draw();
app.append(appTitle);

import './style.css';
import { Scene } from "./scene.js";
import { Renderer } from './renderer.js';

function connect(value: Response)
{
    const ws = new WebSocket('wss://' + window.location.host);
    ws.addEventListener('open', function(event)
    {
        ws.send('Hello Server!');
    });
    ws.addEventListener('message', function(event)
    {
        console.log('Message from server: ', event.data);
    });
    ws.addEventListener('error', function(event)
    {
        console.log(event);
    });
    ws.addEventListener('close', function(event)
    {
        console.log('Connection closed', event.code, event.reason, event.wasClean);
    });
}

function login()
{
    fetch('/login', { method: 'POST', credentials: 'same-origin' })
        .then(connect);
}

function main()
{
    const canvasDiv = document.createElement('div');
    const canvas = document.createElement('canvas');
    canvas.id = 'game-window';
    canvas.width = 1920;
    canvas.height = 1080;
    canvasDiv.appendChild(canvas);
    document.body.appendChild(canvasDiv);


    const scene: Scene = new Scene();
    
    const renderer = new Renderer(canvas, scene);
    
    renderer.Initialize()
        .then(() => {
            login();
        });
}

window.onload = main;
import './style.css';
import { Scene as Scene2d } from './2d/scene.js';
import { Renderer as Renderer2d } from './2d/renderer.js';
import { Title as Title } from './title.js';
//import { Scene as Scene3d } from './3d/scene.js';
//import { Renderer as Renderer3d } from './3d/renderer.js';
import titleImg from '../media/title.png';

var device: GPUDevice;
var context: GPUCanvasContext;

var title: Title;
var scene: Scene2d;
var renderer: Renderer2d;

function connect()
{
    const ws = new WebSocket('wss://' + window.location.host);
    ws.addEventListener('open', function(event)
    {
        ws.send('Hello Server!');
        window.addEventListener("keydown", event =>
        {
            if(event.key == 'ArrowUp' || event.key == 'w' || event.key == 'W')
                ws.send('W');
            else if(event.key == 'ArrowDown' || event.key == 's' || event.key == 'S')
                ws.send('S');
            else if(event.key == 'ArrowLeft' || event.key == 'a' || event.key == 'A')
                ws.send('A');
            else if(event.key == 'ArrowRight' || event.key == 'd' || event.key == 'D')
                ws.send('D');
        });
    });
    ws.addEventListener('message', function(event)
    {
        // console.log('Message from server: ', event.data);
        let renderData: RenderData;
        try
        {
            renderData = <RenderData>JSON.parse(event.data);
        }
        catch
        {
            console.log("Not JSON");
            return;
        }
        if(renderData.message === 'Player 0')
        {
            console.log("I am Player 1");
            renderer.setPlayer(0);
            renderer.render();
        }
        else if(renderData.message === 'Player 1')
        {
            console.log('I am Player 2');
            renderer.setPlayer(1);
            renderer.render();
        }
        else if(renderData.message === 'renderData')
        {
            scene.set(renderData);
        }
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

async function initialize(canvas: HTMLCanvasElement)
{
    if(!('gpu' in navigator))
        throw 'No webGPU!';
    const adapter: GPUAdapter = <GPUAdapter>await navigator.gpu?.requestAdapter();
    if(adapter === null)
        throw 'No adapter!';
    device = <GPUDevice>await adapter?.requestDevice();
    console.log(device);

    context = <GPUCanvasContext>canvas.getContext("webgpu");
    context.configure({
        device: device,
        format: "bgra8unorm",
        alphaMode: "opaque"
    });
}

async function login()
{
    await fetch('/login', { method: 'POST', credentials: 'same-origin' });
    connect();
}

async function main()
{
    var meta = document.createElement('meta');
    meta.httpEquiv = "origin-trial";
    meta.content = "AifDXz6Baft5VffNQoN10WMq4EpmwWAkdtyo+wvoS4uxTh51wM6Tdu0/eUJcPT8bkV/5fVM/6JfOvnsvbGg8NwkAAABQeyJvcmlnaW4iOiJodHRwczovL3ZleGlvbmEubmdyb2suaW86NDQzIiwiZmVhdHVyZSI6IldlYkdQVSIsImV4cGlyeSI6MTY3NTIwOTU5OX0=";
    document.getElementsByTagName('head')[0].appendChild(meta);

    const canvasDiv = document.createElement('div');
    const canvas = document.createElement('canvas');
    canvas.id = 'game-window';
    canvas.width = 1920;
    canvas.height = 1080;
    // const canvas2d = document.createElement('canvas');
    // canvas2d.width = 1920;
    // canvas2d.height = 1080;
    canvasDiv.appendChild(canvas);
    //canvasDiv.appendChild(canvas2d);
    document.body.appendChild(canvasDiv);

    // const canvas2dctx = canvas2d.getContext("2d");
    // if(canvas2dctx === null) return;
    // canvas2dctx.font = "bold 48px serif";
    // canvas2dctx.fillStyle = "blue";
    // canvas2dctx.fillText("Hello World!", 10, 10);

    await initialize(canvas);

    scene = new Scene2d();

    title = new Title();
    title.create_title();

    renderer = new Renderer2d(device, context, scene);

    await renderer.initialize();
    await login();
}

window.onload = main;
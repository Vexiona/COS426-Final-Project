import './style.css';
import title from '../media/title.png';

export class Title
{
    create_title()
    {
        var img = document.createElement("img");
        img.src = title;
        img.width = 1280;
        img.height = 720;
        var src = document.body;
        src!.appendChild(img);
        var x = document.getElementById("game-window");
        x!.style.display = "none";
        document.addEventListener("click", this.requestFullScreen)
    }

    requestFullScreen() {
        // Supports most browsers and their versions.
        var element: any = document.body;
        var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;
    
        if (requestMethod) { // Native full screen.
            requestMethod.call(element);
        } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
            var wscript = new ActiveXObject("WScript.Shell");
            if (wscript !== null) {
                wscript.SendKeys("{F11}");
            }
        }
        var x = document.getElementById("game-window");
        x!.style.display = "block";
        document.removeEventListener('click', this.requestFullScreen);
        let mySound = new Audio("../media/sounds/flutefleet.mp3");
        mySound.play();
    }
}

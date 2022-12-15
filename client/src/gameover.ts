import './style.css';

function main()
{
    var meta = document.createElement('meta');
    meta.httpEquiv = "origin-trial";
    meta.content = "AifDXz6Baft5VffNQoN10WMq4EpmwWAkdtyo+wvoS4uxTh51wM6Tdu0/eUJcPT8bkV/5fVM/6JfOvnsvbGg8NwkAAABQeyJvcmlnaW4iOiJodHRwczovL3ZleGlvbmEubmdyb2suaW86NDQzIiwiZmVhdHVyZSI6IldlYkdQVSIsImV4cGlyeSI6MTY3NTIwOTU5OX0=";
    document.getElementsByTagName('head')[0].appendChild(meta);
    
    var img = document.createElement("img");
    img.src = "https://ibb.co/HKGHjzb";
    img.width = 1920;
    img.height = 1080;
    var src = document.getElementById("header");
    src!.appendChild(img);
}

window.onload = main;
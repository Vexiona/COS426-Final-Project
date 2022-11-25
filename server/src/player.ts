import WebSocket from "ws";
import { GameLobby } from "./globby";

export class Player
{
    readonly userId: string;
    private ws: WebSocket.WebSocket;

    constructor(userId: string, ws: WebSocket.WebSocket)
    {
        this.userId = userId;
        this.ws = ws;
    }

    validate(): boolean
    {
        const state = this.ws.readyState;
        if(state === undefined || state == WebSocket.CLOSED || state == WebSocket.CLOSING)
            return false;
        else if(state == WebSocket.CONNECTING)
        {
            console.log("Something went terribly wrong. Code: 06499637441373781090");
            this.ws.close();
            return false;
        }
        return true;
    }

    send(data: any)
    {
        if(this.validate())
            this.ws.send(data);
    }
}
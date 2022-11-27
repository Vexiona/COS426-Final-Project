import WebSocket from "ws";

export class Player
{
    readonly userId: string;
    private ws: WebSocket.WebSocket;

    public lastKey: any = undefined;
    public lastKeyTime: number = 0;

    constructor(userId: string, ws: WebSocket.WebSocket)
    {
        this.userId = userId;
        this.ws = ws;
        ws.on('message', (data: WebSocket.RawData) =>
        {
            if((<Buffer>data)[0] === 'W'.charCodeAt(0))
            {
                this.lastKey = 0;
                this.lastKeyTime = performance.now();
            }
            else if((<Buffer>data)[0] === 'S'.charCodeAt(0))
            {
                this.lastKey = 1;
                this.lastKeyTime = performance.now();
            }
            else if((<Buffer>data)[0] === 'A'.charCodeAt(0))
            {
                this.lastKey = 2;
                this.lastKeyTime = performance.now();
            }
            else if((<Buffer>data)[0] === 'D'.charCodeAt(0))
            {
                this.lastKey = 3;
                this.lastKeyTime = performance.now();
            }
        })
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
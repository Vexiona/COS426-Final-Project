import { IncomingMessage } from "http";
import internal from "stream";
import { GameQueue } from "./gqueue.js";
import { GameSocketServer } from "./gss.js";

export class GameServer
{
    private gss: GameSocketServer;
    private queue: GameQueue;

    constructor()
    {
        this.gss = new GameSocketServer(this);
        this.queue = new GameQueue(this);
    }

    newId(): string
    {
        return this.gss.newId();
    }

    addPlayer(req: IncomingMessage, socket: internal.Duplex, head: Buffer, userId: string): void
    {
        this.gss.addConnection(req, socket, head, userId);
    }

    queueUp(value: queueObject): void
    {
        this.queue.newPlayer(value);
    }
}
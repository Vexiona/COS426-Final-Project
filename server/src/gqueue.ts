import { DLL } from './dll.js';
import { GameServer } from './gserver.js';
import { validateWs } from './gss.js';

export class GameQueue
{
    static count: number = 2;

    private queue: DLL;
    private gs: GameServer;
    constructor(gs: GameServer)
    {
        this.queue = new DLL();
        this.gs = gs;
        const intervalId = setInterval(this.attemptMakeLobby, 2000);
    }

    newPlayer(value: queueObject): void
    {
        this.queue.push_back(value);
    }

    attemptMakeLobby: () => void = () =>
    {
        console.log(this.queue.getSize);
        const people = [];
        const it = new DLL.iterator(this.queue);
        it.setFront();
        while(!it.atBack())
        {
            const value: queueObject = <queueObject>it.get();
            if(validateWs(value.ws))
            {
                people.push(value.userId);
                if(people.length == GameQueue.count)
                {
                    console.log("yay");
                }
            }
            else it.pop(true);
            it.next();
        }
    };
}
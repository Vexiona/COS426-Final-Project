import { Player } from "./player.js";

export class Game
{
    private players: Player[];

    private characters: Position[];
    private lastPhyUpdate: number;

    constructor(players: Player[])
    {
        this.players = players;
        this.characters = [];
        for(let i = 0; i < this.players.length; i++)
            this.characters[i] = { x: 0, y: 0 };
        this.lastPhyUpdate = performance.now();
    }

    physics(): RenderData
    {
        let time: number = performance.now();
        for(let i = 0; i < this.players.length; i++)
        {
            if(time - this.players[i].lastKeyTime >= 50) continue;
            if(this.players[i].lastKey === 0)      //w
                this.characters[i].y += 0.1;
            else if(this.players[i].lastKey === 1) //s
                this.characters[i].y -= 0.1;
            else if(this.players[i].lastKey === 2) //a
                this.characters[i].x -= 0.1;
            else if(this.players[i].lastKey === 3) //d
                this.characters[i].x += 0.1;
        }

        this.lastPhyUpdate = time;
        return <RenderData>{
            message: "renderData",
            player1: this.characters[0],
            player2: this.characters[1],
        };
    }
}
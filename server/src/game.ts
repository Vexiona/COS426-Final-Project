import { Player } from "./player.js";
import { CharacterData } from "./character.js";

export class Game
{
    private static CHAR_HORIZ_SPEED: number = 20;
    private static GRAVITY: number = -1;
    private static MAX_VERT_SPEED: number = 5;
    private static HORIZ_DECELERATION_FACTOR = 1.05;

    private players: Player[];

    private characters: CharacterData[];
    private lastPhyUpdate: number;

    constructor(players: Player[])
    {
        this.players = players;
        this.characters = [];
        for(let i = 0; i < this.players.length; i++)
            this.characters[i] = new CharacterData();
        this.lastPhyUpdate = performance.now();
    }

    physics(): RenderData
    {
        let time: number = performance.now();
        let t: number = (time - this.lastPhyUpdate) / 1000;
        for(let i = 0; i < this.players.length; i++)
        {
            //if(time - this.players[i].lastKeyTime >= 50) continue;
            /*if(this.players[i].lastKey === 0) //w
                this.characters[i].pos.y += 0.1;
            else if(this.players[i].lastKey === 1) //s
                this.characters[i].pos.y -= 0.1;
            else if(this.players[i].lastKey === 2) //a
                this.characters[i].pos.x -= 0.1;
            else if(this.players[i].lastKey === 3) //d
                this.characters[i].pos.x += 0.1;*/
            if(this.characters[i].grounded)
            {
                if(this.players[i].lastDirKeyIsDown === true)
                {
                    if(this.players[i].lastDirKey === 2) //a
                        this.characters[i].v[0] = -Game.CHAR_HORIZ_SPEED;
                    else if(this.players[i].lastDirKey === 3) //d
                        this.characters[i].v[0] = Game.CHAR_HORIZ_SPEED;
                    this.characters[i].facing = this.players[i].lastDirKey;
                }
                else
                {
                    this.characters[i].v[0] /= Game.HORIZ_DECELERATION_FACTOR;
                }
                this.characters[i].pos[0] += this.characters[i].v[0] * t;
            }
            else
            {
                this.characters[i].v[2] += Game.GRAVITY * t;
                if(this.characters[i].v[2] > Game.MAX_VERT_SPEED)
                    this.characters[i].v[2] = -Game.MAX_VERT_SPEED;
                if(this.players[i].lastDirKeyIsDown === true)
                {
                    if(this.players[i].lastDirKey === 2) //a
                        this.characters[i].v[0] = -Game.CHAR_HORIZ_SPEED;
                    else if(this.players[i].lastDirKey === 3) //d
                        this.characters[i].v[0] = Game.CHAR_HORIZ_SPEED;
                    this.characters[i].facing = this.players[i].lastDirKey;
                }
                this.characters[i].pos[0] += this.characters[i].v[0] * t;
                this.characters[i].pos[2] += this.characters[i].v[2] * t;
            }
        }

        this.lastPhyUpdate = time;
        return <RenderData>{
            message: "renderData",
            time: time,
            player1: {
                pos: this.characters[0].pos,
                facing: this.characters[0].facing
            },
            player2: {
                pos: this.characters[1].pos,
                facing: this.characters[1].facing
            }
        };
    }
}
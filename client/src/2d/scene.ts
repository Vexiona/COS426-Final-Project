import { Character } from "../character.js";
import { Gems } from "../gems.js";
import { Camera } from "../camera.js";

export class Scene
{
    readonly characters: Character[]
    readonly gems: Gems[]
    readonly camera: Camera

    time: number;

    constructor() {

        this.time = 0;
        this.characters = new Array(2);
        this.gems = new Array(10);
        for(let i=0; i < this.characters.length; i++)
        {
            const center: number[] = [
                0.0,
                0.0,
                0.0
            ];

            const radius: number = 1.0;

            const color: number[] = [
                0.3 + 0.7 * Math.random(),
                0.3 + 0.7 * Math.random(),
                0.3 + 0.7 * Math.random()
            ];

            this.characters[i] = new Character(center);
        }
        for(let i=0; i < this.gems.length; i++)
        {
            const center: number[] = [
                Math.random(),
                Math.random(),
                Math.random()
            ];

            this.gems[i] = new Gems(center);
        }


        this.camera = new Camera([0.0, -10.0, 0.0]);
    }

    set(renderData: RenderData)
    {
        this.characters[0].pos[0] = renderData.player1!.pos[0];
        this.characters[0].pos[1] = renderData.player1!.pos[1];
        this.characters[0].pos[2] = renderData.player1!.pos[2];
        this.characters[0].facing = renderData.player1!.facing;
        this.characters[1].pos[0] = renderData.player2!.pos[0];
        this.characters[1].pos[1] = renderData.player2!.pos[1];
        this.characters[1].pos[2] = renderData.player2!.pos[2];
        this.characters[1].facing = renderData.player2!.facing;
        this.time = renderData.time!;
    }
}
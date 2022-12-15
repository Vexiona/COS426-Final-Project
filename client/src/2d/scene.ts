import { Character } from "./character.js";
import { Camera } from "./camera.js";

export class Scene
{
    readonly characters: Character[]
    readonly camera: Camera

    time: number;

    constructor() {

        this.time = 0;
        this.characters = new Array(2);
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

        this.camera = new Camera([0.0, -10.0, 0.0]);
    }

    set(renderData: RenderData)
    {
        this.characters[0].pos[0] = renderData.player1!.pos.x;
        this.characters[0].pos[1] = renderData.player1!.pos.y;
        this.characters[0].pos[2] = renderData.player1!.pos.z;
        this.characters[0].facing = renderData.player1!.facing;
        this.characters[1].pos[0] = renderData.player2!.pos.x;
        this.characters[1].pos[1] = renderData.player2!.pos.y;
        this.characters[1].pos[2] = renderData.player2!.pos.z;
        this.characters[1].facing = renderData.player2!.facing;
        this.time = renderData.time!;
    }
}
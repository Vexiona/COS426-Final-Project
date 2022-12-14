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

            this.characters[i] = new Character(center, color);
        }

        this.camera = new Camera([0.0, -10.0, 0.0]);
    }

    set(renderData: RenderData)
    {
        this.characters[0].position[0] = renderData.player1!.x;
        this.characters[0].position[1] = renderData.player1!.y;
        this.characters[0].position[2] = renderData.player1!.z;
        this.characters[1].position[0] = renderData.player2!.x;
        this.characters[1].position[1] = renderData.player2!.y;
        this.characters[1].position[2] = renderData.player2!.z;
        this.time = renderData.time!;
    }
}
export class Character
{
    pos: Float32Array
    facing: number = 3;

    constructor(position: number[])
    {
        this.pos = new Float32Array(position);
    }
}
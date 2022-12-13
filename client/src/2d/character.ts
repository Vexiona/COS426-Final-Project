export class Character
{
    position: Float32Array
    color: Float32Array

    constructor(center: number[], color: number[])
    {
        this.position = new Float32Array(center);
        this.color = new Float32Array(color);
    }
}
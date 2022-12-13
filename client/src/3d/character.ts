export class Character
{
    position: Float32Array;
    radius: number;
    color: Float32Array;

    constructor(center: number[], radius: number, color: number[])
    {
        this.position = new Float32Array(center);
        this.radius = radius;
        this.color = new Float32Array(color);
    }
}
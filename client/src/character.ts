export class Character
{
    pos: number[];
    facing: number = 3;

    constructor(position: number[])
    {
        this.pos = position;
    }
}
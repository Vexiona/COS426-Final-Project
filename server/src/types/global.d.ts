interface Position
{
    x: number;
    y: number;
    z: number;
}

interface Character
{
    pos: Position;
    facing: number;
}

interface RenderData
{
    message?: string;
    time?: number;
    player1?: Character;
    player2?: Character;
}
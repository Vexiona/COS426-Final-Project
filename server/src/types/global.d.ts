interface Character
{
    pos: number[];
    facing: number;
}

interface RenderData
{
    message?: string;
    time?: number;
    player1?: Character;
    player2?: Character;
}
interface Position
{
    x: number;
    y: number;
    z: number;
}

interface RenderData
{
    message?: string;
    time?: number;
    player1?: Position;
    player2?: Position;
}
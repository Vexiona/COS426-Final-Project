interface Position
{
    x: number;
    y: number;
    z: number;
}

interface CharacterData
{
    pos: Position;
    facing: number;
}

interface RenderData
{
    message?: string;
    time?: number;
    player1?: CharacterData;
    player2?: CharacterData;
}
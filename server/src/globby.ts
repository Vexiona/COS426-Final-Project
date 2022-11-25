import { Player } from "./player.js";
import { Game } from "./game.js";

declare type GameState = 0 | 1 | 2;

export class GameLobby
{
    public static DEAD: GameState = 0;
    public static ACTIVE: GameState = 1;
    public static PAUSED: GameState = 2;

    private state: GameState;
    private players: Player[];

    private game: Game;

    constructor(people: Player[])
    {
        this.state = GameLobby.ACTIVE;
        this.players = people;

        this.game = new Game();
        for(let i=0; i<people.length; i++)
            people[i].send("Player " + i);
    }

    getState(): GameState
    {
        return this.state;
    }

    attemptRejoin(player: Player, pno: number): boolean
    {
        if(this.state == GameLobby.DEAD)
            return false;
        if(this.players[pno].validate())
            return false;
        this.players[pno] = player;
        player.send("Player " + pno);
        return true;
    }

    gameTick(): void
    {
        const renderData: string = JSON.stringify(this.game.physics());
        for(let i=0; i<this.players.length; i++)
        {
            this.players[i].send(renderData);
        }
    }
}
import math from 'mathjs';

import { Player } from "./player.js";
import { CharacterData } from "./character.js";
import { Level } from './2d/level.js';
import { GemData } from './gems.js';

export class Game
{
    private static EPS = 1e-4;
    private static INFINITY = 100000.0;

    private static CHAR_HORIZ_SPEED = 10;
    private static GRAVITY = -25;
    private static CHAR_MAX_VERT_SPEED = 20;
    private static CHAR_GROUNDED_HORIZ_DECELERATION_FACTOR = 1.2;
    private static CHAR_JUMP_VERT_SPEED = 10;
    private static MAX_AIRBORNE_HORIZ_SPEED = 5;
    private static CHAR_AIRBORNE_HORIZ_ACC = 100;

    private players: Player[];

    private characters: CharacterData[];
    private gems: GemData[];
    private lastPhyUpdate: number;

    constructor(players: Player[])
    {
        this.players = players;
        this.characters = [];
        for(let i = 0; i < this.players.length; i++)
            this.characters[i] = new CharacterData();
        this.lastPhyUpdate = performance.now();
        // Update this with real gem positions?
        this.gems = []
        for(let i = 0; i < 10; i++)
            this.gems[i] = new GemData([Math.random(), Math.random(), Math.random()]);
    }

    // Is this right??? ALSO it is untested and have to pass data to client
    private intersect_gems(real_pos: number[])
    {
        for (let i = 0; i < this.gems.length; i++) {
            const gemPos = this.gems[i].pos;
            if (Math.pow(gemPos[0] - real_pos[0], 2) + Math.pow(gemPos[1] - real_pos[1], 2) +
                Math.pow(gemPos[2] - real_pos[2], 2) <= 100) return true;
        }
        return false;
    }

    private intersect_right(real_pos: number[])
    {
        let closest_intersect_idx: number = -1;
        let closest_intersect: number[] = [Game.INFINITY, 0.0, 0.0];
        for(let i = 0; i < Level.colliders.length; i++)
        {
            let l = Level.colliders[i].handles[4 * 1 + 2] - Level.colliders[i].handles[4 * 0 + 2];
            if(Level.colliders[i].info[0] == 1)
            {
                if(Math.abs(l) < Game.EPS)
                {
                    continue;
                }
                let t = (real_pos[2] - Level.colliders[i].handles[4 * 0 + 2]) / l;
                if(t < 0 || t > 1)
                {
                    continue;
                }
                let intersect = [
                    (1 - t) * Level.colliders[i].handles[4 * 0 + 0] + t * Level.colliders[i].handles[4 * 1 + 0],
                    (1 - t) * Level.colliders[i].handles[4 * 0 + 1] + t * Level.colliders[i].handles[4 * 1 + 1],
                    (1 - t) * Level.colliders[i].handles[4 * 0 + 2] + t * Level.colliders[i].handles[4 * 1 + 2],
                ];
                if(intersect[0] > real_pos[0] && intersect[0] < closest_intersect[0])
                {
                    closest_intersect_idx = i;
                    closest_intersect = intersect;
                }
            }
        }
        if(closest_intersect_idx != -1)
        {
            let slope = [
                Level.colliders[closest_intersect_idx].handles[4 * 1 + 0] - Level.colliders[closest_intersect_idx].handles[4 * 0 + 0],
                Level.colliders[closest_intersect_idx].handles[4 * 1 + 1] - Level.colliders[closest_intersect_idx].handles[4 * 0 + 1],
                Level.colliders[closest_intersect_idx].handles[4 * 1 + 2] - Level.colliders[closest_intersect_idx].handles[4 * 0 + 2]
            ];
            let dir = [1.0, 0.0, 0.0];
            if(dir[2] * slope[0] - dir[0] * slope[2] < 0)
            {
                return true;
            }
        }
        return false;
    }

    private intersect_up(real_pos: number[])
    {
        let closest_intersect_idx: number = -1;
        let closest_intersect: number[] = [0.0, 0.0, Game.INFINITY];
        for(let i = 0; i < Level.colliders.length; i++)
        {
            let l = Level.colliders[i].handles[4 * 1 + 0] - Level.colliders[i].handles[4 * 0 + 0];
            if(Level.colliders[i].info[0] == 1)
            {
                if(Math.abs(l) < Game.EPS)
                {
                    continue;
                }
                let t = (real_pos[0] - Level.colliders[i].handles[4 * 0 + 0]) / l;
                if(t < 0 || t > 1)
                {
                    continue;
                }
                let intersect = [
                    (1 - t) * Level.colliders[i].handles[4 * 0 + 0] + t * Level.colliders[i].handles[4 * 1 + 0],
                    (1 - t) * Level.colliders[i].handles[4 * 0 + 1] + t * Level.colliders[i].handles[4 * 1 + 1],
                    (1 - t) * Level.colliders[i].handles[4 * 0 + 2] + t * Level.colliders[i].handles[4 * 1 + 2],
                ];
                if(intersect[2] > real_pos[2] && intersect[2] < closest_intersect[2])
                {
                    closest_intersect_idx = i;
                    closest_intersect = intersect;
                }
            }
        }
        if(closest_intersect_idx != -1)
        {
            let slope = [
                Level.colliders[closest_intersect_idx].handles[4 * 1 + 0] - Level.colliders[closest_intersect_idx].handles[4 * 0 + 0],
                Level.colliders[closest_intersect_idx].handles[4 * 1 + 1] - Level.colliders[closest_intersect_idx].handles[4 * 0 + 1],
                Level.colliders[closest_intersect_idx].handles[4 * 1 + 2] - Level.colliders[closest_intersect_idx].handles[4 * 0 + 2]
            ];
            let dir = [0.0, 0.0, 1.0];
            if(dir[2] * slope[0] - dir[0] * slope[2] < 0)
            {
                return true;
            }
        }
        return false;
    }

    physics(): RenderData
    {
        let time: number = performance.now();
        let t: number = (time - this.lastPhyUpdate) / 1000;
        for(let i = 0; i < this.players.length; i++)
        {
            //if(time - this.players[i].lastKeyTime >= 50) continue;
            /*if(this.players[i].lastKey === 0) //w
                this.characters[i].pos.y += 0.1;
            else if(this.players[i].lastKey === 1) //s
                this.characters[i].pos.y -= 0.1;
            else if(this.players[i].lastKey === 2) //a
                this.characters[i].pos.x -= 0.1;
            else if(this.players[i].lastKey === 3) //d
                this.characters[i].pos.x += 0.1;*/
            if(this.players[i].pendingJump)
            {
                if(this.characters[i].grounded)
                {
                    this.characters[i].v[2] = Game.CHAR_JUMP_VERT_SPEED;
                    this.characters[i].grounded = false;
                }
                this.players[i].pendingJump = false;
            }
            if(this.characters[i].grounded)
            {
                if(this.players[i].lastDirKeyIsDown === true)
                {
                    if(this.players[i].lastDirKey === 2) //a
                        this.characters[i].v[0] = -Game.CHAR_HORIZ_SPEED;
                    else if(this.players[i].lastDirKey === 3) //d
                        this.characters[i].v[0] = Game.CHAR_HORIZ_SPEED;
                    this.characters[i].facing = this.players[i].lastDirKey;
                }
                else
                {
                    this.characters[i].v[0] /= Game.CHAR_GROUNDED_HORIZ_DECELERATION_FACTOR;
                }
                let new_pos;
                new_pos = [
                    this.characters[i].pos[0],
                    this.characters[i].pos[1],
                    this.characters[i].pos[2]
                ];
                new_pos[0] += this.characters[i].v[0] * t;
                if(!this.intersect_right(new_pos))
                    this.characters[i].pos[0] += this.characters[i].v[0] * t;
                
                new_pos = [
                    this.characters[i].pos[0],
                    this.characters[i].pos[1],
                    this.characters[i].pos[2]
                ];
                new_pos[2] -= 0.05;
                if(!this.intersect_up(new_pos))
                    this.characters[i].grounded = false;
            }
            else
            {
                this.characters[i].v[2] += Game.GRAVITY * t;
                if(this.characters[i].v[2] < -Game.CHAR_MAX_VERT_SPEED)
                    this.characters[i].v[2] = -Game.CHAR_MAX_VERT_SPEED;
                if(this.players[i].lastDirKeyIsDown === true)
                {
                    if(this.characters[i].facing != this.players[i].lastDirKey)
                    {
                        this.characters[i].v[0] = 0;
                    }
                    if(this.players[i].lastDirKey === 2) //a
                    {
                        if(this.characters[i].v[0] > -Game.MAX_AIRBORNE_HORIZ_SPEED)
                        {
                            this.characters[i].v[0] -= Game.CHAR_AIRBORNE_HORIZ_ACC * t;
                            if(this.characters[i].v[0] < -Game.MAX_AIRBORNE_HORIZ_SPEED)
                                this.characters[i].v[0] = -Game.MAX_AIRBORNE_HORIZ_SPEED;
                        }
                    }
                    else if(this.players[i].lastDirKey === 3) //d
                    {
                        if(this.characters[i].v[0] < Game.MAX_AIRBORNE_HORIZ_SPEED)
                        {
                            this.characters[i].v[0] += Game.CHAR_AIRBORNE_HORIZ_ACC * t;
                            if(this.characters[i].v[0] > Game.MAX_AIRBORNE_HORIZ_SPEED)
                                this.characters[i].v[0] = Game.MAX_AIRBORNE_HORIZ_SPEED;
                        }
                    }
                    this.characters[i].facing = this.players[i].lastDirKey;
                }
                let new_pos;
                new_pos = [
                    this.characters[i].pos[0],
                    this.characters[i].pos[1],
                    this.characters[i].pos[2]
                ];
                new_pos[0] += this.characters[i].v[0] * t;
                if(!this.intersect_right(new_pos))
                    this.characters[i].pos[0] += this.characters[i].v[0] * t;
                
                new_pos = [
                    this.characters[i].pos[0],
                    this.characters[i].pos[1],
                    this.characters[i].pos[2]
                ];
                new_pos[2] += this.characters[i].v[2] * t;
                if(this.intersect_up(new_pos))
                    this.characters[i].grounded = true;
                else
                    this.characters[i].pos[2] += this.characters[i].v[2] * t;
                //this.characters[i].pos[0] += this.characters[i].v[0] * t;
                //this.characters[i].pos[2] += this.characters[i].v[2] * t;
                /*if(this.characters[i].pos[2] < 0)
                {
                    this.characters[i].pos[2] = 0;
                    this.characters[i].grounded = true;
                }*/
            }
        }

        this.lastPhyUpdate = time;
        return <RenderData>{
            message: "renderData",
            time: time,
            player1: {
                pos: this.characters[0].pos,
                facing: this.characters[0].facing
            },
            player2: {
                pos: this.characters[1].pos,
                facing: this.characters[1].facing
            }
        };
    }
}
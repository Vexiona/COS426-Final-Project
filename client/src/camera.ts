import { vec3 } from "gl-matrix";

export class Camera
{
    position: Float32Array;
    theta: number;
    phi: number;
    fov: number;
    forward!: Float32Array;
    right!: Float32Array;
    up!: Float32Array;

    constructor(position: number[])
    {
        this.position = new Float32Array(position);
        this.theta = 90.0;
        this.phi = 135.0;
        this.fov = 1.0;

        this.recalculate_vectors();
    }

    recalculate_vectors()
    {
        this.forward = new Float32Array([
            Math.cos(this.theta * Math.PI / 180.0) * Math.sin(this.phi * Math.PI / 180.0),
            Math.sin(this.theta * Math.PI / 180.0) * Math.sin(this.phi * Math.PI / 180.0),
            Math.cos(this.phi * Math.PI / 180.0)
        ]);

        this.right = new Float32Array([0.0, 0.0, 0.0]);
        vec3.cross(this.right, this.forward, [0.0, 0.0, 1.0]);
        this.up = new Float32Array([0.0, 0.0, 0.0]);
        vec3.cross(this.up, this.right, this.forward);
    }
}
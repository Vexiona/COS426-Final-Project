import { Sphere } from "./sphere.js";
import { Camera } from "./camera.js";

export class Scene {

    spheres: Sphere[]
    camera: Camera

    constructor() {

        this.spheres = new Array(2);
        for (let i = 0; i < this.spheres.length; i++) {

            const center: number[] = [
                0.0,
                0.0,
                0.0
            ];

            const radius: number = 1.0;

            const color: number[] = [
                0.3 + 0.7 * Math.random(),
                0.3 + 0.7 * Math.random(),
                0.3 + 0.7 * Math.random()
            ];

            this.spheres[i] = new Sphere(center, radius,color);
        }

        this.camera = new Camera([0.0, -2.0, 0.0]);
    }
}
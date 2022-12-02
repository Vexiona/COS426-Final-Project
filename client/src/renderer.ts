import raytracer_kernel from "./shaders/raytracer.wgsl";
import screen_shader from "./shaders/screen_shader.wgsl";
import { Scene } from "./scene";

export class Renderer
{
    canvas: HTMLCanvasElement;

    scene: Scene;

    device!: GPUDevice;
    context!: GPUCanvasContext;

    color_buffer!: GPUTexture;
    color_buffer_view!: GPUTextureView;
    sampler!: GPUSampler;

    bufferCamera!: GPUBuffer;
    bufferScene!: GPUBuffer;
    bufferLights!: GPUBuffer;
    bufferObjects!: GPUBuffer;

    ray_tracing_pipeline!: GPUComputePipeline;
    ray_tracing_bind_group!: GPUBindGroup;
    screen_pipeline!: GPURenderPipeline;
    screen_bind_group!: GPUBindGroup;

    constructor(canvas: HTMLCanvasElement, scene: Scene)
    {
        this.canvas = canvas;
        this.scene = scene;
    }

    async Initialize()
    {
        await this.setupDevice();
        this.createAssets();
        this.makePipeline();
        this.prepareScene();
        this.render();
    }

    async setupDevice()
    {
        if(!('gpu' in navigator))
            throw 'No webGPU!';
        const adapter: GPUAdapter = <GPUAdapter>await navigator.gpu?.requestAdapter();
        if(adapter === null)
            throw 'No adapter!';
        this.device = <GPUDevice>await adapter?.requestDevice();
        console.log(this.device);

        this.context = <GPUCanvasContext>this.canvas.getContext("webgpu");
        this.context.configure({
            device: this.device,
            format: "bgra8unorm",
            alphaMode: "opaque"
        });

    }

    async createAssets()
    {
        //compute output texture
        this.color_buffer = this.device.createTexture(
            {
                size: {
                    width: this.canvas.width,
                    height: this.canvas.height,
                },
                format: "rgba8unorm",
                usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
            }
        );

        this.color_buffer_view = this.color_buffer.createView();

        this.sampler = this.device.createSampler({
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "nearest",
            mipmapFilter: "nearest",
            maxAnisotropy: 1
        });

        //camera parameters
        this.bufferCamera = this.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        //scene parameters
        this.bufferScene = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        //scene lights
        this.bufferLights = this.device.createBuffer({
            size: 32 * this.scene.spheres.length,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        //scene objects
        this.bufferObjects = this.device.createBuffer({
            size: 32 * this.scene.spheres.length,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
    }

    async makePipeline()
    {
        const ray_tracing_bind_group_layout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "write-only",
                        format: "rgba8unorm",
                        viewDimension: "2d"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                }
            ]
        });

        this.ray_tracing_bind_group = this.device.createBindGroup({
            layout: ray_tracing_bind_group_layout,
            entries: [
                {
                    binding: 0,
                    resource: this.color_buffer_view
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.bufferCamera,
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.bufferScene,
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: this.bufferLights,
                    }
                },
                {
                    binding: 4,
                    resource: {
                        buffer: this.bufferObjects,
                    }
                }
            ]
        });

        const ray_tracing_pipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [ray_tracing_bind_group_layout]
        });

        this.ray_tracing_pipeline = this.device.createComputePipeline({
            layout: ray_tracing_pipeline_layout,

            compute: {
                module: this.device.createShaderModule({
                    code: raytracer_kernel,
                }),
                entryPoint: 'main',
            },
        });

        const screen_bind_group_layout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
            ]

        });

        this.screen_bind_group = this.device.createBindGroup({
            layout: screen_bind_group_layout,
            entries: [
                {
                    binding: 0,
                    resource: this.sampler
                },
                {
                    binding: 1,
                    resource: this.color_buffer_view
                }
            ]
        });

        const screen_pipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [screen_bind_group_layout]
        });

        this.screen_pipeline = this.device.createRenderPipeline({
            layout: screen_pipeline_layout,

            vertex: {
                module: this.device.createShaderModule({
                    code: screen_shader,
                }),
                entryPoint: 'vert_main',
            },

            fragment: {
                module: this.device.createShaderModule({
                    code: screen_shader,
                }),
                entryPoint: 'frag_main',
                targets: [
                    {
                        format: "bgra8unorm"
                    }
                ]
            },

            primitive: {
                topology: "triangle-list"
            }
        });

    }

    prepareScene()
    {
        const sceneData: Int32Array = new Int32Array(4);
        sceneData[0] = this.canvas.width;
        sceneData[1] = this.canvas.height;
        sceneData[2] = 0;
        sceneData[3] = this.scene.spheres.length;
        this.device.queue.writeBuffer(this.bufferScene, 0, sceneData, 0, 4);

        const objectData: Float32Array = new Float32Array(8 * this.scene.spheres.length);
        for(let i = 0; i < this.scene.spheres.length; i++)
        {
            objectData[8 * i] = this.scene.spheres[i].center[0];
            objectData[8 * i + 1] = this.scene.spheres[i].center[1];
            objectData[8 * i + 2] = this.scene.spheres[i].center[2];
            objectData[8 * i + 3] = 0.0;
            objectData[8 * i + 4] = this.scene.spheres[i].color[0];
            objectData[8 * i + 5] = this.scene.spheres[i].color[1];
            objectData[8 * i + 6] = this.scene.spheres[i].color[2];
            objectData[8 * i + 7] = this.scene.spheres[i].radius;
        }
        this.device.queue.writeBuffer(this.bufferObjects, 0, objectData, 0, 8 * this.scene.spheres.length);
    }

    updateCamera()
    {
        const camera = this.scene.camera;
        this.device.queue.writeBuffer(
            this.bufferCamera, 0, new Float32Array([
                camera.position[0],
                camera.position[1],
                camera.position[2],
                0.0,
                camera.forward[0],
                camera.forward[1],
                camera.forward[2],
                0.0,
                camera.right[0],
                camera.right[1],
                camera.right[2],
                0.0,
                camera.up[0],
                camera.up[1],
                camera.up[2],
                camera.fov
            ]), 0, 16
        );
    }

    render = () =>
    {
        this.prepareScene();
        this.updateCamera();

        const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();

        const ray_trace_pass: GPUComputePassEncoder = commandEncoder.beginComputePass();
        ray_trace_pass.setPipeline(this.ray_tracing_pipeline);
        ray_trace_pass.setBindGroup(0, this.ray_tracing_bind_group);
        ray_trace_pass.dispatchWorkgroups(this.canvas.width, this.canvas.height, 1);
        ray_trace_pass.end();

        const textureView: GPUTextureView = this.context.getCurrentTexture().createView();
        const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.5, g: 0.0, b: 0.25, a: 1.0 },
                loadOp: "clear",
                storeOp: "store"
            }]
        });

        renderpass.setPipeline(this.screen_pipeline);
        renderpass.setBindGroup(0, this.screen_bind_group);
        renderpass.draw(6, 1, 0, 0);

        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);

        requestAnimationFrame(this.render);
    };

}
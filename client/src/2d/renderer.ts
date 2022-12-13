import rasterizer_kernel from "./shaders/resterizer.wgsl";
import screen_shader from "./shaders/screen_shader.wgsl";
import { Scene } from "./scene";

export class Renderer
{
    scene: Scene;

    device: GPUDevice;
    context: GPUCanvasContext;

    width: number;
    height: number;

    color_buffer!: GPUTexture;
    color_buffer_view!: GPUTextureView;
    sampler!: GPUSampler;

    bufferCamera!: GPUBuffer;
    bufferDynamicObjects!: GPUBuffer;
    bufferScene!: GPUBuffer;
    bufferLights!: GPUBuffer;
    bufferStaticObjects!: GPUBuffer;

    ray_tracing_pipeline!: GPUComputePipeline;
    ray_tracing_bind_group!: GPUBindGroup;
    screen_pipeline!: GPURenderPipeline;
    screen_bind_group!: GPUBindGroup;

    constructor(device: GPUDevice, context: GPUCanvasContext, scene: Scene)
    {
        this.device = device;
        this.context = context;
        this.width = (<HTMLCanvasElement>context.canvas).width;
        this.height = (<HTMLCanvasElement>context.canvas).height;
        this.scene = scene;
    }

    initialize()
    {
        this.createAssets();
        this.makePipeline();
        this.prepareScene();
    }

    private createAssets()
    {
        //compute output texture
        this.color_buffer = this.device.createTexture(
            {
                size: {
                    width: this.width,
                    height: this.height,
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

        //dynamic objects
        this.bufferDynamicObjects = this.device.createBuffer({
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

        //static objects
        this.bufferStaticObjects = this.device.createBuffer({
            size: 32 * this.scene.spheres.length,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
    }

    private makePipeline()
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
                        type: "uniform",
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
                },
                {
                    binding: 5,
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
                        buffer: this.bufferDynamicObjects,
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: this.bufferScene,
                    }
                },
                {
                    binding: 4,
                    resource: {
                        buffer: this.bufferLights,
                    }
                },
                {
                    binding: 5,
                    resource: {
                        buffer: this.bufferStaticObjects,
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
                    code: rasterizer_kernel,
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

    private prepareScene()
    {
        const sceneData: Int32Array = new Int32Array(4);
        sceneData[0] = this.width;
        sceneData[1] = this.height;
        sceneData[2] = 0;
        sceneData[3] = this.scene.spheres.length;
        this.device.queue.writeBuffer(this.bufferScene, 0, sceneData, 0, 4);

        const objectData: Float32Array = new Float32Array(8 * this.scene.spheres.length);
        objectData[0] = 0.0; //n.x
        objectData[1] = 0.0; //n.y
        objectData[2] = 1.0; //n.z
        objectData[3] = -1.0; //dist
        objectData[4] = 0.5; //r
        objectData[5] = 0.0; //g
        objectData[6] = 0.0; //b
        objectData[7] = 0.0;

        this.device.queue.writeBuffer(this.bufferStaticObjects, 0, objectData, 0, 8);
    }

    private updateCamera()
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

    private updateDynamic()
    {
        const objectData: Float32Array = new Float32Array(16);
        for(let i = 0; i < 2; i++)
        {
            objectData[8 * i] = this.scene.spheres[i].center[0];
            objectData[8 * i + 1] = this.scene.spheres[i].center[1];
            objectData[8 * i + 2] = this.scene.spheres[i].center[2];
            objectData[8 * i + 3] = this.scene.spheres[i].radius;
            objectData[8 * i + 4] = this.scene.spheres[i].color[0];
            objectData[8 * i + 5] = this.scene.spheres[i].color[1];
            objectData[8 * i + 6] = this.scene.spheres[i].color[2];
            objectData[8 * i + 7] = 0.0;
        }
        this.device.queue.writeBuffer(this.bufferDynamicObjects, 0, objectData, 0, 16);
    }

    render = () =>
    {
        this.updateCamera();
        this.updateDynamic();

        const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();

        const ray_trace_pass: GPUComputePassEncoder = commandEncoder.beginComputePass();
        ray_trace_pass.setPipeline(this.ray_tracing_pipeline);
        ray_trace_pass.setBindGroup(0, this.ray_tracing_bind_group);
        ray_trace_pass.dispatchWorkgroups(this.width, this.height, 1);
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
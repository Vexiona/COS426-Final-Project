import shader from "./shaders/shaders.wgsl";

export class Renderer
{
    private device: GPUDevice;
    private context: GPUCanvasContext;

    private constructor(device: GPUDevice, context: GPUCanvasContext)
    {
        this.device = device;
        this.context = context;
    }

    public static async initialize(canvas: HTMLCanvasElement)
    {
        if(!('gpu' in navigator))
            return Promise.reject(new Error('No webGPU!'));
        const adapter: GPUAdapter = <GPUAdapter>await navigator.gpu?.requestAdapter();
        if(adapter === null)
            return Promise.reject(new Error('No adapter!'));
        const device: GPUDevice = <GPUDevice>await adapter?.requestDevice();
        console.log(device);
        const context: GPUCanvasContext = <GPUCanvasContext>canvas.getContext("webgpu");
        return new Renderer(device, context);
    }

    public begin()
    {
        const format: GPUTextureFormat = "bgra8unorm";
        this.context.configure({
            device: this.device,
            format: format,
            alphaMode: "opaque"
        });

        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [],
        });

        const bindGroup = this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: []
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });

        const pipeline = this.device.createRenderPipeline({
            vertex: {
                module: this.device.createShaderModule({
                    code: shader
                }),
                entryPoint: "vs_main"
            },

            fragment: {
                module: this.device.createShaderModule({
                    code: shader
                }),
                entryPoint: "fs_main",
                targets: [{
                    format: format
                }]
            },

            primitive: {
                topology: "triangle-list"
            },

            layout: pipelineLayout
        });

        //command encoder: records draw commands for submission
        const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();
        //texture view: image view to the color buffer in this case
        const textureView: GPUTextureView = this.context.getCurrentTexture().createView();
        //renderpass: holds draw commands, allocated from command encoder
        const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.5, g: 0.0, b: 0.25, a: 1.0 },
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        renderpass.setPipeline(pipeline);
        renderpass.setBindGroup(0, bindGroup);
        renderpass.draw(3, 1, 0, 0);
        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}
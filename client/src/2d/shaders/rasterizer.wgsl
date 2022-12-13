struct Camera //size 16
{
    pos: vec3<f32>,
    scale: f32,
};

struct SceneData //size 16
{
    width: i32,
    height: i32,
    nCharacters: i32,
    nStaticObjects: i32,
};

struct Light //size 32
{
    position: vec3<f32>,
    color: vec3<f32>,
    intensity: f32,
};

struct Material
{
    color: vec3<f32>,
};

struct Object //size 32
{
    data: array<vec4<f32>, 1>,
    material: Material,
};

const EPS: f32 = 1e-2;
const INFINITY: f32 = 100000.0;

@group(0) @binding(0) var color_buffer: texture_storage_2d<rgba8unorm, write>; //screen output
@group(0) @binding(1) var<uniform> camera: Camera;
@group(0) @binding(2) var<uniform> characters: array<Object, 2>; //characters
@group(0) @binding(3) var<storage, read> scene_data: SceneData;
@group(0) @binding(4) var<storage, read> lights: array<Light>;
@group(0) @binding(5) var<storage, read> static_objects: array<Object>;

@group(1) @binding(0) var ch_sampler : sampler;
@group(1) @binding(1) var tex_font: texture_2d<f32>;

@compute @workgroup_size(1,1,1)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>)
{
    let screen_pos : vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));

    let x: f32 = f32(2 * screen_pos.x - scene_data.width) / (camera.scale * f32(scene_data.height)) + camera.pos.x;
    let y: f32 = -f32(2 * screen_pos.y - scene_data.height) / (camera.scale * f32(scene_data.height)) + camera.pos.z;

    var pixel_color : vec3<f32> = buildPixel(x, y);
    let char: vec4<f32> = textureSampleLevel(tex_font, ch_sampler, vec2<f32>(x, y), 0.0);
    pixel_color = pixel_color.rgb * (1-char.a) + char.rgb * char.a;

    textureStore(color_buffer, screen_pos, vec4<f32>(pixel_color, 1.0));
}

fn buildPixel(x: f32, y: f32) -> vec3<f32>
{
    var resColor: vec3<f32> = vec3(0.0, 0.0, 0.0);

    //background
    resColor += vec3<f32>(0.4, 0.0, 0.0) * 1.0;
    for(var i: i32 = 0; i < scene_data.nCharacters; i++)
    {
        var diff_x: f32 = x - characters[i].data[0].x;
        var diff_y: f32 = y - characters[i].data[0].z;
        if(diff_x * diff_x + diff_y * diff_y <= 0.5)
        {
            resColor = vec3<f32> (1.0, 1.0, 1.0);
        }
    }

    return resColor;
}
struct Camera //size 16
{
    pos: vec3<f32>,
    scale: f32,
};

struct SceneData //size 24
{
    width: i32,
    height: i32,
    nCharacters: i32,
    nStaticObjects: i32,
    nBackgroundLayers: i32,
};

struct Light //size 32
{
    position: vec3<f32>,
    color: vec3<f32>,
    intensity: f32,
};

struct Object //size 32
{
    data_f32: array<vec4<f32>, 1>,
    data_i32: array<vec4<i32>, 1>,
};

struct Data //size 8
{
    frame: i32,
    player: i32,
}

const EPS: f32 = 1e-2;
const INFINITY: f32 = 100000.0;
const HEIGHT_SCREEN: f32 = 10.0; //height in meters of screen
const CHAR_HEIGHT: f32 = 1;
const CHAR_TEX_DIMS: vec2<f32> = vec2<f32>(192, 260);

@group(0) @binding(0) var color_buffer: texture_storage_2d<rgba8unorm, write>; //screen output
@group(0) @binding(1) var<uniform> data: Data;
@group(0) @binding(2) var<uniform> camera: Camera;
@group(0) @binding(3) var<uniform> characters: array<Object, 2>; //character data
@group(0) @binding(4) var<storage, read> scene_data: SceneData;
@group(0) @binding(5) var<storage, read> lights: array<Light>;
@group(0) @binding(6) var<storage, read> static_objects: array<Object>;

@group(1) @binding(0) var rep_rep_sampler: sampler;
@group(1) @binding(1) var clm_rep_sampler: sampler;
@group(1) @binding(2) var rep_clm_sampler: sampler;
@group(1) @binding(3) var clm_clm_sampler: sampler;

@group(2) @binding(0) var tex_font: texture_2d<f32>;
@group(2) @binding(1) var tex_bgs: texture_2d_array<f32>;
@group(2) @binding(2) var<storage, read> tex_bgs_scales: array<f32>;
@group(2) @binding(3) var tex_chars: texture_2d_array<f32>;

@compute @workgroup_size(1,1,1)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>)
{
    let screen_pos : vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));

    let real_pos: vec2<f32> = vec2<f32> (
        camera.scale * 0.5 * f32(2 * screen_pos.x - scene_data.width) / f32(scene_data.height) + camera.pos.x,
        -camera.scale * 0.5 * f32(2 * screen_pos.y - scene_data.height) / f32(scene_data.height) + camera.pos.z
    );
    let tex_pos: vec2<f32> = vec2<f32> (
        f32(screen_pos.x) / f32(scene_data.width),
        f32(screen_pos.y) / f32(scene_data.height)
    );

    var resColor: vec3<f32> = vec3(0.0, 0.0, 0.0);

    //background
    //let camera_scaled: vec2<f32> = camera.pos.xz / f32(scene_data.height);
    for(var i: i32 = 0; i < scene_data.nBackgroundLayers; i++)
    {
        let bg: vec4<f32> = textureSampleLevel(tex_bgs, rep_clm_sampler, tex_pos + camera.pos.xz / tex_bgs_scales[i], i, 0.0);
        resColor = resColor * (1 - bg.a) + bg.rgb * bg.a;
    }
    //resColor += vec3<f32>(0.4, 0.0, 0.0) * 1.0;
    for(var i: i32 = 0; i < scene_data.nCharacters; i++)
    {
        if(i == data.player) { continue; }
        let diff: vec2<f32> = real_pos - characters[i].data_f32[0].xz;
        let diff_scaled: vec2<f32> = vec2<f32>(diff.x, -diff.y) / CHAR_HEIGHT * 260 + CHAR_TEX_DIMS/2;
        if(0 <= diff_scaled.x && 0 <= diff_scaled.y && diff_scaled.x < CHAR_TEX_DIMS.x && diff_scaled.y < CHAR_TEX_DIMS.y)
        {
            if(characters[i].data_i32[0].x == 3)
            {
                let char_sample_location: vec2<f32> = (diff_scaled + vec2<f32>(CHAR_TEX_DIMS.x * f32(data.frame % 9), 0) + vec2<f32>(40, 20)) / vec2<f32>(textureDimensions(tex_chars));
                let px: vec4<f32> = textureSampleLevel(tex_chars, rep_rep_sampler, char_sample_location, i, 0.0);
                resColor = resColor * (1 - px.a) + px.rgb * px.a;
            }
            else if(characters[i].data_i32[0].x == 2)
            {
                let char_sample_location: vec2<f32> = (diff_scaled + vec2<f32>(CHAR_TEX_DIMS.x * f32(data.frame % 9), 0) + vec2<f32>(40, 20 + 3 * 260)) / vec2<f32>(textureDimensions(tex_chars));
                let px: vec4<f32> = textureSampleLevel(tex_chars, rep_rep_sampler, char_sample_location, i, 0.0);
                resColor = resColor * (1 - px.a) + px.rgb * px.a;
            }
        }
        /*if(diff.x * diff.x + diff.y * diff.y <= 0.5)
        {
            if(i == 0)
            {
                resColor = vec3<f32> (1.0, 1.0, 1.0);
            }
            if(i == 1)
            {
                resColor = vec3<f32> (0.0, 0.0, 1.0);
            }
        }*/
    }
    //render player character last
    let diff: vec2<f32> = real_pos - characters[data.player].data_f32[0].xz;
    let diff_scaled: vec2<f32> = vec2<f32>(diff.x, -diff.y) / CHAR_HEIGHT * 260 + CHAR_TEX_DIMS/2;
    if(0 <= diff_scaled.x && 0 <= diff_scaled.y && diff_scaled.x < CHAR_TEX_DIMS.x && diff_scaled.y < CHAR_TEX_DIMS.y)
    {
        if(characters[data.player].data_i32[0].x == 3)
        {
            let char_sample_location: vec2<f32> = (diff_scaled + vec2<f32>(CHAR_TEX_DIMS.x * f32(data.frame % 9), 0) + vec2<f32>(40, 20)) / vec2<f32>(textureDimensions(tex_chars));
            let px: vec4<f32> = textureSampleLevel(tex_chars, rep_rep_sampler, char_sample_location, data.player, 0.0);
            resColor = resColor * (1 - px.a) + px.rgb * px.a;
        }
        else if(characters[data.player].data_i32[0].x == 2)
        {
            let char_sample_location: vec2<f32> = (diff_scaled + vec2<f32>(CHAR_TEX_DIMS.x * f32(data.frame % 9), 0) + vec2<f32>(40, 20 + 3 * 260)) / vec2<f32>(textureDimensions(tex_chars));
            let px: vec4<f32> = textureSampleLevel(tex_chars, rep_rep_sampler, char_sample_location, data.player, 0.0);
            resColor = resColor * (1 - px.a) + px.rgb * px.a;
        }
    }


    let font: vec4<f32> = textureSampleLevel(tex_font, rep_rep_sampler, tex_pos, 0.0);
    resColor = resColor.rgb * (1 - font.a) + font.rgb * font.a;

    textureStore(color_buffer, screen_pos, vec4<f32>(resColor, 1.0));
}
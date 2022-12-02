struct Ray
{
    origin: vec3<f32>,
    direction: vec3<f32>,
    weight: vec3<f32>,
};

//maybe
struct Intersection
{
    position: vec3<f32>,
    normal: vec3<f32>,
};

struct Camera //size 64
{
    pos: vec3<f32>,
    forward: vec3<f32>,
    right: vec3<f32>,
    up: vec3<f32>,
    fov: f32,
};

struct SceneData //size 16
{
    width: i32,
    height: i32,
    nLights: i32,
    nObjects: i32,
};

struct Light //size 32
{
    position: vec3<f32>,
    color: vec3<f32>,
    intensity: f32,
};

struct Object //size 32
{
    center: vec3<f32>,
    color: vec3<f32>,
    radius: f32,
};

struct Material
{
    color: vec3<f32>,
};

struct RenderState {
    t: f32,
    color: vec3<f32>,
    hit: bool,
};

@group(0) @binding(0) var color_buffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> camera: Camera;
@group(0) @binding(2) var<storage, read> scene: SceneData;
@group(0) @binding(3) var<storage, read> lights: array<Light>;
@group(0) @binding(4) var<storage, read> objects: array<Object>;

@compute @workgroup_size(1,1,1)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>)
{
    let screen_pos : vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));

    var myRay: Ray;
    myRay.direction = normalize(camera.forward +
        camera.right * camera.fov * f32(2 * screen_pos.x - scene.width) / f32(scene.height) -
        camera.up * camera.fov * f32(2 * screen_pos.y - scene.height) / f32(scene.height));
    myRay.origin = camera.pos;
    //myRay.direction = normalize(camera.forward);
    //myRay.origin = camera.pos +
    //    camera.right * f32(2 * screen_pos.x - scene.width) * 0.01 -
    //    camera.up * f32(2 * screen_pos.y - scene.height) * 0.01;

    let pixel_color : vec3<f32> = rayColor(myRay);

    textureStore(color_buffer, screen_pos, vec4<f32>(pixel_color, 1.0));
}

fn rayColor(ray: Ray) -> vec3<f32> {

    var color: vec3<f32> = vec3(0.0, 0.0, 0.0);

    var nearestHit: f32 = 9999;
    var hitSomething: bool = false;

    var renderState: RenderState;

    for (var i: u32 = 0; i < u32(scene.nObjects); i++) {
        
        var newRenderState: RenderState = hit(ray, objects[i], 0.001, nearestHit, renderState);

        if (newRenderState.hit) {
            nearestHit = newRenderState.t;
            renderState = newRenderState;
            hitSomething = true;
        }
    }

    if (hitSomething) {
        color = renderState.color;
    }
    return color;
}

fn hit(ray: Ray, sphere: Object, tMin: f32, tMax: f32, oldRenderState: RenderState) -> RenderState {
    
    let co: vec3<f32> = ray.origin - sphere.center;
    let a: f32 = dot(ray.direction, ray.direction);
    let b: f32 = 2.0 * dot(ray.direction, co);
    let c: f32 = dot(co, co) - sphere.radius * sphere.radius;
    let discriminant: f32 = b * b - 4.0 * a * c;

    var renderState: RenderState;
    renderState.color = oldRenderState.color;

    if (discriminant > 0.0) {

        let t: f32 = (-b - sqrt(discriminant)) / (2 * a);

        if (t > tMin && t < tMax) {
            renderState.t = t;
            renderState.color = sphere.color;
            renderState.hit = true;
            return renderState;
        }
    }

    renderState.hit = false;
    return renderState;
    
}
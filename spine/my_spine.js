var lastFrameTime = Date.now() / 1000;
var FILE = "build_char_336_folivo"; // Spine 模型名称
var ANIMATION = "Sit"; // 动画名称
var NUM_SKELETONS = 1; // 渲染的骨架数量
var SCALE = 1; // 缩放比例

var canvas, context, gl, renderer, assetManager;
var skeletons = [];
var timeKeeper;

function init() {
    canvas = document.getElementById("spine-canvas");

    // 初始化 WebGL 上下文，启用 premultipliedAlpha
    context = new spine.webgl.ManagedWebGLRenderingContext(canvas, {
        alpha: true,
        premultipliedAlpha: true, // 确保启用预乘 Alpha
    });
    gl = context.gl;

    // 初始化场景渲染器
    renderer = new spine.webgl.SceneRenderer(canvas, context);
    renderer.skeletonRenderer.premultipliedAlpha = true; // 显式启用预乘 Alpha
    renderer.skeletonDebugRenderer.drawBones = false;
    renderer.skeletonDebugRenderer.drawMeshTriangles = false;
    renderer.skeletonDebugRenderer.drawMeshHull = false;
    renderer.skeletonDebugRenderer.drawRegionAttachments = false;
    renderer.skeletonDebugRenderer.drawBoundingBoxes = false;

    // 初始化资源管理器
    assetManager = new spine.webgl.AssetManager(context, "assets/");
    assetManager.loadTexture(FILE + ".png");
    assetManager.loadText(FILE + ".atlas");
    assetManager.loadText(FILE + ".json");

    timeKeeper = new spine.TimeKeeper();
    requestAnimationFrame(load);
}

function load() {
    timeKeeper.update();
    if (assetManager.isLoadingComplete()) {
        var atlas = new spine.TextureAtlas(assetManager.get(FILE + ".atlas"), function(path) {
            return assetManager.get(path);
        });
        var atlasLoader = new spine.AtlasAttachmentLoader(atlas);
        var skeletonJson = new spine.SkeletonJson(atlasLoader);
        skeletonJson.scale = SCALE;
        var skeletonData = skeletonJson.readSkeletonData(JSON.parse(assetManager.get(FILE + ".json")));

        for (var i = 0; i < NUM_SKELETONS; i++) {
            var skeleton = new spine.Skeleton(skeletonData);
            var stateData = new spine.AnimationStateData(skeleton.data);
            var state = new spine.AnimationState(stateData);

            state.setAnimation(0, ANIMATION, true);
            skeleton.x = 0;
            skeleton.y = 0;
            skeleton.updateWorldTransform();
            skeletons.push({ skeleton: skeleton, state: state });
        }

        requestAnimationFrame(render);
    } else {
        requestAnimationFrame(load);
    }
}

function render() {
    // 设置混合模式
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // 预乘 Alpha 的混合函数

    var now = Date.now() / 1000;
    var delta = now - lastFrameTime;
    lastFrameTime = now;

    // 更新动画状态
    for (var i = 0; i < skeletons.length; i++) {
        var state = skeletons[i].state;
        var skeleton = skeletons[i].skeleton;
        state.update(delta);
        state.apply(skeleton);
        skeleton.updateWorldTransform();
    }

    // 设置透明背景
    gl.clearColor(0, 0, 0, 0); // RGBA: 最后一个参数是 alpha 值
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 渲染场景
    renderer.resize(spine.webgl.ResizeMode.Fit);
    renderer.begin();
    for (var i = 0; i < skeletons.length; i++) {
        var skeleton = skeletons[i].skeleton;
        renderer.drawSkeleton(skeleton, false);
    }
    renderer.end();

    requestAnimationFrame(render);
}

init();
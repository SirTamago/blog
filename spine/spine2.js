// 全局配置
var MODEL_NAME = "build_char_336_folivo"; // 模型名称
var ANIMATION_NAME = "Sit"; // 动画名称
var SKIN_NAME = "default"; // 皮肤名称
var PREMULTIPLIED_ALPHA = true; // 是否启用 Premultiplied Alpha

var lastFrameTime = Date.now() / 1000;
var canvas, gl, shader, batcher, mvp, assetManager, skeletonRenderer, debugRenderer, shapes;
var skeletons = {};
var activeSkeleton = MODEL_NAME; // 当前活动的骨架

function init() {
    canvas = document.getElementById("spine-canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 初始化 WebGL 上下文
    var config = { alpha: false }; // 禁用 premultiplied alpha
    gl = canvas.getContext("webgl", config) || canvas.getContext("experimental-webgl", config);
    if (!gl) {
        alert('WebGL is unavailable.');
        return;
    }

    // 创建着色器、批处理器和 MVP 矩阵
    shader = spine.webgl.Shader.newTwoColoredTextured(gl);
    batcher = new spine.webgl.PolygonBatcher(gl);
    mvp = new spine.webgl.Matrix4();
    mvp.ortho2d(0, 0, canvas.width - 1, canvas.height - 1);

    // 初始化渲染器和调试渲染器
    skeletonRenderer = new spine.webgl.SkeletonRenderer(gl);
    debugRenderer = new spine.webgl.SkeletonDebugRenderer(gl);
    debugRenderer.drawRegionAttachments = true;
    debugRenderer.drawBoundingBoxes = true;
    debugRenderer.drawMeshHull = true;
    debugRenderer.drawMeshTriangles = true;
    debugRenderer.drawPaths = true;

    // 初始化资源管理器
    assetManager = new spine.webgl.AssetManager(gl);

    // 加载资源
    assetManager.loadText("assets/" + MODEL_NAME + ".json");
    assetManager.loadText("assets/" + MODEL_NAME + ".atlas");
    assetManager.loadTexture("assets/" + MODEL_NAME + ".png");

    requestAnimationFrame(load);
}

function load() {
    if (assetManager.isLoadingComplete()) {
        // 加载骨架数据
        skeletons[MODEL_NAME] = loadSkeleton(MODEL_NAME, ANIMATION_NAME, PREMULTIPLIED_ALPHA, SKIN_NAME);
        requestAnimationFrame(render);
    } else {
        requestAnimationFrame(load);
    }
}

function loadSkeleton(name, initialAnimation, premultipliedAlpha, skin) {
    if (skin === undefined) skin = "default";

    // 加载纹理图集
    let atlas = new spine.TextureAtlas(assetManager.get("assets/" + name + ".atlas"), function (path) {
        return assetManager.get("assets/" + path);
    });

    // 创建附件加载器和骨架数据
    var atlasLoader = new spine.AtlasAttachmentLoader(atlas);
    var skeletonJson = new spine.SkeletonJson(atlasLoader);
    var skeletonData = skeletonJson.readSkeletonData(assetManager.get("assets/" + name + ".json"));

    // 创建骨架和动画状态
    var skeleton = new spine.Skeleton(skeletonData);
    skeleton.setSkinByName(skin);
    var bounds = calculateBounds(skeleton);

    var animationStateData = new spine.AnimationStateData(skeleton.data);
    var animationState = new spine.AnimationState(animationStateData);
    animationState.setAnimation(0, initialAnimation, true);

    // 返回骨架、动画状态和边界信息
    return { skeleton: skeleton, state: animationState, bounds: bounds, premultipliedAlpha: premultipliedAlpha };
}

function calculateBounds(skeleton) {
    skeleton.setToSetupPose();
    skeleton.updateWorldTransform();
    var offset = new spine.Vector2();
    var size = new spine.Vector2();
    skeleton.getBounds(offset, size, []);
    return { offset: offset, size: size };
}

function render() {
    var now = Date.now() / 1000;
    var delta = now - lastFrameTime;
    lastFrameTime = now;

    // 调整画布大小
    resize();

    // 清除画布
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 获取当前骨架和动画状态
    var state = skeletons[activeSkeleton].state;
    var skeleton = skeletons[activeSkeleton].skeleton;
    var premultipliedAlpha = skeletons[activeSkeleton].premultipliedAlpha;

    // 更新动画状态
    state.update(delta);
    state.apply(skeleton);
    skeleton.updateWorldTransform();

    // 绑定着色器并设置 MVP 矩阵
    shader.bind();
    shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
    shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);

    // 渲染骨架
    batcher.begin(shader);
    skeletonRenderer.premultipliedAlpha = premultipliedAlpha;
    skeletonRenderer.draw(batcher, skeleton);
    batcher.end();

    shader.unbind();

    // 渲染调试信息
    debugShader.bind();
    debugShader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);
    debugRenderer.premultipliedAlpha = premultipliedAlpha;
    shapes.begin(debugShader);
    debugRenderer.draw(shapes, skeleton);
    shapes.end();
    debugShader.unbind();

    requestAnimationFrame(render);
}

function resize() {
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    var bounds = skeletons[activeSkeleton].bounds;

    if (canvas.width != w || canvas.height != h) {
        canvas.width = w;
        canvas.height = h;
    }

    // 计算缩放比例和中心点
    var centerX = bounds.offset.x + bounds.size.x / 2;
    var centerY = bounds.offset.y + bounds.size.y / 2;
    var scaleX = bounds.size.x / canvas.width;
    var scaleY = bounds.size.y / canvas.height;
    var scale = Math.max(scaleX, scaleY) * 1.2;
    if (scale < 1) scale = 1;
    var width = canvas.width * scale;
    var height = canvas.height * scale;

    // 设置 MVP 矩阵和视口
    mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
    gl.viewport(0, 0, canvas.width, canvas.height);
}

// 初始化
init();
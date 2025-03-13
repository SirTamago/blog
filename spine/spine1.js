// 全局配置
var MODEL_NAME = "build_char_336_folivo"; // 模型名称
var DEFAULT_ANIMATION = "Relax"; // 默认动画
var CLICK_ANIMATION = "Interact"; // 点击触发的动画
var SKIN_NAME = "default"; // 皮肤名称
var PREMULTIPLIED_ALPHA = true; // 是否启用 Premultiplied Alpha
var NUM_SKELETONS = 1; // 渲染的骨架数量
var SCALE = 1; // 缩放比例

var lastFrameTime = Date.now() / 1000;
var canvas, gl, shader, batcher, mvp, assetManager, skeletonRenderer, debugRenderer, shapes;
var skeletons = [];
var activeSkeleton = MODEL_NAME; // 当前活动的骨架
var isPlayingDefaultAnimation = true; // 是否正在播放默认动画

function init() {
    canvas = document.getElementById("spine-canvas");
    canvas.width = 250;
    canvas.height = 250;

    // 初始化 WebGL 上下文
    var config = { alpha: true, premultipliedAlpha: PREMULTIPLIED_ALPHA };
    gl = canvas.getContext("webgl", config) || canvas.getContext("experimental-webgl", config);
    if (!gl) {
        alert('WebGL is unavailable.');
        return;
    }

    // 创建着色器、批处理器和 MVP 矩阵
    shader = spine.webgl.Shader.newTwoColoredTextured(gl);
    batcher = new spine.webgl.PolygonBatcher(gl);
    mvp = new spine.webgl.Matrix4();

    // 初始化渲染器和调试渲染器
    skeletonRenderer = new spine.webgl.SkeletonRenderer(gl);
    skeletonRenderer.premultipliedAlpha = PREMULTIPLIED_ALPHA; // 设置预乘 Alpha
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

    // 添加点击事件监听器
    var container = document.getElementById("spine-container");
    container.addEventListener("click", onClick);

    requestAnimationFrame(load);
}

function onClick() {
    if (isPlayingDefaultAnimation) {
        // 切换到点击触发的动画
        for (var i = 0; i < skeletons.length; i++) {
            var state = skeletons[i].state;
            state.setAnimation(0, CLICK_ANIMATION, false); // 不循环播放
            state.addAnimation(0, DEFAULT_ANIMATION, true, 0); // 播放完成后回到默认动画
        }
        isPlayingDefaultAnimation = false;
    }
}

function load() {
    if (assetManager.isLoadingComplete()) {
        // 加载骨架数据
        for (var i = 0; i < NUM_SKELETONS; i++) {
            var skeletonData = loadSkeleton(MODEL_NAME, DEFAULT_ANIMATION, PREMULTIPLIED_ALPHA, SKIN_NAME);
            skeletons.push(skeletonData);
        }
        requestAnimationFrame(render);
    } else {
        requestAnimationFrame(load);
    }
}

function loadSkeleton(name, initialAnimation, premultipliedAlpha, skin) {
    if (skin === undefined) skin = "default";

    // 加载纹理图集
    var atlas = new spine.TextureAtlas(assetManager.get("assets/" + name + ".atlas"), function(path) {
        return assetManager.get("assets/" + path);
    });

    // 创建附件加载器和骨架数据
    var atlasLoader = new spine.AtlasAttachmentLoader(atlas);
    var skeletonJson = new spine.SkeletonJson(atlasLoader);
    skeletonJson.scale = SCALE;
    var skeletonData = skeletonJson.readSkeletonData(assetManager.get("assets/" + name + ".json"));

    // 创建骨架和动画状态
    var skeleton = new spine.Skeleton(skeletonData);
    skeleton.setSkinByName(skin);
    skeleton.setToSetupPose();
    skeleton.updateWorldTransform();

    var animationStateData = new spine.AnimationStateData(skeleton.data);
    var animationState = new spine.AnimationState(animationStateData);
    animationState.setAnimation(0, initialAnimation, true);

    // 监听动画完成事件
    animationState.addListener({
        complete: function(entry) {
            if (entry.animation.name === CLICK_ANIMATION) {
                // 点击触发的动画播放完成后，恢复默认动画
                isPlayingDefaultAnimation = true;
            }
        }
    });

    // 返回骨架和动画状态
    return { skeleton: skeleton, state: animationState };
}

function render() {
    var now = Date.now() / 1000;
    var delta = now - lastFrameTime;
    lastFrameTime = now;

    // 限制 delta 的最大值，避免跳帧
    if (delta > 0.1) delta = 0.1;

    // 调整画布大小
    resize();

    // 清除画布
    gl.clearColor(0, 0, 0, 0); // 设置背景颜色
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 设置混合模式
    gl.enable(gl.BLEND);
    gl.blendFunc(PREMULTIPLIED_ALPHA ? gl.ONE : gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // 更新并渲染每个骨架
    for (var i = 0; i < skeletons.length; i++) {
        var state = skeletons[i].state;
        var skeleton = skeletons[i].skeleton;

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
        skeletonRenderer.draw(batcher, skeleton);
        batcher.end();

        shader.unbind();
    }

    requestAnimationFrame(render);
}

function resize() {
    var w = canvas.width;
    var h = canvas.height;

    if (canvas.width != w || canvas.height != h) {
        canvas.width = w;
        canvas.height = h;
    }

    // 更新 MVP 矩阵
    mvp.ortho2d(-(w/2), 0-50, w, h);
    gl.viewport(0, 0, w, h);
}
// 初始化
init();
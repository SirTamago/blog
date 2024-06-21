hexo.extend.injector.register('body_end', function () {
    const {
        enable,
        spine_dir,
        models,
        behaviors
    } = hexo.config.spine;

    if (!enable) {
        return null;
    }
    return `
    <script src="https://unpkg.com/@esotericsoftware/spine-player@4.0.28/dist/iife/spine-player.min.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/@esotericsoftware/spine-player@4.0.28/dist/spine-player.min.css">
    <script src="//cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <div id="player-container" class="player-container"</div>
    <script>
        var spineDir = "${spine_dir}";
        var models =  ${JSON.stringify(models)};
        var behaviors = ${JSON.stringify(behaviors)};
        var lv2 = false;
        function getLv() {
            if(lv2) {
                return "lv2";
            }
            return "lv1";
        }
        function getModel() {
            return models[Number.parseInt(Math.random()*models.length)];
        }
        function getAnimation(behavior) {
            return behaviors[behavior]["animation"] + "_" + getLv();
        }
        var model = getModel()["name"];
        new spine.SpinePlayer("player-container", {
            jsonUrl: spineDir + "/" + model + "/" + model + ".json",
            atlasUrl: spineDir + "/" + model + "/" + model + ".atlas",
            alpha: true,
            backgroundColor: "#00000000",
            showControls: false,
            success: function(player) {
                player.animationState.addAnimation(0, getAnimation("start"), true, 0);
                $('#player-container').hover(function() {
                    player.animationState.addAnimation(0,  getAnimation("hover"), true, 0);
                }, function() {
                    player.animationState.addAnimation(0, getAnimation("start"), true, 0);
                });
                $('#player-container').click(function() {
                    lv2 = !lv2;
                    player.animationState.setAnimation(0,  getAnimation("hover"));
                    player.animationState.addAnimation(0, getAnimation("start"), true, 0);
                })

            }
        });
    </script>
    `
})

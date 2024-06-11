hexo.extend.injector.register('body_end', function () {
    const {
        enable,
        spineDir,
        models,
        styles,
        behaviors
    } = hexo.config.myspine;

    if (!enable) {
        return null;
    }

    return `
    <div class="myspine-spine-widget"></div>
    <script src="/js/third-party/myspine/spine-widget.js"></script>
    <script src="/js/third-party/myspine/spine-skeleton-binary.js"></script>
    <script src="/js/third-party/myspine/myspine.js"></script>
    <link type="text/css" href="/css/_third-party/myspine.css"></link>
    <script>
        new MySpine({
            spineDir: "${spineDir}",
            models: ${JSON.stringify(models)},
            styles: ${JSON.stringify(styles)},
            behaviors: ${JSON.stringify(behaviors)}
        });
    </script>
    `
})

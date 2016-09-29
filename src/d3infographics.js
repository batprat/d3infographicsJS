window.d3i = (function () {
    if (!window.d3) {
        throw new Error('d3 not found. You need d3 to run d3infographics library');
    }
    var d3i = function () { };

    var defaults = {
        width: 400,
        height: 300,
        container: 'body'
    };

    /*
        Creates a canvas on the page.
        Usage: 
            d3i.createCanvas({
                container: '#viz-holder',
                width: 500,
                height: 500
            });

        Defaults: { 
                    container: 'body',
                    width: 400,
                    heightL 300
                  }

        Returns `canvas` element appended to the specified container or body
    */
    d3i.createCanvas = function (options) {
        options = options || {};

        var width = options.width || defaults.width,
            height = options.height || defaults.height,
            container = options.container || defaults.container;

        return d3.selectAll(container).append('canvas')
                                        .attr({
                                            width: width,
                                            height: height
                                        });
    };

    return d3i;
})();
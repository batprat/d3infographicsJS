window.d3i = (function () {
    if (!window.d3) {
        throw new Error('d3 not found. You need d3 to run d3infographics library');
    }
    var d3i = function () {
        this.canvas = null;
    };

    /*
        Start with this method. Call all subsequent methods with the object returned by this method.
    */
    d3i.createInstance = function () {
        return new d3i();
    }

    /*
        Creates a canvas on the page. `infograph` is the d3i object created by `createInstance`
        Usage: 
            infograph.createCanvas({
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
    d3i.prototype.createCanvas = function (options) {
        var defaults = {
            width: 400,
            height: 300,
            container: 'body'
        };

        options = options || {};

        var width = options.width || defaults.width,
            height = options.height || defaults.height,
            container = options.container || defaults.container;

        this.canvas = d3.selectAll(container).append('canvas')
                                        .attr({
                                            width: width,
                                            height: height
                                        });

        return this;
    };

    return d3i;
})();
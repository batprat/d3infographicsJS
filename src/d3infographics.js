window.d3i = (function () {
    if (!window.d3) {
        throw new Error('d3 not found. You need d3 to run d3infographics library');
    }
    var d3i = function () {
        this.canvas = null;
        this.context = null;
        this.width = 0;
        this.height = 0;

        this.queue = [];
        this.queue.d3i = this;

        this.queue.resume = function () {
            var queue = this;

            queue.paused = false;

            queue.d3i.render();
        };

        this.defaults = {
            width: 400,
            height: 300,
            container: 'body'
        };

        this.defaults.background = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            color: false,
            pattern: false,
            image: {
                url: false,
                clipX: 0,
                clipY: 0,
                clipWidth: 0,
                clipHeight: 0,
                x: 0,
                y: 0,
                width: 0,
                height: 0
            },
            pattern: {
                url: false,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                repeat: false
            }
        };
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
        options = options || {};

        this.width = options.width || this.defaults.width;
        this.height = options.height || this.defaults.height;
        this.container = options.container || this.defaults.container;

        this.canvas = d3.selectAll(this.container).append('canvas')
                                        .attr({
                                            width: this.width,
                                            height: this.height
                                        });

        this.setContext(this.canvas.node().getContext('2d'));
        return this;
    };

    /*
        Method to set custom context.
        param: context
    */
    d3i.prototype.setContext = function (context) {
        this.context = context;

        return this;
    };

    /*
        Method to add background.
        param: options | Object
    */
    d3i.prototype.addBackground = function (options) {
        // TODO: add support for adding background video.
        if (!this.canvas || !this.context) {
            throw new Error('You need to first create canvas or set context');
        }
        options = _extend({}, this.defaults.background, {
            width: this.width, height: this.height,
            pattern: { width: this.width, height: this.height }
        }, options || {});

        if (options.color) {
            enqueue(function () {
                setBackgroundColor(this.context, options);
            }, this.queue);
        }

        if (options.pattern.url) {
            enqueue(function () {
                setBackgroundPattern(this.context, options, this.queue);
            }, this.queue);
        }

        if (options.image.url) {
            enqueue(function () {
                setBackgroundImage(this.context, options, this.queue);
            }, this.queue);
        }

        return this;
    };

    d3i.prototype.render = function () {
        while (this.queue.length) {
            var curr = this.queue[0];
            curr.fn.call(this);

            // remove this function from the queue.
            this.queue.splice(0, 1);
            if (this.queue.paused) {
                return;
            }
        }
    };

    return d3i;

    function enqueue(fn, queue) {
        queue.push({
            fn: fn,
            idx: queue.length
        });
    }

    function setBackgroundColor(context, background) {
        context.fillStyle = background.color;
        context.fillRect(background.x, background.y, background.width, background.height);
    }

    function setBackgroundPattern(context, background, queue) {
        // TODO: validate if pattern.image.url is a valid image URL.
        var image = document.createElement('IMG');
        var repeat = 'no-repeat';
        switch (background.pattern.repeat) {
            case 'x': {
                repeat = 'repeat-x';
                break;
            }
            case 'y': {
                repeat = 'repeat-y';
                break;
            }
            case 'repeat':
            case true: {
                repeat = 'repeat';
                break;
            }
            default: {
                repeat = 'no-repeat';
                break;
            }
        }
        queue.paused = true;
        image.onload = function () {
            var patternFill = context.createPattern(image, repeat);
            context.rect(background.pattern.x, background.pattern.y, background.pattern.width, background.pattern.height);
            context.fillStyle = patternFill;
            context.fill();
            return queue.resume();
        };

        image.src = background.pattern.url;
    }

    function setBackgroundImage(context, background, queue) {
        // TODO: validate if background.image.url is a valid image URL.
        var image = document.createElement('IMG');
        var clipWidth, clipHeight, width, height;
        queue.paused = true;
        image.onload = function () {
            clipWidth = background.image.clipWidth ? background.image.clipWidth : image.width;
            clipHeight = background.image.clipHeight ? background.image.clipHeight : image.height;
            width = background.image.width ? background.image.width : image.width;
            height = background.image.height ? background.image.height : image.height;

            // TODO: Add support for x and y values to be negative. (calculate from right border)
            context.drawImage(image, background.image.clipX, background.image.clipY, clipWidth, clipHeight, background.image.x, background.image.y, width, height);
            return queue.resume();
        };

        image.src = background.image.url;
    }

    function _extend() {
        var dest = arguments[0] || {};
        var args = Array.prototype.slice.call(arguments, 1);

        if (args.length > 0) {
            var src = args[0];

            args = args.slice(1);

            for (var prop in src) {
                if (typeof src[prop] == 'object') {
                     dest[prop] = dest[prop] = _extend(dest[prop], src[prop]);
                }
                else {
                    dest[prop] = src[prop];
                }
            }

            if (args.length > 0) {
                _extend.apply(null, [dest].concat(args));
            }
        }

        return dest;
    }
})();
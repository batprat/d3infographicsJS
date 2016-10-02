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
            color: {
                value: false,
                opacity: 1,
                x: 0,
                y: 0,
                width: 0,
                height: 0
            },
            image: {
                url: false,
                opacity: 1,
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
                opacity: 1,
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
        example: 
            infoviz.addBackground({
            color: {
                value: 'rgb(76,175,80)',
                x: 0,
                y: 0,
                width: 220,
                height: 100,
                opacity: 1
            },
            pattern: {
                url: 'http://www.w3schools.com/tags/img_lamp.jpg',
                repeat: true,
                x: 50,
                y: 50,
                width: 400,
                height: 400,
                opacity: 0.5
            },
            image: {
                url: 'http://www.w3schools.com/tags/img_the_scream.jpg',
                x: 80,
                y: 80,
                width: 400,
                height: 400,
                opacity: 0.7
            }
        });
    */
    d3i.prototype.addBackground = function (options) {
        // TODO: add support for adding background video.
        // TODO: add support for detecting { color: 'string' } and setting the entire bg color. Same with { image: 'url' } and { pattern: 'url' }
        if (!this.canvas || !this.context) {
            throw new Error('You need to first create canvas or set context');
        }
        options = _extend({}, this.defaults.background, {
            width: this.width, height: this.height,
            pattern: { width: this.width, height: this.height },
            color: { width: this.width, height: this.height },
        }, options || {});

        if (options.color.value) {
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

    /*Method to render all the queued drawings*/
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
        var color = _convertToRgba(background.color.value, background.color.opacity);
        context.save();
        context.fillStyle = color;
        context.fillRect(background.color.x, background.color.y, background.color.width, background.color.height);
        context.restore();
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
            context.save();
            context.rect(background.pattern.x, background.pattern.y, background.pattern.width, background.pattern.height);
            context.globalAlpha = background.pattern.opacity;
            context.fillStyle = patternFill;
            context.fill();
            context.restore();
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
            context.save();
            context.globalAlpha = background.image.opacity;
            context.drawImage(image, background.image.clipX, background.image.clipY, clipWidth, clipHeight, background.image.x, background.image.y, width, height);
            context.restore();
            return queue.resume();
        };

        image.src = background.image.url;
    }

    // Helpers
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
                else if(typeof src[prop] != 'undefined') {
                    dest[prop] = src[prop];
                }
            }

            if (args.length > 0) {
                _extend.apply(null, [dest].concat(args));
            }
        }

        return dest;
    }

    function _convertToRgba(color, opacity) {
        opacity = typeof opacity == 'undefined' ? 1 : opacity;
        if (color.indexOf('rgba') === 0) {
            return color;
        }

        if (color.indexOf('rgb') === 0) {
            color = color.split('(');
            color[0] = color[0] + 'a';
            color = color.join('(');

            color = color.split(',');
            color[2] = color[2].split(')');
            color[2][1] = ', ' + opacity + ')';
            color[2] = color[2].join('');
            color = color.join(',');

            return color;
        }

        if (color.indexOf('#') === 0) {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function (m, r, g, b) {
                return r + r + g + g + b + b;
            });

            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result
                ? 'rgba(' + parseInt(result[1], 16).toString() + ',' + parseInt(result[2], 16).toString() + ',' + parseInt(result[3], 16).toString() + ',' + opacity + ')'
                : 'rgba(255, 255, 255, ' + opacity + ')';
        }
        else {
            throw new Error('color ' + color + ' not reccognized. Please make sure it is in the correct format. (e.g. `#fff`, `#ffffff`, `rgb(256, 256, 256)` or rgba(256, 256, 256, 0.5))');
        }
    }
})();
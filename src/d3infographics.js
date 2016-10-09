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

        this.defaults.image = {
            x: 0,
            y: 0
        };

        this.defaults.text = {
            text: false,
            font: 'sans-serif',
            style: '',          // `bold`, `italic`, `bold italic`
            size: 12,
            align: 'start',          // start|end|left|center|right
            x: 0,
            y: 0,
            color: 'rgba(0, 0, 0, 1)',
            opacity: 1
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
        if (!context) {
            throw new Error('Context must be specified while using setContext');
        }
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
        checkCanvas(this.canvas, this.context);
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
                setImage(this.context, options, this.queue);
            }, this.queue);
        }

        return this;
    };

    /*
        Method to add image.
        param: options | Object
        example: infographic.addImage({
            url: '',
            x: 0,
            y: 0,
            width: 300,
            height: 300
        })
    */
    d3i.prototype.addImage = function (options) {
        // TODO: Add code to add border to the image
        checkCanvas(this.canvas, this.context);

        options = _extend({}, this.defaults.image, options);

        if (!options.url) {
            throw new Error('addImage method requires url of image to be added');
        }

        enqueue(function () {
            setImage(this.context, options, this.queue, true);
        }, this.queue);

        return this;
    };

    /*
        This function adds text to the infographic
        example: infographic.addText({
            text: 'Praty Rocks!',
            size: 20,
            style: 'bold',      // `bold`, `italic`, `bold italic`
            x: 0,
            y: 250,
            color: 'rgb(255,25,25)',
            font: 'Courier',
            opacity: 0.7,
            align: 'center'     // start|end|left|center|right
        });
    */
    d3i.prototype.addText = function (options) {
        checkCanvas(this.canvas, this.context);

        options = _extend({}, this.defaults.text, options);

        if (!options.text) {
            throw new Error('Text needs to be present in order to use addText');
        }

        enqueue(function () {
            setText(this.context, options);
        }, this.queue);
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
                return this;
            }
        }

        return this;
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

    function setImage(context, options, queue, foreground) {
        // TODO: validate if options.image.url is a valid image URL.
        // TODO: Add support for x and y values to be negative. (calculate from right border)
        var image = document.createElement('IMG');
        var clipWidth, clipHeight, width, height;
        queue.paused = true;
        image.onload = function () {
            context.save();
            if (foreground) {
                // no clipping
                width = options.width || image.width;
                height = options.height || image.height;

                context.drawImage(image, options.x, options.y, width, height);
            }
            else {
                clipWidth = options.image.clipWidth ? options.image.clipWidth : image.width;
                clipHeight = options.image.clipHeight ? options.image.clipHeight : image.height;
                width = options.image.width ? options.image.width : image.width;
                height = options.image.height ? options.image.height : image.height;

                context.globalAlpha = options.image.opacity;
                context.drawImage(image, options.image.clipX, options.image.clipY, clipWidth, clipHeight, options.image.x, options.image.y, width, height);
            }
            context.restore();
            return queue.resume();
        };

        image.src = foreground ? options.url : options.image.url;
    }

    function setText(context, options, queue) {
        context.save();

        context.font = (options.style ? (options.style + ' ') : '') + options.size.toString() + 'pt ' + options.font;
        context.fillStyle = _convertToRgba(options.color, options.opacity);
        context.textAlign = options.align;
        context.globalAlpha = options.opacity;
        context.fillText(options.text, options.x, options.y);

        context.restore();
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
        else if (color.indexOf('rgb') === 0) {
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
        else if (color.indexOf('#') === 0) {
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
            // can be something like 'lightgray'
            return color;
        }
    }

    function checkCanvas(canvas, context) {
        if (!canvas || !context) {
            throw new Error('You need to first create canvas or set context');
        }
    }
})();
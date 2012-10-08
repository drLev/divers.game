Diver = {};

Diver.apply = function(a, b, onlyNew){
    if (a && b && typeof b == 'object'){
        for (var p in b){
            if (!onlyNew || a[p] == undefined){
                a[p] = b[p];
            }
        }
    }
    return a;
};

(function(){
    Diver.apply(Diver, {
        extend: function(){
            var io = function(o){
                for (var m in o){
                    this[m] = o[m];
                }
            }
            return function(sp, overrides){
                var sb = function(){sp.apply(this, arguments);};
                var F = function(){}, sbp, spp = sp.prototype;
                F.prototype = spp;
                sbp = sb.prototype = new F();
                sbp.constructor=sb;
                sb.superclass=spp;
                if(spp.constructor == Object.prototype.constructor){
                    spp.constructor=sp;
                }
                sb.override = function(o){
                    Diver.override(sb, o);
                };
                sbp.override = io;
                if (overrides.mixins){
                    for(var i = 0; i < overrides.mixins.length; i++){
                        var mixin = overrides.mixins[i];
                        if (typeof mixin == 'object'){
                            Diver.override(sb, mixin);
                        }
                    }
                }
                Diver.override(sb, overrides);
                return sb;
            };
        }()
        , override : function(origclass, overrides){
            if(overrides){
                var p = origclass.prototype;
                for(var method in overrides){
                    if (method == 'mixins'){
                        if (p[method]){
                            p[method] = p[method].concat(overrides[method]);
                        }else{
                            p[method] = overrides[method];
                        }
                    }else{
                        p[method] = overrides[method];
                    }
                }
            }
        }
    });
})();

Diver.Base = function(config){
    if (config && config.mixins){
        for (var i = 0; i < config.mixins.length; i++){
            Diver.apply(this, config.mixins[i]);
        }
    }
    Diver.apply(this, config);
    this.init();
};

Diver.Base.prototype = {
    name: 'base'
    , id: 0
    , el: null
    , mixins: []
    , init: function(){
        for (var i = 0; i < this.mixins.length; i++){
            var mixin = this.mixins[i];
            if (mixin.initMixin){
                mixin.initMixin.apply(this, arguments)
            }
        }
    }
};

Diver.mixins = {};

Diver.mixins.Observable = {
    observers: null
    , isObservable: true
    , initMixin: function(){
        this.observers = {};
    }
    , on: function(event, func, scope) {
        var params = {
            func: func
        };
        params.scope = scope || window; 
        if (this.observers[event]) {
            this.observers[event].push(params);            
        } else {
            this.observers[event] = [params];
        }
        return this;
    }
    , fireEvent: function(event){
        var subscribers = this.observers[event] || []; 
        var params = Array.prototype.slice.call(arguments, 1);
        for (var i = 0; i < subscribers.length; i++)  {
            subscribers[i].func.apply(subscribers[i].scope, params);
        }
    }
};

Diver.Canvas = {
    context: null
    , mixins: [Diver.mixins.Observable]
    , drawObjects: null
    , interval: 50
    , intervalId: null
    , width: 0
    , height: 0
    , init: function(){
        Diver.Canvas.superclass.init.apply(this, arguments);
        this.drawObjects = [];
        var self = this;
        this.el = document.getElementById(this.id);
        this.el.addEventListener('click', function(e){
            var x = 0;
            var y = 0;
            if (e.offsetX != undefined && e.offsetY != undefined){
                x = e.offsetX;
                y = e.offsetY;
            }else{
                x = e.layerX - e.target.offsetLeft;
                y = e.layerY - e.target.offsetTop;
              }
            self.onCanvasClick(x, y, e);
        });
        this.context = this.el.getContext("2d");
    }
    , getWidth: function(){
        return this.el.width;
    }
    , getHeight: function(){
        return this.el.height;
    }
    , onCanvasClick: function(x, y, e){
        this.fireEvent('click', x, y, e);
    }
    , add: function(obj){
        this.drawObjects.push(obj);
        this.drawObjects.sort(function(a, b){
            if (a.getZIndex() < b.getZIndex()){
                return -1;
            }else{
                return 1;
            }
        });
    }
    , drawFrame: function(){
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        for (var i = 0; i < this.drawObjects.length; i++){
            var obj = this.drawObjects[i];
            if (obj.isDrawable){
                var data = obj.getDrawData();
                this.context.moveTo(0, 0);
                this.context.drawImage(data.img, data.x, data.y);
            }
        }
    }
    , play: function(){
        if (!this.intervalId){
            var self = this;
            this.intervalId = setInterval(function(){self.drawFrame.apply(self)}, this.interval);
        }
    }
    , stop: function(){
        if (this.inervalId){
            clearInterval(this.intervalId);
        }
    }
};

Diver.Canvas = Diver.extend(Diver.Base, Diver.Canvas);

Diver.mixins.Drawable = {
    src: ''
    , x: 0
    , y: 0
    , width: 0
    , height: 0
    , el: null
    , isDrawable: true
    , initMixin: function(){
        this.el = new Image();
        this.setSrc(this.src);
    }
    , setSrc: function(src){
        this.src = src;
        this.el.src = this.src;
    }
    , getX: function(){
        return this.x;
    }
    , getY: function(){
        return this.y;
    }
    , getWidth: function(){
        return this.width;
    }
    , getHeight: function(){
        return this.height;
    }
    , getDrawData: function(){
        return {
            x: this.x
            , y: this.y
            , img: this.el
        };
    }
    , getZIndex: function(){
        return 0;
    }
};

Diver.mixins.Movable = new (function(){

    this.speed = 0;
    this.x = 0;
    this.y = 0
    this.interval = 50
    this.isMovable = true
    this.srcUp = ''
    this.srcDown = ''
    this.srcLeft = ''
    this.srcRight = ''

    this.intervalId = undefined;

    var moveSide = function(side, length, callback, scope){
        
        var from = 0;
        var to = 0;
        switch(side){
            case 'up':
                from = this.y;
                to = this.y - length;
                break;
            case 'down':
                from = this.y;
                to = this.y + length;
                break;
            case 'left':
                from = this.x;
                to = this.x - length;
                break;
            case 'right':
                from = this.x;
                to = this.x + length;
                break;
            default:
                return;
        }

        var self = this;
        var start = new Date().getTime();
        var duration = (Math.abs(to - from) / this.speed) * 1000;

        var setCoordValue = function(value){
            switch(side){
                case 'up':
                case 'down':
                    self.y = value;
                    break;
                case 'left':
                case 'right':
                    self.x = value;
                    break;
            }
        }

        self.intervalId = setInterval(function(){
            var now = (new Date().getTime()) - start;
            var progress = now / duration;

            if (progress > 1){
                setCoordValue(to);
                clearInterval(self.intervalId);
                if (self.isObservable){
                    self.fireEvent('endmove', side, to);
                }
                callback.call(scope || window, side, to);
                return;
            }

            var result = (to - from) * progress + from;

            setCoordValue(result);
            if (self.isObservable){
                self.fireEvent('move', side, result);
            }
        }, self.interval);
    }

    this.initMixin = function(){
        this.srcUp = this.srcUp || this.src;
        this.srcDown = this.srcDown || this.src;
        this.srcLeft = this.srcLeft || this.src;
        this.srcRight = this.srcRight || this.src;
        this.queue = [];
    }
    this.stop = function(){
        if (this.isObservable){
            this.fireEvent('endmove', '', this.x);
        }
        clearInterval(this.intervalId);
    }
    this.move = function(side, length, callback, scope){
        switch(side){
            case 'up': this.setSrc(this.srcUp); break;
            case 'down': this.setSrc(this.srcDown); break;
            case 'left': this.setSrc(this.srcLeft); break;
            case 'right': this.setSrc(this.srcRight); break;
        }
        moveSide.call(this, side, length, callback, scope);
    }
});

Diver.Component = {
    mixins: [Diver.mixins.Movable, Diver.mixins.Drawable]
    , init: function(){
        Diver.Component.superclass.init.apply(this, arguments);
    }
};

Diver.Component = Diver.extend(Diver.Base, Diver.Component);
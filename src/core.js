Diver = {};

Diver.apply = function(a, b){
    if (a && b && typeof b == 'object'){
        for (var p in b){
            a[p] = b[p];
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
                    p[method] = overrides[method];
                }
            }
        }
    });
})();

Diver.Base = function(config){
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
    observers: {}
    , isObservable: true
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
            var x = e.layerX - e.target.offsetLeft;
            var y = e.layerY - e.target.offsetTop;
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

Diver.extend(Diver.Base, Diver.Canvas);

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

Diver.mixins.Movable = (function(){
    var moveSide = function(side, length){
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
        var duration = ((to - from) / this.speed) * 1000;
        
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
                
        setTimeout(function(){
            var now = (new Date().getTime()) - start;
            var progress = now / duration;
            
            if (progress > 1){
                setCoordValue(to);
                return;
            }
            
            var result = (to - from) * progress + from;
            
            setCoordValue(result)
            if (progress < 1){
                setTimeout(arguments.callee, self.interval);
            }
        }, self.interval);

    }
    return {
        speed: 0
        , x: 0
        , y: 0
        , interval: 50
        , isMovable: true
        , up: function(length){
            moveSide.call(this, 'up', length);
        }
        , down: function(length){
            moveSide.call(this, 'down', length);
        }
        , left: function(length){
            moveSide.call(this, 'left', length);
        }
        , right: function(length){
            moveSide.call(this, 'right', length);
        }
    }
})();

Diver.Component = {
    mixins: [Diver.mixins.Movable, Diver.mixins.Drawable]
    , init: function(){
        Diver.Component.superclass.init.apply(this, arguments);
    }
};

Diver.Component = Diver.extend(Diver.Base, Diver.Component);
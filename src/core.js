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
    , on: function(event, func, scope, single) {
        var params = {
            func: func
            , scope: scope || window
            , single: single === true
        };

        if (this.observers[event]) {
            this.observers[event].push(params);
        } else {
            this.observers[event] = [params];
        }
        return this;
    }
    , un: function(event, func, scope){
        scope = scope || window;
        if (this.observers[event]) {
            var i = this.observers[event].length;
            var o;
            while(i--){
                o = this.observers[event][i];
                if(o){
                    if(o.func == func && o.scope == scope){
                        this.observers[event].splice(i, 1);
                    }
                }
            }
        }
    }
    , fireEvent: function(event){
        var subscribers = this.observers[event] || []; 
        var params = Array.prototype.slice.call(arguments, 1);
        var singleSubscribers = [];
        for (var i = 0; i < subscribers.length; i++)  {
            var subscriber = subscribers[i];
            subscriber.func.apply(subscribers[i].scope, params);
            if (subscriber.single){
                singleSubscribers.push(subscriber);
            }
        }
        for (var i = 0; i < singleSubscribers.length; i++){
            var unSubscriber = singleSubscribers[i];
            this.un(event, unSubscriber.func, unSubscriber.scope);
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

Diver.mixins.Movable = {
    isMovable: true
    , speed: 0
    , x: 0
    , y: 0
    , interval: 50
    , srcUp: ''
    , srcDown: ''
    , srcLeft: ''
    , srcRight: ''

    , _intervalId: undefined
    , _queueArr: undefined
    , _currentAcrion: undefined

    , initMixin: function(){
        this.srcUp = this.srcUp || this.src;
        this.srcDown = this.srcDown || this.src;
        this.srcLeft = this.srcLeft || this.src;
        this.srcRight = this.srcRight || this.src;
        this._queueArr = [];
    }
    , _moveSide: function(side, length){
        this._stop();
        this._setSideSrc(side);

        var self = this;

        var start = new Date().getTime();
        var duration = (Math.abs(length) / this.speed) * 1000;

        var sign = (side == 'up' || side == 'left') ? -1 : 1;
        var coordinate = (side == 'up' || side == 'down') ? 'y' : 'x';
        var from = this[coordinate];
        var to = this[coordinate] + length * sign;

        this._intervalId = setTimeout(function(){
            var now = (new Date().getTime()) - start;
            var progress = now / duration;
            
            if (progress >= 1){
                self[coordinate] = to;
                if (self.isObservable){
                    self.fireEvent('endmove', self, side);
                }
                self._queueEnd();
                return;
            }
            
            var result = Math.round(length * progress) * sign + from;
            
            self[coordinate] = result;
            if (self.isObservable){
                self.fireEvent('move', self, side);
            }
            setTimeout(arguments.callee, self.interval);
        }, this.interval);
    }
    , _setSideSrc: function(side){
        switch(side){
            case 'up': this.setSrc(this.srcUp); break;
            case 'down': this.setSrc(this.srcDown); break;
            case 'left': this.setSrc(this.srcLeft); break;
            case 'right': this.setSrc(this.srcRight); break;
        }
    }
    , _stop: function(){
        clearTimeout(this.intervalId);
    }
    , _wait: function(time){
        this._stop();
        var self = this;
        this.intervalId = setTimeout(function(){
            self._queueEnd();
        }, time);
    }
    , _queueEnd: function(){
        var a = this._currentAcrion;
        this._currentAcrion = undefined;
        if (a && a.callback){
            switch (a.type){
                case 'move': a.callback.call(a.scope || window, this, a.side); break;
                case 'wait': a.callback.call(a.scope || window, this, a.time); break;
            }
        }
        this._queueRun();
    }
    , _queueRun: function(){
        if (!this._currentAcrion){
            var a = this._queueArr.shift();
            if (a){
                this._currentAcrion = a;
                switch(a.type){
                    case 'move': this._moveSide(a.side, a.length); break;
                    case 'wait': this._wait(a.time); break;
                }
            }
        }
    }
    , _queueAdd: function(action){
        this._queueArr.push(action);
        if (!this._currentAcrion){
            this._queueRun();
        }
    }
    , move: function(side, length, callback, scope){
        this._queueAdd({
            type: 'move'
            , side: side
            , length: length
            , callback: callback
            , scope: scope
        });
        return this;
    }
    , wait: function(time, callback, scope){
        this._queueAdd({
            type: 'wait'
            , time: time
            , callback: callback
            , scope: scope
        });
        return this;
    }
}

Diver.Component = {
    mixins: [Diver.mixins.Movable, Diver.mixins.Drawable]
    , init: function(){
        Diver.Component.superclass.init.apply(this, arguments);
    }
};

Diver.Component = Diver.extend(Diver.Base, Diver.Component);
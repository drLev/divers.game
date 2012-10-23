Diver = {
    apply: function(a, b, onlyNew){
        if (a && b && typeof b == 'object'){
            for (var p in b){
                if (!onlyNew || a[p] == undefined){
                    a[p] = b[p];
                }
            }
        }
        return a;
    }
    , extend: function(){
        var io = function(o){
            for (var m in o){
                this[m] = o[m];
            }
        }
        return function(sp, overrides){
            overrides.$class = sp;
            var sb = function(){sp.apply(this, arguments);};
            var F = function(){}, sbp, spp = sp.prototype;
            F.prototype = spp;
            sbp = sb.prototype = new F();
            sbp.constructor=sb;
            sb.$parent = spp;
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
                    if (Diver.isObject(mixin)){
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
    , arrayRemove: function(array, item){
        var i = array.length;
        while(i--){
            if (array[i] == item){
                Diver.arrayRemoveAt(array, i);
            }
        }
    }
    , arrayRemoveBy: function(array, propName, propValue){
        var i = array.length;
        while (i--){
            if (Diver.isString(propName)) {
                if (array[i][propName] == propValue){
                    Diver.arrayRemoveAt(array, i);
                }
            }else if (Diver.isFunction(propName)) {
                if (propName.call(propValue || window, array[i])){
                    Diver.arrayRemoveAt(array, i);
                }
            }else if (Diver.isObject(propName)) {
                var flag = true;
                for (var n in propName){
                    if (array[i][n] != propName[n]) {
                        flag = false;
                    }
                }
                if (flag){
                    Diver.arrayRemoveAt(array, i);
                }
            }
        }
    }
    , arrayRemoveAt: function(array, i){
        array.splice(i, 1);
    }
    , isFunction: function(f){
        return toString.call(f) == '[object Function]' || typeof f == 'function';
    }
    , isObject: function(o){
        return toString.call(o) == '[object Object]' && typeof o == 'object';
    }
    , isArray: function(a){
        return toString.call(a) == '[object Array]';
    }
    , isNull: function(v){
        return typeof v == 'undefined' || toString.call(v) == '[object Null]';
    }
    , isNumber: function(n){
        return typeof n == 'number';
    }
    , isString: function(s){
        return typeof s == 'string';
    }
    , getInt: function(a, def){
        return parseInt(a) || def || 0;
    }
};

Diver.Base = function(config){
    if (config && config.mixins){
        for (var i = 0; i < config.mixins.length; i++){
            Diver.apply(this, config.mixins[i]);
        }
    }
    Diver.apply(this, config);
    this.init(config);
};

Diver.Base.prototype = {
    name: 'base'
    , $class: Object
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
    , callParent: function(){
        var methodName;
        for (var n in this){
            if (this[n] == this.callParent.caller){
                methodName = n;
                break;
            }
        }

        if (Diver.isString(methodName)){
            var args = this.callParent.caller.arguments;
            if (this.$class.$parent && this.$class.$parent[methodName]){
                return this.$class.$parent[methodName].apply(this, args);
            }else if(this.$class.prototype && this.$class.prototype[methodName]){
                return this.$class.prototype[methodName].apply(this, args);
            }else if(Diver.isArray(this.mixins)){
                for (var i = 0; i < this.mixins.length; i++){
                    if (Diver.isFunction(this.mixins[i][methodName])){
                        return this.mixins[i][methodName].apply(this, args);
                    }
                }
            }
            console.warn('method ' + methodName + ' not found in', this);
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

        if (Diver.isArray(this.observers[event])) {
            this.observers[event].push(params);
        } else {
            this.observers[event] = [params];
        }
        return this;
    }
    , un: function(event, func, scope){
        scope = scope || window;
        if (Diver.isArray(this.observers[event])) {
            Diver.arrayRemoveBy(this.observers[event], {
                func: func
                , scope: scope
            });
        }
    }
    , fireEvent: function(event){
        var subscribers = [];
        var params = Array.prototype.slice.call(arguments, 1);
        var subscriber;
        this.observers[event] = this.observers[event] || [];

        for (var i = 0; i < this.observers[event].length; i++){
            subscriber = this.observers[event][i];
            subscribers.push(subscriber);
            if (subscriber.single){
                this.un(event, subscriber.func, subscriber.scope);
            }
        }

        for (i = 0; i < subscribers.length; i++)  {
            subscriber = subscribers[i];
            subscriber.func.apply(subscriber.scope, params);
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
        this.callParent();
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
        this.sortObjects();
    }
    , sortObjects: function(){
        this.drawObjects.sort(function(a, b){
            if (a.getZIndex() < b.getZIndex()){
                return -1;
            }else{
                return 1;
            }
        });
    }
    , remove: function(obj){
        Diver.arrayRemove(this.drawObjects, obj);
    }
    , drawObject: function(obj){
        var data;
        if (obj.isComposite){
            obj.eachItems(function(item){
                if (item.getZIndex() < 0){
                    this.drawObject(item);
                }
            }, this);
        }
        if (obj.isDrawable && obj.isTransform){
            data = obj.getDrawData();
            if (data.hidden){
                return;
            }
            var transform = obj.getTransformData();
            this.context.save();
            this.context.translate(data.x + data.img.width/2, data.y + data.img.height/2);
            this.context.globalAlpha = transform.alpha;
            if (transform.mirrorH){
                this.context.scale(-1, 1);
            }
            if (transform.mirrorV){
                this.context.scale(1, -1);
            }
            var toRadians = Math.PI / 180;
            this.context.rotate(toRadians * transform.angle);
            this.context.drawImage(data.img, -data.img.width/2, -data.img.height/2);
            this.context.restore();
        }else if(obj.isDrawable){
            data = obj.getDrawData();
            if (data.hidden){
                return;
            }
            this.context.drawImage(data.img, data.x, data.y);
        }else if(obj.isDrawableText){
            data = obj.getTextData();
            if (data.hidden){
                return;
            }
            var fontSize = data.fontSize;

            fontSize += (typeof data.fontize == 'number')? 'px' : '';

            this.context.fillStyle = data.color;
            this.context.font = data.fontSize + data.fontFamily;
            this.context.textAlign = data.align;

            if (data.wrap){
                this._wrapText(data.text, data.x, data.y, data.maxWidth, data.lineHeight, data.wordSeparator);
            }else{
                this.context.fillText(data.text, data.x, data.y);
            }

        }
        if (obj.isComposite){
            obj.eachItems(function(item){
                if (item.getZIndex() >= 0){
                    this.drawObject(item);
                }
            }, this);
        }
    }
    , drawFrame: function(){
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        for (var i = 0; i < this.drawObjects.length; i++){
            var obj = this.drawObjects[i];
            if (obj.isDrawable){
                this.context.moveTo(0, 0);
                this.drawObject(obj);
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
    , _wrapText: function (text, x, y, maxWidth, lineHeight, wordSeparator) {
        wordSeparator = wordSeparator == undefined ? ' ' : wordSeparator;
        var words = text.split(wordSeparator);
        var line = "";

        for(var n = 0; n < words.length; n++){
            var testLine = line + words[n] + wordSeparator;
            var metrics = this.context.measureText(testLine);
            var testWidth = metrics.width;
            if(testWidth > maxWidth) {
                this.context.fillText(line, x, y);
                line = words[n] + wordSeparator;
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        this.context.fillText(line, x, y);
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
    , hidden: false
    , zIndex: 0
    , initMixin: function(){
        var self = this;
        this.el = new Image();
        this.el.onload = function(){
            self.width = self.el.width;
            self.height = self.el.height;
        };
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
    , setPos: function(a, b, c, d){
        var x, y, offsetX, offsetY;
        if (Diver.isObject(a)){
            x = Diver.getInt(a.x, this.x);
            y = Diver.getInt(a.y, this.y);
            if (Diver.isObject(b)){
                offsetX = Diver.getInt(b.x);
                offsetY = Diver.getInt(b.y);
            }else{
                offsetX = Diver.getInt(b);
                offsetY = Diver.getInt(c);
            }
        }else{
            x = Diver.getInt(a, this.x);
            y = Diver.getInt(b, this.y);
            offsetX = Diver.getInt(c);
            offsetY = Diver.getInt(d);
        }

        this.x = x + (offsetX || 0);
        this.y = y + (offsetY || 0);
        return this;
    }
    , getPos: function(){
        return {
            x: this.x
            , y: this.y
        };
    }
    , getCenter: function(){
        return {
            x: this.x + this.width / 2
            , y: this.y + this.height / 2
        }
    }
    , getWidth: function(){
        return this.width;
    }
    , getHeight: function(){
        return this.height;
    }
    , getDrawData: function(){
        return {
            x: this.x - this.width / 2
            , y: this.y - this.height /2
            , img: this.el
            , hidden: this.hidden
        };
    }
    , getZIndex: function(){
        return this.zIndex;
    }
    , show: function(){
        this.hidden = false;
    }
    , hide: function(){
        this.hidden = true;
    }
};

Diver.mixins.TransformImage = {
    isTransform: true
    , angle: 0
    , mirrorH: false
    , mirrorV: false
    , scale: 1
    , alpha: 1

    , getTransformData: function(){
        return {
            angle: this.angle
            , mirrorH: this.mirrorH
            , mirrorV: this.mirrorV
            , scale: this.scale
            , alpha: this.alpha
        };
    }
}

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
    , moving: false
    , direction: '' // up, down, left, right

    , _moveIntervalId: undefined
    , _queueArr: undefined
    , _currentAction: undefined

    , initMixin: function(){
        this.srcUp = this.srcUp || this.src;
        this.srcDown = this.srcDown || this.src;
        this.srcLeft = this.srcLeft || this.src;
        this.srcRight = this.srcRight || this.src;
        this._queueArr = [];
    }
    , _move: function(side, length){
        switch(side){
            case 'up':
                this._moveTo(this.x, this.y - length);
                break;
            case 'down':
                this._moveTo(this.x, this.y + length);
                break;
            case 'left':
                this._moveTo(this.x - length, this.y);
                break;
            case 'right':
                this._moveTo(this.x + length, this.y);
                break;
        }
        this.moving = false;
    }
    , _moveTo: function(x, y){
        this._stop();
        this.moving = true;
        x = Diver.getInt(x, this.x);
        y = Diver.getInt(y, this.y);

        var self = this
        , start = new Date().getTime()
        , from = {x: this.x, y: this.y}
        , to = {x: x, y: y}
        , lengthX = to.x - from.x
        , lengthY = to.y - from.y
        , length = Math.sqrt(lengthX * lengthX + lengthY * lengthY)
        , duration = (Math.abs(length) / this.speed) * 1000;

        if (Math.abs(lengthX) > Math.abs(lengthY)){
            if (lengthX < 0){
                this._setSideSrc('left');
            }else{
                this._setSideSrc('right');
            }
        }else if(Math.abs(lengthX) < Math.abs(lengthY)){
            if (lengthY < 0){
                this._setSideSrc('up');
            }else{
                this._setSideSrc('down');
            }
        }

//        Diver.log('start move from', from, 'to', to);

        this._moveIntervalId = setTimeout(function(){
            var now = (new Date().getTime()) - start,
                progress = duration == 0 ? 1 : now / duration;

            if (progress >= 1){
//                Diver.log('stop move from', from, 'to', to);
                self.setPos(to.x, to.y);
                self.moving = false;
                if (self.isObservable){
                    self.fireEvent('endmove', self);
                }
                self._queueEnd();
                return;
            }

            var resultX = Math.round(lengthX * progress) + from.x,
                resultY = Math.round(lengthY * progress) + from.y;

//                Diver.log(resultX, resultY);

            self.setPos(resultX, resultY);
            if (self.isObservable){
                self.fireEvent('move', self);
            }
            self._moveIntervalId = setTimeout(arguments.callee, self.interval);
        }, this.interval);
    }
    , _setSideSrc: function(side){
//        Diver.log(side);
        this.direction = side;
        switch(side){
            case 'up': this.setSrc(this.srcUp); break;
            case 'down': this.setSrc(this.srcDown); break;
            case 'left': this.setSrc(this.srcLeft); break;
            case 'right': this.setSrc(this.srcRight); break;
        }
    }
    , _stop: function(){
//        Diver.log('stopped moving');
        clearTimeout(this._moveIntervalId);
    }
    , _wait: function(time){
        this._stop();
        var self = this;
        this.intervalId = setTimeout(function(){
            self._queueEnd();
        }, time);
    }
    , _queueEnd: function(stopCallback){
//        Diver.log('queue end with stopCallback =', stopCallback);
        var a = this._currentAction;
        this._currentAction = undefined;
        if (a && a.callback && stopCallback !== true){
            switch (a.type){
                case 'move': a.callback.call(a.scope || window, this); break;
                case 'moveto': a.callback.call(a.scope || window, this); break;
                case 'wait': a.callback.call(a.scope || window, this); break;
            }
        }
        this._queueRun();
    }
    , _queueRun: function(){
        if (!this._currentAction && this._queueArr.length){
            var a = this._queueArr.shift();
            if (a){
                this._currentAction = a;
                switch(a.type){
                    case 'move': this._move(a.side, a.length); break;
                    case 'moveto': this._moveTo(a.x, a.y); break;
                    case 'wait': this._wait(a.time); break;
                }
            }
        }
    }
    , _queueAdd: function(action){
        this._queueArr.push(action);
        if (!this._currentAction){
            this._queueRun();
        }
    }
    , _queueStop: function(stopCallback){
        this._queueArr = [];
        this._queueEnd(stopCallback);
    }
    , moveTo: function(x, y, callback, scope){
        x = Diver.getInt(x, this.x);
        y = Diver.getInt(y, this.y);
        this._queueAdd({
            type: 'moveto'
            , x: x
            , y: y
            , callback: callback
            , scope: scope
        });
        return this;
    }
    , move: function(side, length, callback, scope){
        length = Diver.getInt(length);
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
        time = Diver.getInt(time);
        this._queueAdd({
            type: 'wait'
            , time: time
            , callback: callback
            , scope: scope
        });
        return this;
    }
    , stop: function(stopCallback){
        this._stop(stopCallback);
        this._queueStop(stopCallback);
    }
}

Diver.Component = {
    mixins: [Diver.mixins.Movable, Diver.mixins.Drawable]
    , init: function(){
        this.callParent();
    }
    , destroy: function(){
        this.stop();
        Diver.Game.removeDrawObject(this);
        delete this;
    }
};

Diver.Component = Diver.extend(Diver.Base, Diver.Component);

Diver.mixins.Resource = {
    isResource: true
    , resUseSpeed: 50
    , resVolume: 3000
    , resValue: 3000
    , resDangerLevel: 1000
    , resInterval: 100
    , _resIntervalId: null
    , initMixin: function(){
        this.resValue = this.resVolume;
    }
    , resStartUse: function(){
        this.resStopUse();
        var self = this;
        this._resIntervalId = setInterval(function(){
            self.resUse();
        }, this.resInterval);
    }
    , resStopUse: function(){
        clearInterval(this._resIntervalId);
    }
    , resUse: function(){
        this.resValue -= this.resGetUseSpeed() * this.resInterval / 1000;
        this.resCheckDangerLevel();
    }
    , resGetUseSpeed: function(){
        return this.resUseSpeed;
    }
    , resGetDangerLevel: function(){
        return this.resDangerLevel;
    }
    , resCheckDangerLevel: function(){
        if (this.resValue <= this.resGetDangerLevel()){
            if (this.isObservable){
                this.fireEvent('resdanger', this);
            }
        }
        return true;
    }
    , resUseOnce: function(value){
        this.resValue -= value;
        this.resCheckDangerLevel();
    }
    , resGetEmptySize: function(){
        return this.resVolume - this.resValue;
    }
    , resSetFull: function(){
        this.resValue = this.resVolume;
    }
}

Diver.mixins.DrawableText = {
    isDrawableText: true
    , textColor: ''
    , fontSize: '12px'
    , fontFamily: 'Tahoma'
    , text: ''
    , textAlign: 'left'
    , x: 0
    , y: 0
    , maxWidth: 0
    , lineHeight: 0
    , wrapText: false
    , wordSeparator: ' '
    , hidden: false
    , zIndex: 0
    , getTextData: function(){
        return {
            color: this.textColor
            , fontSize: this.fontSize
            , fontFamily: this.fontFamily
            , text: this.text
            , x: this.x
            , y: this.y
            , maxWidth: this.maxWidth
            , lineHeight: this.lineHeight
            , align: this.textAlign
            , wrap: this.wrapText
            , wordSeparator: this.wordSeparator
            , hidden: this.hidden
        }
    }
    , getZIndex: function(){
        return this.zIndex;
    }
    , setPos: function(){
        Diver.mixins.Drawable.setPos.apply(this, arguments);
    }
    , getPos: function(){
        return Diver.mixins.Drawable.getPos.apply(this, arguments);
    }
}

Diver.mixins.Composite = {
    items: null
    , isComposite: true
    , initMixin: function(){
        this.items = [];
    }
    , eachItems: function(func, scope){
        for (var i = 0; i < this.items.length; i++){
            func.call(scope || window, this.items[i], i, this);
        }
    }
    , addItem: function(item){
        this.items.push(item);
    }
    , removeItem: function(item){
        Diver.arrayRemove(this.items, item);
    }
}
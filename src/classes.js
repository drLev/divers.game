Diver.Ship = {
    loaded: false
    , loadIndicator: null
    , loadSrc: 'ship-load.png'
    , loadIndicatorX: 0
    , loadIndicatorY: 0
    , trosTopX: 0
    , trosTopY: 0
    , trosBottomX: 0
    , trosBottomY: 0
    , compressorSpeed: 3000

    , _currentCompressorDiver: null
    , _diversCompressorQueue: null
    , init: function(){
        Diver.Ship.superclass.init.apply(this, arguments);
        this._diversCompressorQueue = [];
        this.loadIndicator = new Diver.Base({
            mixins: [Diver.mixins.Drawable]
            , x: this.loadIndicatorX
            , y: this.loadIndicatorY
            , src: this.loadSrc
            , hidden: true
            , getZIndex: function(){
                return '0';
            }
        });

        Diver.Game.addDrawObject(this.loadIndicator)
    }
    , setLoaded: function(loaded){
        this.loaded = loaded;
        this.loadIndicator.hidden = !this.loaded;
    }
    , load: function(stars){
        if (!this.loaded && stars.length > 0){
            this.setLoaded(true);
        }
        for (var i = 0; i < stars.length; i++){
            Diver.Game.removeStar(stars[i]);
        }
    }
    , getMark: function(no){
        var pos = {
            x: null
            , y: null
            , wait: 0
        }
        , height = this.trosBottomY - this.trosTopY;
        switch(no){
            case 1:
                pos.x = this.trosTopX;
                pos.y = (height / 3) * 2 + this.trosTopY;
                pos.wait = 500;
                break;
            case 2:
                pos.x = this.trosTopX;
                pos.y = (height / 3) + this.trosTopY;
                pos.wait = 1000;
                break;
            case 3:
                pos.x = this.trosTopX;
                pos.y = (height / 5) + this.trosTopY
                pos.wait = 1500;
                break;
        }
//        Diver.log(pos);
        return pos;
    }
    , _loadBallon: function(){
        if (this._currentCompressorDiver){
            var timeout = (this._currentCompressorDiver.diver.resGetEmptySize() / this.compressorSpeed) * 1000;
            var self = this;
            setTimeout(function(){
                self._currentCompressorDiver.diver.resSetFull();
                self._endLoadBallonQueue();
            }, timeout);
        }
    }
    , _endLoadBallonQueue: function(){
        var a = this._currentCompressorDiver;
        this._currentCompressorDiver = null;
        if(a && a.callback){
            a.callback.call(a.scope || window);
        }
        this._runLoadBallonQueue();
    }
    , _runLoadBallonQueue: function(){
        if (!this._currentCompressorDiver && this._diversCompressorQueue.length > 0){
            var a = this._diversCompressorQueue.shift();
            if (a){
                this._currentCompressorDiver = a;
                this._loadBallon();
            }
        }
    }
    , loadBalloon: function(diver, callback, scope){
        this._diversCompressorQueue.push({
            diver: diver
            , callback: callback
            , scope: scope
        });

        this._runLoadBallonQueue();
    }
};

Diver.Ship = Diver.extend(Diver.Base, Diver.Ship);

Diver.Star = {
    srcPattern: 'res/img/tf-star{value}.png'
    , mixins: [Diver.mixins.Observable]
    , speed: 80
    , value: 0
    , width: 0
    , height: 0
    , depth: 0
    , realZIndexFn: null
    , init: function (){
        this.value = Math.ceil(Math.random() * 10);
        this.src = this.srcPattern.replace('{value}', this.value);
        Diver.Star.superclass.init.apply(this, arguments);
        this.realZIndexFn = this.getZIndex;
        this.fall();
    }
    , fall: function(){
        if (this.depth < this.y){
            this.y = this.depth;
        }else{
            this.moveTo(this.x, this.depth);
        }
    }
    , getZIndex: function(){
        return '-' + this.depth + this.x + this.id;
    }
};

Diver.Star = Diver.extend(Diver.Component, Diver.Star);

Diver.Radio = {
    mixins: [Diver.mixins.Observable]
    , sendMessage: function(msg){
        this.fireEvent('message', msg);
    }
}

Diver.Radio = Diver.extend(Diver.Base, Diver.Radio);

Diver.Radio = new Diver.Radio();

Diver.Diver = {
    mixins: [Diver.mixins.Observable, Diver.mixins.Resource]
    , src: 'res/img/Diver-go-harvest.png'
    , srcUp: 'res/img/Diver-tros.png'
    , srcDown: 'res/img/Diver-go-harvest.png'
    , srcLeft: 'res/img/Diver-go-harvest.png'
    , srcRight: 'res/img/Diver-go-home.png'
    , speed: 20
    , action: ''
    , visibleDuration: 0
    , depth: 0
    , markedStars: null
    , srcDirection: ''
    , compensatorNeedForDiver: 50
    , compensatorNeedForStar: 50
    , needLoadBalloon: false
    , tip: null
    , tipSrc: false
    , killing: false

    , stars: null
    , currentStar: null

    , _searchInterval: null
    , init: function(){
        this.stars = [];
        this.markedStars = this.markedStars || [];

        Diver.Radio.on('message', this.receiveMessage, this);

        this.visibleDuration = Diver.Game.getWidth() / 3;
        var ship = Diver.Game.getShip();
        this.x = ship.trosTopX;
        this.y = ship.trosTopY;
        Diver.Diver.superclass.init.apply(this, arguments);
        this.depth = ship.trosBottomY;
        this.on('move', this.onMove, this);
        this.goHarvest();
    }
    , _setSideSrc: function(side){
        this.srcDirection = this.srcDirection || side;
        Diver.Diver.superclass._setSideSrc.call(this, this.srcDirection);
    }
    , receiveMessage: function(msg){
        msg = msg || {};
        msg.type = msg.type || 'none';
        msg.sender = msg.sender || this;

        if (msg.sender == this){
            return;
        }

        switch (msg.type){
            case 'markStar':
                if (typeof msg.data == 'number'){
                    this.markStar(msg.data, true);
                }
                break;
            case 'unMarkStar':
                if (typeof msg.data == 'number'){
                    this.unMarkStar(msg.data, true);
                }
                break;
        }
    }
    , goHarvest: function(){
        this.action = 'goharvest';
//        Diver.log(this.action);
        this.un('resdanger', this.onDangerOxygenLevel, this);
        this.on('resdanger', this.onDangerOxygenLevel, this, true);
        this.resStartUse();
        this.srcDirection = 'down';
        this.moveTo(this.x, this.depth, this.swimingOnBottom, this);
    }
    , onDangerOxygenLevel: function(){
//        Diver.log(this.id, 'DANGER!!!');
        if (this.currentStar){
            if (this.stars.indexOf(this.currentStar) < 0){
                var starId = this.currentStar.id;
                this.unMarkStar(starId);
            }
        }
        this.needLoadBalloon = true;
        this.stop(true);
        this.showTip();
        this.goHome();
    }
    , showTip: function(){
        if (!this.tip){
            var self = this;
            this.tip = new Diver.Base({
                mixins: [Diver.mixins.Drawable]
                , src: this.tipSrc
                , hidden: false
                , getZIndex: function(){
                    return self.getZIndex();
                }
            });
            Diver.Game.addDrawObject(this.tip);
        }else{
            this.tip.hidden = false;
        }
        var pos = this.getTipPos();
        this.tip.x = pos.x;
        this.tip.y = pos.y;
    }
    , hideTip: function(){
        if (this.tip){
            this.tip.hidden = true;
        }
    }
    , getTipPos: function(){
        var pos = {
            x: 0
            , y: 0
        };
        switch(this.direction){
            case 'up':
                pos.x = this.x - this.width / 2 - this.tip.width / 2 + 20;
                pos.y = this.y - this.height / 2 - this.tip.height / 2 + 10;
                break
            case 'down':
            case 'left':
                pos.x = this.x - this.width / 2 - this.tip.width / 2 + 25;
                pos.y = this.y - this.height / 2 - this.tip.height / 2 + 10;
                break;
            case 'right':
                pos.x = this.x - this.width / 2 - this.tip.width / 2 + 45;
                pos.y = this.y - this.height / 2 - this.tip.height / 2 + 10;
                break;
        }
        return pos;
    }
    , swimingOnBottom: function(side){
        this.action = 'swimingonbottom';
        var leftPos = this.visibleDuration / 2 - 1;
        var rightPos = Diver.Game.getWidth() - this.visibleDuration / 2 + 1;

        var moveLeft = function(){
            this.srcDirection = 'left';
            this.moveTo(leftPos, this.y, moveRight, this);
        }
        var moveRight = function(){
            this.srcDirection = 'right';
            this.moveTo(rightPos, this.y, moveLeft, this);
        }
        moveLeft.call(this);

        this.searchStars();
//        Diver.Game.excludeSearchStar(starId);
    }
    , searchStars: function(){
        clearTimeout(this._searchInterval);

        var self = this;

        this._searchInterval = setTimeout(function(){
            var nearestStars = Diver.Game.getNearestStars(self.x, self.visibleDuration / 2),
                nearestStar = null;

            for (var i = 0; i < nearestStars.length; i++){
                var star = nearestStars[i];
                if(self.canGetStar(star) && (!nearestStar || Math.abs(star.x - self.x) < Math.abs(nearestStar.x - self.x))){
                    nearestStar = star;
                }
            }
            if (nearestStar){
                clearTimeout(self._searchInterval);
                self.goGetStar(nearestStar);
            }else{
                self._searchInterval = setTimeout(arguments.callee, self.interval);
            }
        }, 1);
    }
    , markStar: function(starId, silent){
        if (silent !== true){
            Diver.Radio.sendMessage({
                type: 'markStar'
                , sender: this
                , data: starId
            });
        }
        if (this.markedStars.indexOf(starId) < 0){
            this.markedStars.push(starId);
        }
//        Diver.log('mark', starId, this.markedStars);
    }
    , unMarkStar: function(starId, silent){
        if (silent !== true){
            Diver.Radio.sendMessage({
                type: 'unMarkStar'
                , sender: this
                , data: starId
            });
        }
        if (this.currentStar && this.currentStar.id == starId){
            this.currentStar = null;
        }
        var index = this.markedStars.indexOf(starId);
        if (index >= 0){
            this.markedStars.splice(index, 1);
        }
    }
    , goGetStar: function(star){
        if (this.currentStar){
            return;
        }
        this.currentStar = star;
        this.markStar(star.id);
        this.stop(true);

        var x;

        if (this.x < star.x){
            this.srcDirection = 'right';
            x = star.x - this.width / 2;
        }else if(this.x > star.x){
            this.srcDirection = 'left';
            x = star.x + this.width / 2;
        }else{
            x = this.x;
        }

        var getStar = function(){

            this.action = 'gettingstar';

            star.un('endmove', getStar, this);

            this.moveTo(x, star.y - this.height / 2, this.takeStar, this).moveTo(this.x, this.depth, function(){
                this.currentStar = null;
                if (this.stars.length < 2){
                    this.swimingOnBottom();
                }else{
                    this.goHome();
                }
            }, this);
        };

        this.moveTo(x, this.y, function(){
            if (star.moving){
                star.on('endmove', getStar, this, true);
            }else{
                getStar.call(this);
            }
        }, this);
    }
    , canGetStar: function(star){
//        Diver.log(star, this.markedStars);
        return this.markedStars.indexOf(star.id) < 0;
    }
    , takeStar: function(){
        this.stars.push(this.currentStar);
        var self = this;
        this.currentStar.getZIndex = function(){
            return 'd' + (self.id * 5 + self.stars.indexOf(this) - 2);
        }
        Diver.Game.refreshObjectsZIndex();
//        Diver.log('star taken');
    }
    , onMove: function(){
//        Diver.log(this.action);
        if (this.stars.length > 0){
            switch(this.direction){
                case 'up':
                    this.stars[0].setPos(this.x + 20, this.y - this.height / 2);
                    if (this.stars.length == 2){
                        this.stars[1].setPos(this.x + 30, this.y - this.height / 2 + 20);
                    }
                    break
                case 'down':
                case 'left':
                    this.stars[0].setPos(this.x - this.width / 2, this.y);
                    if (this.stars.length == 2){
                        this.stars[1].setPos(this.x - this.width / 2, this.y + 20);
                    }
                    break;
                case 'right':
                    this.stars[0].setPos(this.x + this.width / 2, this.y);
                    if (this.stars.length == 2){
                        this.stars[1].setPos(this.x + this.width / 2, this.y + 20);
                    }
                    break;
            }
        }

        if (this.tip && !this.tip.hidden){
            var pos = this.getTipPos();
            this.tip.x = pos.x;
            this.tip.y = pos.y;
        }
    }
    , goHome: function(){
        this.action = 'gohome';
//        Diver.log(this.action);
        var ship = Diver.Game.getShip()
            , mark1 = ship.getMark(1)
            , mark2 = ship.getMark(2)
            , mark3 = ship.getMark(3);

        if (this.x < ship.trosBottomX){
            this.srcDirection = 'right';
        }else if(this.x > ship.trosBottomX){
            this.srcDirection = 'left';
        }

        var onStartUp = function(){
            this.srcDirection = 'up';
            this.resUseOnce(this.getCompensatorNeed());
        }

        if (this.y > ship.trosBottomY || this.y == ship.trosBottomY){
            if (this.y > ship.trosBottomY){
                this.moveTo(this.x, ship.trosBottomY);
            }
            this.moveTo(ship.trosBottomX, ship.trosBottomY, onStartUp, this);
        }else{
            onStartUp.call(this);
        }

        if (this.y > mark1.y){
            this.moveTo(mark1.x, mark1.y).wait(mark1.wait);
        }

        if (this.y > mark2.y){
            this.moveTo(mark2.x, mark2.y).wait(mark2.wait);
        }

        if (this.y > mark3.y){
            this.moveTo(mark3.x, mark3.y).wait(mark3.wait);
        }

        this.moveTo(ship.trosBottomX, ship.trosTopY, function(){
            Diver.Game.getShip().load(this.stars);
            for (var i = 0; i < this.stars.length; i++){
                this.unMarkStar(this.stars[i].id);
            }
            this.stars = [];
            this.resStopUse();
            this.resourceValue = this.resourceVolume;
            if (this.killing){
                this.destroy();
                return;
            }
            if (this.needLoadBalloon){
                this.needLoadBalloon = false;
                this.resStopUse();
                this.hideTip();
                ship.loadBalloon(this, this.goHarvest, this);
            }else{
                this.goHarvest();
            }
        }, this);
    }
    , resGetDangerLevel: function(){
        var ship = Diver.Game.getShip()
        , value = 0
        , mark1 = ship.getMark(1)
        , mark2 = ship.getMark(2)
        , mark3 = ship.getMark(3)
        , resUseSpeed = this.resGetUseSpeed();

        if (this.y > mark3.y){
            value += resUseSpeed * mark3.wait / 1000;
        }
        if (this.y > mark2.y){
            value += resUseSpeed * mark2.wait / 1000;
        }
        if (this.y > mark1.y){
            value += resUseSpeed * mark1.wait / 1000;
        }
//        Diver.log(value);

        value += (Math.abs(this.x - ship.trosBottomX) / this.speed) * resUseSpeed;
        value += ((this.y - ship.trosTopY) / this.speed) * resUseSpeed;

//        Diver.log(value);

        if (this.action != 'gohome'){
            value += this.getCompensatorNeed();
        }
//        Diver.log(this.resValue, value, this.getCompensatorNeed());
        return value + 50;
    }
    , resGetUseSpeed: function(){
        var speed = this.resUseSpeed;
        for(var i = 0; i < this.stars.length; i++){
            speed += this.stars[i].value;
        }
        return speed;
    }
    , getCompensatorNeed: function(){
        var value = this.compensatorNeedForDiver;
        for (var i = 0; i < this.stars.length; i++){
            value += this.stars[i].value * this.compensatorNeedForStar;
        }
        return value;
    }
    , getZIndex: function(){
        return 'd' + this.id * 5;
    }
    , dropStars: function(){
        var ship = Diver.Game.getShip();
        if (this.y >= ship.trosBottomY){
            var refresh = false;
            var i = this.stars.length;
            while(i--){
                refresh = true;
                var star = this.stars[i];
                this.unMarkStar(star.id);
                star.getZIndex = star.realZIndexFn;
                star.fall();
                this.stars.splice(i, 1);
            }
            if (refresh){
                Diver.Game.refreshObjectsZIndex();
            }
        }
    }
    , destroy: function(){
        this.resStopUse();
        if (this.tip){
            Diver.Game.removeDrawObject(this.tip);
            delete this.tip;
        }
        Diver.Diver.superclass.destroy.apply(this, arguments);
    }
    , kill: function(){
        this.killing = true;
        this.stop(true);
        Diver.Radio.un('message', this.receiveMessage, this);
        this.dropStars();
        this.goHome();
    }
    , getDrawData: function(){
        if (this.killing){
            var hidden = Math.round(new Date().getTime() / 500) % 2 == 0 ? true : false;
//            Diver.log(hidden);
            this.hidden = hidden;
        }
        return Diver.Diver.superclass.getDrawData.apply(this, arguments);
    }
};

Diver.Diver = Diver.extend(Diver.Component, Diver.Diver);

Diver.Fish = {
    src: 'fishes.png'
    , init: function(){
        Diver.Fish.superclass.init.apply(this, arguments);
        this.startMove();
    }
    , startMove: function(){
        var ship = Diver.Game.getShip();

        this.y = Math.round(Math.random() * (ship.trosBottomY - ship.trosTopY) + ship.trosTopY);
        this.x = Math.round(Math.random()) == 1 ? Diver.Game.getWidth() + 100 :  100;
    }
};

Diver.Fish = Diver.extend(Diver.Component, Diver.Fish);
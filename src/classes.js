Diver.Ship = {
    loaded: false
    , loadIndicator: null
    , fullSrc: 'ship-load.png'
    , emptySrc: ''
    , loadIndicatorX: 0
    , loadIndicatorY: 0
    , trosTopX: 0
    , trosTopY: 0
    , trosBottomX: 0
    , trosBottomY: 0
    , init: function(){
        Diver.Ship.superclass.init.apply(this, arguments);
        this.loadIndicator = new Diver.Base({
            mixins: [Diver.mixins.Drawable]
            , x: this.loadIndicatorX
            , y: this.loadIndicatorY
            , getZIndex: function(){
                return '0';
            }
        });
        
        Diver.Game.addDrawObject(this.loadIndicator)
    }
    , setLoaded: function(loaded){
        this.loaded = loaded;
        
        if (this.loaded){
            this.loadIndicator.setSrc(this.fullSrc);
        }else{
            this.loadIndicator.setSrc(this.emptySrc);
        }
    }
};

Diver.Ship = Diver.extend(Diver.Base, Diver.Ship);

Diver.Star = {
    srcPattern: 'res/img/tf-star{value}.png'
    , mixins: [Diver.mixins.Observable]
    , speed: 80
    , value: 0
    , width: 46
    , height: 43
    , depth: 0
    , init: function (){
        this.value = Math.ceil(Math.random() * 10);
        this.x -= Math.round(this.width / 2);
        this.y -= Math.round(this.height / 2);
        this.depth -= this.height;
        this.src = this.srcPattern.replace('{value}', this.value);
        Diver.Star.superclass.init.apply(this, arguments);
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

Diver.Diver = {
    mainController: null
    , mixins: [Diver.mixins.Observable]
    , scr: 'res/img/Diver-go-harvest.png'
    , srcUp: 'res/img/Diver-tros.png'
    , srcDown: 'res/img/Diver-go-harvest.png'
    , srcLeft: 'res/img/Diver-go-harvest.png'
    , srcRight: 'res/img/Diver-go-home.png'
    , speed: 20
    , action: ''
    , visibleDuration: 0
    , _searchInterval: null
    , init: function(){
        this.visibleDuration = Diver.Game.getWidth() / 3;
        var ship = Diver.Game.getShip();
        this.x = ship.trosTopX - 25;
        this.y = ship.trosTopY - 25;
        Diver.Diver.superclass.init.apply(this, arguments);
        this.goHarvest();
    }
    , goHarvest: function(){
        var ship = Diver.Game.getShip();
        this.move('down', ship.trosBottomY - this.y, this.swimingOnBottom, this);
        this.setSrc(this.srcDown);
    }
    , swimingOnBottom: function(side){
        var leftPos = this.visibleDuration / 2 - this.width / 2;
        var rightPos = Diver.Game.getWidth() - this.visibleDuration / 2 - this.width / 2;
        
        var moveLeft = function(){
            this.moveTo(leftPos, this.y, moveRight, this);
        }
        var moveRight = function(){
            this.moveTo(rightPos, this.y, moveLeft, this); 
        }
        moveLeft.call(this);
        
        this.searchStars();
    }
    , searchStars: function(){
        clearTimeout(this._searchInterval);
        
        var self = this;

        this._searchInterval = setTimeout(function(){
            var center = self.getCenter(),
                nearestStars = Diver.Game.getNearestStars(center.x, self.visibleDuration / 2),
                nearestStar = null;

            for (var i = 0; i < nearestStars.length; i++){
                var star = nearestStars[i];
                if(self.canGetStar(star) && (!nearestStar || Math.abs(star.x - center.x) < Math.abs(nearestStar.x - center.x))){
                    nearestStar = star;
                }
            }
            if (nearestStar){
                self.goGetStar();
                console.log('star finded ' + star.id, star);
            }else{
                setTimeout(arguments.callee, self.interval);
            }
        }, this.interval);
    }
    , goGetStar: function(star){
        this.stop(true);
    }
    , canGetStar: function(star){
        return true;
    }
    , getZIndex: function(){
        return this.id + 1;
    }
    , goToStar: function(star){
        this.stop();
        var length = Math.abs(this.x - star.x);
        var side = this.x > star.x ? 'left' : 'right';
        this.move(side, length, function(){
            this.takeStar(star);
        }, this);
    }
    , takeStar: function(star){
        star.un('endmove', this.takeStar, this);
        if (star.isMoving()){
            star.on('endmove', this.takeStar, this);
            return;
        }else{
            this.on('move');
        }
    }
};

Diver.Diver = Diver.extend(Diver.Component, Diver.Diver);
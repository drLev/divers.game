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
    , width: 0
    , height: 0
    , depth: 0
    , init: function (){
        this.value = Math.ceil(Math.random() * 10);
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
    , src: 'res/img/Diver-go-harvest.png'
    , srcUp: 'res/img/Diver-tros.png'
    , srcDown: 'res/img/Diver-go-harvest.png'
    , srcLeft: 'res/img/Diver-go-harvest.png'
    , srcRight: 'res/img/Diver-go-home.png'
    , speed: 20
    , action: ''
    , visibleDuration: 0
    , depth: 0
    
    , stars: null
    , currentStar: null
    
    , _searchInterval: null
    , init: function(){
        this.stars = [];
        
        this.visibleDuration = Diver.Game.getWidth() / 3;
        var ship = Diver.Game.getShip();
        this.x = ship.trosTopX;
        this.y = ship.trosTopY;
        Diver.Diver.superclass.init.apply(this, arguments);
        this.depth = ship.trosBottomY;
        this.on('move', this.onMove, this);
        this.goHarvest();
    }
    , goHarvest: function(){
        this.moveTo(this.x, this.depth, this.swimingOnBottom, this);
        this.setSrc(this.srcDown);
    }
    , swimingOnBottom: function(side){
        var leftPos = this.visibleDuration / 2;
        var rightPos = Diver.Game.getWidth() - this.visibleDuration / 2;
        
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
                clearTimeout(self._searchInterval);
//                Diver.log('star finded ' + star.id, star, star.x, star.y);
                self.goGetStar(star);
            }else{
                self._searchInterval = setTimeout(arguments.callee, self.interval);
            }
        }, 1);
    }
    , goGetStar: function(star){
//        Diver.log('goGetStar');
        if (this.currentStar){
            return;
        }
        this.stop(true);
        var x;
        
        if (this.x < star.x){
            x = star.x - this.width / 2;
        }else if(this.x > star.x){
            x = star.x + this.width / 2;
        }else{
            x = this.x;
        }

        this.currentStar = star;
        
        var getStar = function(){
            var srcUp = this.srcUp;
            
//            Diver.log(this.x, '<', star.x, this.x < star.x);
            
            if (this.x < star.x){
                this.srcDown = this.srcRight;
                this.srcUp = this.srcRight;
            }else if(this.x > star.x){
                this.srcDown = this.srcLeft;
                this.srcUp = this.srcLeft;
            }

            star.un('endmove', getStar, this);
//            Diver.log('getting star');
            this.moveTo(x, star.y - this.height / 2, this.takeStar, this).moveTo(this.x, this.depth, function(){
                this.srcDown = this.srcLeft;
                this.srcUp = srcUp;
                this.currentStar = null;
                if (this.stars.length < 2){
                    this.searchStars();
                }else{
                    this.goHome();
                }
            }, this);
        };
        
        this.moveTo(x, this.y, function(){
            if (star.moving){
                star.on('endmove', getStar, this);
            }else{
                getStar.call(this);
            }
        }, this);
    }
    , canGetStar: function(star){
        return true;
    }
    , takeStar: function(){
        this.stars.push(this.currentStar);
//        Diver.log('star taken');
    }
    , onMove: function(){
        console.log('move', this.stars.length, this.direction);
        if (this.stars.length > 0){
            switch(this.el.src){
                case this.srcUp:
                    this.stars[0].setPos(this.x, this.y + this.height / 2);
                    if (this.stars.length == 2){
                        this.stars[1].setPos(this.x + 20, this.y + this.height / 2);
                    }
                    break;
                case this.srcDown:
                case this.srcLeft:
                    this.stars[0].setPos(this.x - this.width / 2, this.y);
                    if (this.stars.length == 2){
                        this.stars[1].setPos(this.x - this.width / 2, this.y + 20);
                    }
                    break;
                case this.srcRight:
                    this.stars[0].setPos(this.x + this.width / 2, this.y);
                    if (this.stars.length == 2){
                        this.stars[1].setPos(this.x + this.width / 2, this.y + 20);
                    }
                    break;
            }
        }
    }
    , goHome: function(){
        var ship = Diver.Game.getShip()
            , trosHeight = ship.trosBottomY - ship.trosTopY
            , mark1 = trosHeight / 3
            , mark2 = mark1
            , mark3 = trosHeight / 3 - trosHeight / 5;
        
        this.moveTo(ship.trosBottomX, this.y)
            .move('up', mark1)
            .wait(500)
            .move('up', mark2)
            .wait(1000)
            .move('up', mark3)
            .wait(1500)
            .moveTo(ship.trosBottomX, ship.trosTopY, function(){
                this.stars = [];
                this.goHarvest();
            }, this);
    }
    , getZIndex: function(){
        return this.id + 1;
    }
};

Diver.Diver = Diver.extend(Diver.Component, Diver.Diver);
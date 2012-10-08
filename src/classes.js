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
            this.move('down', this.depth - this.y);
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
    , init: function(){
        var ship = Diver.Game.getShip();
        this.x = ship.trosTopX - 25;
        this.y = ship.trosTopY - 25;
        Diver.Diver.superclass.init.apply(this, arguments);
        this.on('endmove', this.onEndMove, this);
        this.goHarvest();
    }
    , onEndMove: function(){
        switch (this.action){
            case 'goDown':
                this.goFindStar();
                break;
            case 'goHarvesLeft':
                
                break;
        }
    }
    , goHarvest: function(){
        var ship = Diver.Game.getShip();
        this.move('down', ship.trosBottomY - this.y, this.goFindStar, this);
        this.setSrc(this.srcDown);
    }
    , goFindStar: function(side){
        side = (side != 'left' && side != 'right') ? 'left' : side;
        var self = this;
        var length = side == 'left' ? this.x - 5 : Diver.Game.getWidth() - 10 - this.el.width;
        
        this.on('move', this.checkStar, this);
        this.move(side, length, function(){
            self.goFindStar(side == 'left' ? 'right' : 'left');
        });
    }
    , checkStar: function(side, x){
        
    }
    , getZIndex: function(){
        return this.id + 1;
    }
};

Diver.Diver = Diver.extend(Diver.Component, Diver.Diver);
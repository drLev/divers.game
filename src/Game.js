Diver.Game = {
    canvas: null
    , canvasId: 'canvas'
    , stars: null
    , divers: null
    , lastStarId: 0
    , lastDiverId: 0
    , bottomHeight: 38
    , ship: null
    , init: function(){
        this.stars = [];
        this.divers = [];
    }
    , start: function(){
        this.canvas = new Diver.Canvas({
            id: this.canvasId
            , interval: 50
        });
        this.canvas.on('click', this.addStarAt, this);
        this.ship = new Diver.Ship({
            loadIndicatorX: 648
            , loadIndicatorY: 42
            , width: 70
            , height: 38
            , trosTopX: 610
            , trosTopY: 120
            , trosBottomX: 610
            , trosBottomY: 500
            , fullSrc: 'res/img/ship-load.png'
        });
        this.ship.setLoaded(true);
        this.canvas.play();
    }
    , addStarAt: function(x, y){
        var depth = this.canvas.getHeight() - this.bottomHeight + Math.round(Math.random() * this.bottomHeight) - 25;
        var star = new Diver.Star({
            id: ++this.lastStarId
            , x: x
            , y: y
            , width: 46
            , height: 43
            , depth: depth
        });
        
        this.stars.push(star);
        this.addDrawObject(star);
    }
    , addDiver: function(){
        var diver = new Diver.Diver({
            id: ++this.lastDiverId
            , speed: 80
            , width: 66
            , height: 63
        });
        
        this.divers.push(diver);
        this.addDrawObject(diver);
    }
    , addDrawObject: function(obj){
        this.canvas.add(obj);
    }
    , removeDrawObject: function(obj){
        this.canvas.remove(obj);
    }
    , getShip: function(){
        return this.ship;
    }
    , getNearestStars: function(x, duration){
        var stars = [];

        for (var i = 0; i < this.stars.length; i++){
            var star = this.stars[i];
            if (Math.abs(star.x - x) <= duration){
                stars.push(star);
            }
        }
        
        return stars;
    }
    , getWidth: function(){
        return this.canvas.getWidth();
    }
    , getHeight: function(){
        return this.canvas.getHeight();
    }
};

Diver.Game = Diver.extend(Diver.Base, Diver.Game);

Diver.Game = new Diver.Game();
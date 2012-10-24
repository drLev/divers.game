/**
 * Основной контроллер, синглтон
 */
Diver.Game = {
    canvas: null
    , canvasId: 'canvas'
    , stars: null
    , excludeSearchStars: null
    , divers: null
    , fishes: null
    , lastStarId: 0
    , lastDiverId: 0
    , bottomHeight: 38
    , ship: null
    , init: function(){
        this.stars = [];
        this.divers = [];
        this.fishes = []
        this.excludeSearchStars = [];
        this.callParent();
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
            , trosTopY: 100
            , trosBottomX: 610
            , trosBottomY: 500
            , loadSrc: 'res/img/ship-load.png'
        });

        var self = this;
        setTimeout(function(){
            var fish = new Diver.Fish({
                src: 'res/img/fishes.png'
                , id: -1
            });
            self.fishes.push(fish);
            self.addDrawObject(fish);
        }, Math.random() * 5000);

        this.canvas.play();
    }
    , addStarAt: function(x, y){
        var screenHeight = this.getHeight()
        , screenWidth = this.getWidth();
        if (y < screenHeight / 6){
            return;
        }
        var depth = screenHeight - this.bottomHeight + Math.round(Math.random() * this.bottomHeight) - 25;
        var star = new Diver.Star({
            id: ++this.lastStarId
            , x: Math.max(Math.min(x, screenWidth - 23), 23)
            , y: Math.max(y, (screenHeight / 6) + 21)
            , width: 46
            , height: 43
            , depth: depth
            , maxDepth: screenHeight - 25
            , minDepth: screenHeight - this.bottomHeight - 25
            , screenWidth: screenWidth
        });

        this.stars.push(star);
        this.addDrawObject(star);
    }
    , removeStar: function(star){
        Diver.arrayRemove(this.stars, star);
        this.removeDrawObject(star);
    }
    , addDiver: function(){
        var diver = new Diver.Diver({
            id: ++this.lastDiverId
            , speed: 20
            , width: 66
            , height: 63
            , markedStars: this.divers.length > 0 ? this.divers[0].markedStars : []
            , resVolume: 20000
            , resValue: 20000
            , tipSrc: 'res/img/thought-empty.png'
        });

        this.divers.push(diver);
        this.addDrawObject(diver);
        return diver;
    }
    , killDiver: function(){
        if (this.divers.length > 0){
            var diver = this.divers.shift();
            if (diver){
                diver.kill();
            }
        }
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
    , excludeSearchStar: function(starId){
        if (this.excludeSearchStars.indexOf(starId) < 0){
            this.excludeSearchStars.push(starId);
        }
    }
    , includeSearchStar: function(starId){
        var index = this.excludeSearchStars.indexOf(starId);
        if (index >= 0){
            this.excludeSearchStars.splice(index, 1);
        }
    }
    , getNearestStars: function(x, duration){
        var stars = [];

        for (var i = 0; i < this.stars.length; i++){
            var star = this.stars[i];
            if (Math.abs(star.x - x) <= duration && this.excludeSearchStars.indexOf(star.id) < 0){
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
    , refreshObjectsZIndex: function(){
        this.canvas.sortObjects();
    }
    , getDrawInterval: function(){
        return this.canvas.interval;
    }
};

Diver.Game = Diver.extend(Diver.Base, Diver.Game);

Diver.Game = new Diver.Game();
Diver.Game = {
    canvas: null
    , canvasId: 'canvas'
    , stars: null
    , bottomHeight: 40
    , ship: null
    , init: function(){
        this.stars = [];
    }
    , start: function(){
        this.canvas = new Diver.Canvas({
            id: this.canvasId
            , interval: 50
        });
        this.canvas.on('click', this.addStarAt, this);
        this.ship = new Diver.Ship({
            x: 50
            , y: 100
            , fullSrc: 'res/img/ship-load.png'
        });
        this.ship.setLoaded(true);
        this.canvas.play();
    }
    , addStarAt: function(x, y){
        var depth = this.canvas.getHeight() - this.bottomHeight + Math.round(Math.random() * this.bottomHeight);
        var star = new Diver.Star({
            id: this.stars.length
            , x: x
            , y: y
            , depth: depth
        });
        
        this.stars.push(star);
        this.addDrawElement(star);
    }
    , addDrawObject: function(obj){
        this.canvas.add(obj);
    }
};

Diver.Game = Diver.extend(Diver.Base, Diver.Game);

Diver.Game = new Diver.Game();
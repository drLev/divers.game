Diver.Game = {
    canvas: null
    , canvasId: 'canvas'
    , stars: null
    , bottomHeight: 40
    , init: function(){
        this.stars = [];
        this.canvas = new Diver.Canvas({
            id: this.canvasId
            , interval: 50
        });
    }
    , start: function(){
        this.canvas.on('click', this.addStarAt, this);
        this.canvas.play();
        console.log('ready');
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
        this.canvas.add(star, 0);
    }
};

Diver.Game = Diver.extend(Diver.Base, Diver.Game);
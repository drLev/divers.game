Diver.Ship = {
    loaded: false
    , loadIndicator: null
    , fullSrc: 'ship-load.png'
    , emptySrc: ''
    , init: function(){
        Diver.Ship.superclass.init.apply(this, arguments);
        this.loadIndicator = new Diver.Base({
            mixins: [Diver.mixins.Drawable]
            , x: this.x
            , y: this.y
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
            this.down(this.depth - this.y);
        }
    }
    , getZIndex: function(){
        return '-' + this.depth + this.x + this.id;
    }
};

Diver.Star = Diver.extend(Diver.Component, Diver.Star);

Diver.Diver = {
    mainController: null
    , srcUp: 'res/img/Diver-go-home.png'
    , srcDown: 'res/img/Diver-go-home.png'
    , srcLeft: 'res/img/Diver-go-home.png'
    , srcRight: 'res/img/Diver-go-home.png'
    , init: function(){
        var pos = Diver.Sea.getDiverStart();
        this.x = pos.x;
        this.y = pos.y;
        this.goHarvest();
    }
    , goHarvest: function(){
        this.setSrc();
    }
};

Diver.Diver = Diver.extend(Diver.Component, Diver.Diver);
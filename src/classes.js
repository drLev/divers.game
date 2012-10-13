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
    , init: function(){
        Diver.Ship.superclass.init.apply(this, arguments);
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

Diver.Radio = {
    mixins: [Diver.mixins.Observable]
    , sendMessage: function(msg){
        this.fireEvent('message', msg);
    }
}

Diver.Radio = Diver.extend(Diver.Base, Diver.Radio);

Diver.Radio = new Diver.Radio();

Diver.Diver = {
    mixins: [Diver.mixins.Observable]
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
//        Diver.Game.excludeSearchStar(starId);
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
                if(self.canGetStar(star) && (!nearestStar || Math.abs(star.getCenter().x - center.x) < Math.abs(nearestStar.getCenter().x - center.x))){
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
        var index = this.markedStars.indexOf(starId);
        if (index >= 0){
            this.markedStars.splice(index, 1);
        }
    }
    , goGetStar: function(star){
//        Diver.log('goGetStar');
        if (this.currentStar){
            return;
        }
        this.currentStar = star;
        this.markStar(star.id);
        this.stop(true);
        var x;
        
        if (this.x < star.x){
            x = star.x - this.width / 2;
        }else if(this.x > star.x){
            x = star.x + this.width / 2;
        }else{
            x = this.x;
        }
        
        var getStar = function(){
            var srcUp = this.srcUp;
            
            if (this.x < star.x){
                this.srcDown = this.srcRight;
                this.srcUp = this.srcRight;
            }else if(this.x > star.x){
                this.srcDown = this.srcLeft;
                this.srcUp = this.srcLeft;
            }

            star.un('endmove', getStar, this);
            
            this.moveTo(x, star.y - this.height / 2, this.takeStar, this).moveTo(this.x, this.depth, function(){
                this.srcDown = this.srcLeft;
                this.srcUp = srcUp;
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
                star.on('endmove', getStar, this);
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
//        Diver.log('star taken');
    }
    , onMove: function(){
//        Diver.log('move', this.stars.length, this.direction, this.el.src.indexOf(this.srcUp), this.el.src, this.srcUp);
        if (this.stars.length > 0){
            if (this.el.src.indexOf(this.srcUp) >= 0){
                this.stars[0].setPos(this.x + 20, this.y - this.height / 2);
                if (this.stars.length == 2){
                    this.stars[1].setPos(this.x + 30, this.y - this.height / 2 + 20);
                }
            }
            if (this.el.src.indexOf(this.srcDown) >= 0 || this.el.src.indexOf(this.srcLeft) >= 0){
                this.stars[0].setPos(this.x - this.width / 2, this.y);
                if (this.stars.length == 2){
                    this.stars[1].setPos(this.x - this.width / 2, this.y + 20);
                }
            }
            if (this.el.src.indexOf(this.srcRight) >= 0){
                this.stars[0].setPos(this.x + this.width / 2, this.y);
                if (this.stars.length == 2){
                    this.stars[1].setPos(this.x + this.width / 2, this.y + 20);
                }
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
                Diver.Game.getShip().load(this.stars);
                for (var i = 0; i < this.stars.length; i++){
                    this.unMarkStar(this.stars[i].id);
                }
                this.stars = [];
                this.goHarvest();
            }, this);
    }
    , getZIndex: function(){
        return this.id + 1;
    }
};

Diver.Diver = Diver.extend(Diver.Component, Diver.Diver);
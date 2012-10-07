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
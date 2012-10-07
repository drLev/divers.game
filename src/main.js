window.onload = function(){
    var game = new Diver.Game();
    game.start();
};

/*Preload images*/
(function(){
    var preloads = [
        'back.jpg'
        , 'add-diver-hover.png'
        , 'add-diver.png'
        , 'delete-diver-hover.png'
        , 'delete-diver.png'
        , 'fishes.png'
        , 'ship-load.png'
        , 'thought.png'
        , 'Diver-go-harvest.png'
        , 'Diver-go-home.png'
        , 'Diver-tros.png'
    ];
    for (var i = 1; i <= 10; i++){
        preloads.push('tf-star' + i + '.png');
    }
    for (i = 0; i < preloads.length; i++){
        var img = new Image();
        img.src = 'res/img/' + preloads[i];
    }
})();
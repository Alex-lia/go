/* 
 * Game JavaScript file
 */


(function() {
    // shortcuts (local only to this file)
    var addEvent = eidogo.util.addEvent;
    
    // Keep track of all the player instances we've created
    eidogo.Game = eidogo.Game || {};
    
eidogo.Game = function() {
    this.init.apply(this, arguments);
}
eidogo.Game.prototype = {
    
    /**
     * Inits settings that are persistent among games
     * @constructor
     * @param {Object} cfg A hash of configuration values
     */
    init: function(cfg) {
        cfg = cfg || {};
        
        // Board config
        cfg.board = {};
        cfg.board.size = 19;
        
        //Game config
        cfg.game = {};
        
        // Players config
        cfg.playerWhite = {};
        cfg.playerWhite.name = 'Alexey';
        cfg.playerBlack = {};
        cfg.playerBlack.name = 'Dmitry';

        
        
        this.dom = {};
        
        //?????       
        this.dom.container = $('.eidogo-player-auto')[0];
   
        if (!this.dom.container) {
            alert(t['dom error']);
            return;
        }    
    
        // import rules from config - to be passed to Rules class later
        this.cfgRules = {
        'allowSuicide': (typeof cfg.allowSuicide != 'undefined' ? cfg.allowSuicide : false),
        'koRule': (typeof cfg.koRule != 'undefined' ? cfg.koRule : 'simple'),
        'owgsNetMode': this.owgsNetMode,
        'owgsColor': (typeof cfg.owgsColor != 'undefined' ? cfg.owgsColor : false)
        }; 
    
        if (!this.board) {
            // first time
            this.createBoard(cfg.board.size);
            this.rules = new eidogo.Rules(this.board, this.cfgRules);
        }
  
  
        this.playerWhite = new GamePlayer(cfg.playerWhite.name);
        this.playerWhite.color = this.board.WHITE;
        this.playerBlack = new GamePlayer(cfg.playerBlack.name);
        this.playerBlack.color = this.board.BLACK;
        
        
  
        this.gameInfo.currentPlayer = this.playerBlack;
        // in Seconds
        this.gameInfo.TimeInterval = 3700;
        this.gameInfo.useHours = this.gameInfo.TimeInterval/60 > 59 ? true : false;
        this.gameInfo.TimeByoyomi = 5;
        
        this.playerWhite.timeLimit = this.playerBlack.timeLimit = this.gameInfo.TimeInterval;
        
        this.gameInfoViewInit();
        this.gameTimer();
        
        this.handlePassClickObserve();
        this.handleResignClickObserve();
    
    },
    /**
     * Create our board. This can be called multiple times.
    **/
    createBoard: function(size) {
        size = size || 19;
        
        if (this.board && this.board.renderer && this.board.boardSize == size) {
            return;
        }
        
        try {
            var rendererProto = eidogo.BoardRendererHtml;

            this.dom.boardContainer = $('.board-container')[0];

            var eventHandlers = {
                //handleMouseDown: this.getEventHandler(this.handleBoardMouseDown),
                //handleHover: this.getEventHandler(this.handleBoardHover),
                handleMouseUp: this.getEventHandler(this.handleBoardMouseUp)
                //handleBoardSizeChange: this.getEventHandler(this.handleBoardSizeChange)
            };
            
            var renderer = new rendererProto(this.dom.boardContainer, size, eventHandlers);
            this.board = new eidogo.Board(renderer, size);
        } catch (e) {
            if (e == "No DOM container") {
                this.croak(t['error board']);
                return;
            }
        }
    },   
    
    /**
     * Play a move on the board and apply rules to it. This is different from
     * merely adding a stone.
    **/
    playMove: function(pt) {
        this.board.addStone(pt, this.gameInfo.currentPlayer.color);
        this.rules.apply(pt, this.gameInfo.currentPlayer.color);
        
        this.board.commit();
        this.board.render();
        this.gameInfo.currentPlayer = this.gameInfo.currentPlayer.color == this.playerWhite.color ? this.playerBlack : this.playerWhite;
        this.gameInfoRefreshView();
    },
    
    /**
     * Called by the board renderer upon mouse up, with appropriate coordinate
    **/
    handleBoardMouseUp: function(x, y, e) {
            // can't click there?
            if (!this.rules.check({x: x, y: y}, this.gameInfo.currentPlayer.color == this.board.WHITE ? 'W' : 'B')) {
                return;
            }
            
            this.playMove({x: x, y: y});

    },   
    handlePassClickObserve: function() {
        $('.pass').click($.proxy(function() {
            this.gameInfo.currentPlayer.pass = true;
            this.gameInfo.currentPlayer = this.gameInfo.currentPlayer.color == this.playerWhite.color ? this.playerBlack : this.playerWhite;
            this.gameInfoRefreshView();    

            if(this.playerWhite.pass == true && this.playerBlack.pass == true) {
                alert('Both players passed. TODO: Estimate score, Mark death stones, Calculate result on server-side');
            }
        },this));

            
    },    
    handleResignClickObserve: function() {
        $('.resign').click($.proxy(function() {
            this.gameInfo.currentPlayer.resign = true;
            this.gameInfo.currentPlayer = this.gameInfo.currentPlayer.color == this.playerWhite.color ? this.playerBlack : this.playerWhite;
            this.gameInfoRefreshView();    

            alert('WINNER ' + this.gameInfo.currentPlayer.name);
            
        },this));

            
    },     
    /**
     * Create an event handler with the execution context ("this") set to be the player function.
    **/
    getEventHandler: function(handler) {
        return (function(that) {
            return function() {
                return handler.apply(that, arguments);
            };
        })(this);
    },
    
    gameInfo: function(){
    },
    gameInfoViewInit: function() {
        $("#player-white .name").text("Name: " + this.playerWhite.name);
        $("#player-black .name").text("Name: " + this.playerBlack.name);
        
        $("#player-white .time").text("Time: " + new GameTime(this.playerWhite.timeLimit,this.gameInfo.useHours));
        $("#player-black .time").text("Time: " + new GameTime(this.playerBlack.timeLimit,this.gameInfo.useHours));
        this.gameInfoView();    
    },
    
    gameInfoRefreshView: function() {
        this.gameInfoView();
    },
    
    gameInfoView: function() {
        $("#player-white .captures").text("Captures: " + this.board.captures.W);   
        $("#player-black .captures").text("Captures: " +this.board.captures.B);
        
        if(this.gameInfo.currentPlayer.color == this.playerWhite.color) {
            $("#player-white .name").css("font-weight", "bold"); 
            $("#player-black .name").css("font-weight", "normal"); 
        } 
        else {
            $("#player-black .name").css("font-weight", "bold");
            $("#player-white .name").css("font-weight", "normal");
        }
  
    },
    gameInfoTimerUpdateView: function (){
        var time = new GameTime(this.gameInfo.currentPlayer.timeLimit,this.gameInfo.useHours);
        
        if(this.gameInfo.currentPlayer.color == this.playerWhite.color) {
            $("#player-white .time").text("Time: " + time);
        }
        else {
            $("#player-black .time").text("Time: " + time);        
        }
    },
    gameTimer: function() {
        if (this.gameInfo.currentPlayer.timeLimit == 0)
        {
            alert("You time is up.");
        }
        else
        {
            this.gameInfo.currentPlayer.timeLimit = this.gameInfo.currentPlayer.timeLimit - 1;
            
            setTimeout(function(thisObj) {thisObj.gameTimer();}, 1000,this);
            this.gameInfoTimerUpdateView();
            
        }

    }
   
};   
    
})();

function GamePlayer(name) {
    this.name = name;
}

GameTime = function() {
    this.init.apply(this, arguments);
}

GameTime.prototype = {
    init: function(seconds, useHours){
        this.m = 0;
        this.s = seconds;        
        if(useHours) {
            this.h = 0;
        }
    },
    getTime: function(){
        this.m = Math.floor(this.s / 60);        
        this.s = this.s % 60;

        if(typeof this.h != 'undefined') {
            if(this.m > 59) {
                this.h = Math.floor(this.m / 60);
                this.m = this.m % 60;            
            }
        }
    },
    toString : function(){
        this.getTime();
        var m = this.m <= 9 ? "0"+ this.m : this.m;
        var s = this.s <= 9 ? "0"+ this.s : this.s;
        var timeString = m + ":" + s;
        if(typeof this.h != 'undefined') {
            var h = this.h <= 9 ? "0"+ this.h : this.h;
            timeString = h + ":" + timeString;
        }
        return timeString;
    }
}

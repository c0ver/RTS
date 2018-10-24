"use strict";

import {questList, me} from "./Data.js";
import {getObjByName} from "./Miscellaneous.js";
import './Initialize.js';
import Game from "./Game/Game.js";

const startText = "This is an open world game in a medieval setting.";

const FPS = 30;

function startGame() {
    let event = getObjByName("Opening Scene", questList).nextChapter.rootEvent;
    let game = new Game(event);

    setInterval(function() { game.gameLoop(); }, 1000 / FPS);
}

function createDisplay() {
    $("<div>", {id: "startContainer"}).appendTo("body");

    $("<p>", {
        id: "startText",
        text: startText
    }).appendTo("#startContainer");

    $("<button>", {
        id: "startButton",
        click: startGame,
        text: "Begin"
    }).appendTo("#startContainer");
}

$(document).keydown(function(e) {
    switch(e.which) {
        case 87: // w
            me.move(0, -1);
            break;
        case 83: // s
            me.move(0, 1);
            break;
        case 65: // a
            me.move(-1, 0);
            break;
        case 68: // d
            me.move(1, 0);
            break;
    }
});

createDisplay();

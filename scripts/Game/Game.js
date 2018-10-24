"use strict";

import {activeMonsters, me} from "../Data.js";
import Inventory from "../EventTypes/Inventory.js";
import Gear from "../EventTypes/Gear.js";
import Trade from "../EventTypes/Trade.js";
import Battle from "./Battle.js";
import Place from '../Thing/Plottables/Place.js';
import {changePlotDisplay} from "../Thing/Plottables/Mobile.js";
import ItemEvent from "../EventTypes/ItemEvent.js";

const PLOT_FILE = "assets/plot/images/{0}.png";

const EVENT_INFO = "Current Event: ({0})";

const TILE_SIZE = 64;

export default class Game {

    constructor(event) {
        this.gameTime = new Time();
        this.currentEvent = null;

        this.initialize();
        changePlotDisplay();
    }

    gameLoop() {
        // this.drawDisplay();
    }

    /**
     * For finishing up initializations dependent on a Game instance
     */
    initialize() {
        console.group("Initializing this Game instance");

        let self = this;

        $("body").empty();

        // // contains the upper three divs: playerInfo, storyText, otherInfo
        // $("<div>", {id: "mainContainer"}).appendTo("body");
        //
        //
        // $("<div>", {id: "playerContainer", class: "sidebar"}).appendTo("#mainContainer");
        // $("<p>", {id: "playerInfoText", class: "infoText"}).appendTo("#playerContainer");
        // $("<div>", {id: "playerInfoButtons"}).appendTo("#playerContainer");
        // $("<button>", {
        //     class: "playerInfoButton",
        //     id: "Inventory",
        //     text: "Inventory"
        // }).appendTo("#playerContainer");
        // $("<button>", {
        //     class: "playerInfoButton",
        //     id: "Gear",
        //     text: "Gear"
        // }).appendTo("#playerContainer");
        // $(".playerInfoButton").each(function () {
        //     let $this = $(this);
        //     $this.click(function () {
        //         self.buttonPress($this.text());
        //     });
        // });
        //
        $("<img>", {id: "plot"}).appendTo("body");
        $("<img>", {id: "playerIcon"}).appendTo("body");
        //
        //
        // $("<div>", {id: "otherContainer", class: "sidebar"}).appendTo("#mainContainer");
        // $("<p>", {id: "gameInfoText", class: "infoText"}).appendTo("#otherContainer");
        // $("<p>", {id: "otherInfoText", class: "infoText"}).appendTo("#otherContainer");
        //
        //
        // $("<div>", {id: "playerActionButtons"}).appendTo("body");
        // $("#playerActionButtons").css({
        //     width: ($("#plotContainer").width() + "px")
        // });
        // // create the buttons for the game
        // for (let i = 0; i < 9; i++) {
        //     $("<button>", {class: "playerActionButton"}).appendTo("#playerActionButtons");
        // }


        Place.birthMonsters();
        console.groupEnd();
    }

    buttonPress(command) {
        console.group(EVENT_INFO.fmt(this.currentEvent.title));
        console.log("Button: ({0})".fmt(command));

        let newEvent = null;

        // no time taken for these commands
        // these events can be activated anytime
        switch (command) {
            case "Inventory":
                newEvent = new Inventory(me, this.currentEvent);
                break;
            case "Gear":
                newEvent = new Gear(this.currentEvent);
                break;
        }

        if (newEvent === null) {
            // Game events independent of player and before player action
            this.progressTime(this.currentEvent.findTimeTaken(command));

            newEvent = this.currentEvent.chooseNewEvent(command);
            this.currentEvent.sideEffect(command, newEvent);

            if (newEvent === null) {
                if (newEvent === undefined) {
                    console.error("Given a undefined event to display");
                }
                newEvent = me.getTile().getEvent();
            }
        }

        this.drawDisplay(newEvent);

        console.groupEnd();
    }

    drawDisplay() {
        // update playerInfo
        // $("#playerInfoText").text(me.info());
        //
        // let $gameInfoText = $("#gameInfoText");
        // $gameInfoText.text(this.gameTime.formatted() + me.parentPlace.name + '\n');

        // // update storyText
        // $("#storyText").text(event.storyText);


        // update plotContainer
        let $newImage = $("#plot");
        let $playerIcon = $("#playerIcon");
        let $body = $("body");
        $newImage.attr('src', PLOT_FILE.fmt(me.parentPlace.name));
        $newImage.on('load', function() {
            let imageSize = $newImage.height();
            let windowHeight = $body.height();
            let windowWidth = $body.width();

            if (imageSize < windowWidth) {
                $newImage.css({
                    left: (windowWidth - imageSize) / 2
                });
            }
            if (imageSize < windowHeight) {
                $newImage.css({
                    top: (windowHeight - imageSize) / 2,
                });
            }

            // move plot according to player position
            // newImage.css({
            //     top: Math.floor((size / (TILE_SIZE * 2) - me.yPos)) * TILE_SIZE
            //         + newImage.position().top,
            //     left: Math.floor(size / (TILE_SIZE * 2) - me.xPos) * TILE_SIZE
            //         + newImage.position().left
            // });

            if(me.hasMoved === true) {
                console.log("Moving the map to fit the moved player");

                $newImage.css({
                    top: me.yPos * 64 + $newImage.position().top,
                    left: me.xPos * 64 + $newImage.position().left
                });

                me.hasMoved = false;
            }

            $playerIcon.css({
                left: (windowWidth - $playerIcon.width()) / 2,
                top: (windowHeight - $playerIcon.height()) / 2
            })
        });


        // update otherInfo
        // let $otherInfoText = $("#otherInfoText");
        // $otherInfoText.text("");
        // if (event.other != null) {
        //     $otherInfoText.append(event.other.info());
        // }
    }

    progressTime(amount) {
        if(amount === 0) {
            return;
        }
        this.gameTime.addTime(amount);

        Game.timeEvent();

        // end of the day
        if (this.gameTime.newDay === true) {
            console.log("It's a new day");

            // Randomly create monsters that can move around
            Place.birthMonsters();
        }

        console.log("Active Monster List");
        console.log(activeMonsters);
        console.log("Number of monsters: " + Object.keys(activeMonsters).length);
        console.log('--------------------------------------------------------');
    }

    static timeEvent() {
        console.group("Time-based Events");

        // move all the monsters
        console.groupCollapsed("Monsters are moving");
        for (let monsterID in activeMonsters) {
            let monster = activeMonsters[monsterID];
            if(monster.fatigue() < 0.3 || monster.vitality() < 0.5) {
                monster.rest();
                continue;
            }
            let randomMove = Math.floor(Math.random() * 5);
            switch (randomMove) {
                case 0:
                    monster.move(0, -1);
                    break;
                case 1:
                    monster.move(0, 1);
                    break;
                case 2:
                    monster.move(1, 0);
                    break;
                case 3:
                    monster.move(-1, 0);
                    break;
                case 4:
                    monster.rest();
                    break;
            }
        }
        console.groupEnd();

        // if 2+ monsters occupy the same square, make them fight
        Game.checkForConflict();

        console.groupEnd();
    }

    static checkForConflict() {
        console.groupCollapsed("Monsters fight");

        for (let monsterID in activeMonsters) {
            let monster = activeMonsters[monsterID];

            // fight with enemies on the same tile
            let enemies = monster.getTile().getEnemies(monsterID);
            if (enemies.length !== 0) {
                console.group("Battle");

                let participants = enemies.concat([monster]);
                new Battle(participants, null);

                console.groupEnd();
            }
        } // end of activeMonsters loop

        console.groupEnd();
    }
}

const TIME_FORMAT = "Day {0}, {1}:{2}\n";
class Time {
    constructor() {
        this.minutes = 0;
        this.hours = 0;
        this.days = 1;
        this.newHour = false;
        this.newDay = false;
    }

    /**
     * @param time {int} Time in minutes to add
     */
    addTime(time) {
        this.minutes += time;
        this.newHour = false;
        if(this.minutes >= 60) {
            this.hours++;
            this.minutes -= 60;
            this.newHour = true;
        }

        this.newDay = false;
        if(this.hours >= 24) {
            this.days++;
            this.hours -= 24;
            this.newDay = true;
        }
    }

    formatted() {
        let minutes = this.minutes.toString();
        if(this.minutes < 10) {
            minutes = "0" + minutes;
        }

        let hours = this.hours.toString();
        if(this.hours < 10) {
            hours = "0" + hours;
        }


        return TIME_FORMAT.fmt(this.days, hours, minutes);
    }
}
"use strict";

import {activeMonsters, me} from "../Data.js";
import Inventory from "../EventTypes/Inventory.js";
import Gear from "../EventTypes/Gear.js";
import Trade from "../EventTypes/Trade.js";
import Battle from "./Battle.js";
import Place from '../Thing/Plottables/Place.js';
import ItemEvent from "../EventTypes/ItemEvent.js";

const PLOT_FILE = "assets/plot/images/{0}.png";

const EVENT_INFO = "Current Event: ({0})";

const TILE_SIZE = 64;

export default class Game {

    constructor(event) {
        this.gameTime = new Time();
        this.currentEvent = null;

        this.initialize();
        this.updateDisplay(event);
    }

    /**
     * For finishing up initializations dependent on a Game instance
     */
    initialize() {
        console.group("Initializing this Game instance");

        let self = this;

        $("body").empty();

        // contains the upper three divs: playerInfo, storyText, otherInfo
        $("<div>", {id: "mainContainer"}).appendTo("body");


        $("<div>", {id: "playerContainer", class: "sidebar"}).appendTo("#mainContainer");
        $("<p>", {id: "playerInfoText", class: "infoText"}).appendTo("#playerContainer");
        $("<div>", {id: "playerInfoButtons"}).appendTo("#playerContainer");
        $("<button>", {
            class: "playerInfoButton",
            id: "Inventory",
            text: "Inventory"
        }).appendTo("#playerContainer");
        $("<button>", {
            class: "playerInfoButton",
            id: "Gear",
            text: "Gear"
        }).appendTo("#playerContainer");
        $(".playerInfoButton").each(function () {
            let $this = $(this);
            $this.click(function () {
                self.buttonPress($this.text());
            });
        });

        $("<div>", {id: "plotContainer"}).appendTo("#mainContainer");
        $("<img>", {id: "plot"}).appendTo("#plotContainer");
        $("<img>", {id: "playerIcon"}).appendTo("#plotContainer");


        $("<div>", {id: "otherContainer", class: "sidebar"}).appendTo("#mainContainer");
        $("<p>", {id: "gameInfoText", class: "infoText"}).appendTo("#otherContainer");
        $("<p>", {id: "otherInfoText", class: "infoText"}).appendTo("#otherContainer");


        $("<div>", {id: "playerActionButtons"}).appendTo("body");
        $("#playerActionButtons").css({
            width: ($("#plotContainer").width() + "px")
        });
        // create the buttons for the game
        for (let i = 0; i < 9; i++) {
            $("<button>", {class: "playerActionButton"}).appendTo("#playerActionButtons");
        }


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

        this.updateDisplay(newEvent);

        console.groupEnd();
    }

    /**
     * @param event {Event} The new event to be displayed
     */
    updateDisplay(event) {
        console.log("Updating Event to: ({0})".fmt(event.title));
        this.currentEvent = event;
        let self = this;

        // update playerInfo
        $("#playerInfoText").text(me.info());

        let $gameInfoText = $("#gameInfoText");
        $gameInfoText.text(this.gameTime.formatted() + me.parentPlace.name + '\n');

        // // update storyText
        // $("#storyText").text(event.storyText);


        // update plotContainer
        let newImage = $("#plot");
        newImage.attr('src', PLOT_FILE.fmt(me.parentPlace.name));
        newImage.on('load', function() {
            let size = newImage.height();

            if (size > 576) {
                newImage.css({
                    top: 192,
                    left: 192
                });
            } else {
                newImage.css({
                    top: (576 - size) / 2,
                    left: (576 - size) / 2
                });
            }

            // move plot according to player position
            // newImage.css({
            //     top: Math.floor((size / (TILE_SIZE * 2) - me.yPos)) * TILE_SIZE
            //         + newImage.position().top,
            //     left: Math.floor(size / (TILE_SIZE * 2) - me.xPos) * TILE_SIZE
            //         + newImage.position().left
            // });

            newImage.css({
                top: (64 - me.yPos * 64) + newImage.position().top,
                left: (64 - me.xPos * 64) + newImage.position().left
            });

        });


        // update otherInfo
        let $otherInfoText = $("#otherInfoText");
        $otherInfoText.text("");
        if (event.other != null) {
            $otherInfoText.append(event.other.info());
        }


        // update buttons
        let $actionButtonSet = $(".playerActionButton");
        $actionButtonSet.prop("disabled", true);
        $actionButtonSet.text("");

        $actionButtonSet.each(function (index) {
            if (index === event.buttonSet.length) {
                return false;
            }

            let $this = $(this);

            $this.text(event.buttonSet[index]);
            $this.off("click"); // gets rid of all listeners
            $this.click(function () {
                self.buttonPress(event.buttonSet[index]);
            });

            if ($this.text() && event.canDo(event.buttonSet[index], me)) {
                $this.prop("disabled", false);
            }
        });

        let $Inventory = $("#Inventory");
        let $Gear = $("#Gear");
        $Inventory.prop("disabled", false);
        $Gear.prop("disabled", false);
        if(event instanceof Inventory && event.self === me &&
            !(event.nextEvent instanceof Trade) || event instanceof Gear ||
            event instanceof ItemEvent) {
            $Inventory.prop("disabled", true);
            $Gear.prop("disabled", true);
        }
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
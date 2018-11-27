"use strict";

import {activeMonsters, me} from "../Data.js";
import Inventory from "../EventTypes/Inventory.js";
import Gear from "../EventTypes/Gear.js";
import Trade from "../EventTypes/Trade.js";
import Battle from "./Battle.js";
import Place from '../Thing/Plottables/Place.js';
import ItemEvent from "../EventTypes/ItemEvent.js";
import ActionCombat from "./ActionCombat.js";

let Sprite = PIXI.Sprite,
    resources = PIXI.loader.resources;

const EVENT_INFO = "Current Event: ({0})";

const PLOT_FILE = "assets/plot/images/{0}.png";
const PLAYER_ICON_FILE = "assets/playerIcon.png";
const TILE_SIZE = 64;

export default class Game {

    constructor() {
        this.gameTime = new Time();
        this.currentEvent = null;
        this.currentPlotName = null;
        this.plot = null;

        // create the PixiJS application that matches the window size
        let $body = $("body");
        $body.empty();
        let width = $body.width();
        let height = $body.height();
        this.plotContainer = new PIXI.Application(width, height);

        this.initialize();
        // let a = new ActionCombat();
    }

    /**
     * For finishing up initializations dependent on a Game instance
     */
    initialize() {
        console.group("Initializing this Game instance");
        let self = this;

        // initialize the plot first
        $("<div>", {id: "overallContainer"}).appendTo("body");
        $("#overallContainer").append(this.plotContainer.view);

        this.plot = new Sprite(
            resources[PLOT_FILE.fmt(me.parentPlace.name)].texture);
        this.plot.x = this.plotContainer.renderer.width / 2 - TILE_SIZE / 2 -
            TILE_SIZE * me.xPos;
        this.plot.y = this.plotContainer.renderer.height / 2 - TILE_SIZE / 2 -
            TILE_SIZE * me.yPos;
        // the plot will always be the first child
        this.plotContainer.stage.addChild(this.plot);
        this.currentPlotName = me.parentPlace.name;

        let playerIcon = new Sprite(resources[PLAYER_ICON_FILE].texture);
        playerIcon.x = this.plotContainer.renderer.width / 2 - TILE_SIZE / 2;
        playerIcon.y = this.plotContainer.renderer.height / 2 - TILE_SIZE / 2;
        this.plotContainer.stage.addChild(playerIcon);

        $("<div>", {id: "playerContainer", class: "sidebar"}).appendTo("body");
        $("<p>", {id: "playerInfoText", class: "infoText"})
            .appendTo("#playerContainer");
        $("<div>", {id: "playerInfoButtons"}).appendTo("#playerContainer");
        $("<button>", {
            class: "playerInfoButton",
            id: "Stats",
            text: "Stats"
        }).appendTo("#playerContainer");
        $(".playerInfoButton").each(function () {
            let $this = $(this);
            $this.click(function () {
                self.buttonPress($this.text());
            });
        });

        $("<div>", {id: "otherContainer", class: "sidebar"}).appendTo("body");
        $("<p>", {id: "gameInfoText", class: "infoText"})
            .appendTo("#otherContainer");
        $("<p>", {id: "otherInfoText", class: "infoText"})
            .appendTo("#otherContainer");

        $("<div>", {id: "mainContainer"}).appendTo("body");
        $("<div>", {id: "battleContainer"}).css("visibility", "hidden")
            .appendTo("#mainContainer");
        $("<div>", {id: "storyContainer"}).appendTo("#mainContainer");
        $("<p>", {id: "storyText"}).appendTo("#storyContainer");

        Place.birthMonsters();
        console.groupEnd();

        // giving keyboard controls
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

        this.plotContainer.ticker.add(delta => this.gameLoop(delta));
    }

    gameLoop(delta) {
        this.updateDisplay();
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
        $("#playerInfoText").text(me.simpleInfo());

        let $gameInfoText = $("#gameInfoText");
        $gameInfoText.text(this.gameTime.formatted() + me.parentPlace.name + '\n');

        // update storyText
        $("#storyText").text("HI");


        // update plotContainer
        if (me.hasMoved === true) {
            me.hasMoved = false;
            if (me.parentPlace.name !== this.currentPlotName) {
                this.changePlotDisplay();
            } else {
                this.movePlotDisplay();
            }
        }

        // update otherInfo
        // let $otherInfoText = $("#otherInfoText");
        // $otherInfoText.text("");
        // if (event.other != null) {
        //     $otherInfoText.append(event.other.info());
        // }
    }

    movePlotDisplay() {
        console.log("Moving plot");

        let $newImage = $("#plot");
        let $body = $("body");
        let $playerIcon = $("#playerIcon");

        let windowHeight = $body.height();
        let windowWidth = $body.width();

        /* adjust the plot to the player's position with starting point at (0, 0) */
        $newImage.css({
            left: (windowWidth - TILE_SIZE) / 2 + me.xPos * -1 * TILE_SIZE,
            top: (windowHeight - TILE_SIZE) / 2 + me.yPos * -1 * TILE_SIZE
        });

        console.log(windowWidth);
        console.log(windowHeight);

        // TODO: should only do this when the window size changes
        // problem with loading sometimes
        $playerIcon.css({
            left: (windowWidth - $playerIcon.width()) / 2,
            top: (windowHeight - $playerIcon.height()) / 2
        })
    }

    changePlotDisplay() {
        console.log("Changing plot to {0}".fmt(me.parentPlace.name));

        // the plot will always be the first child
        this.plotContainer.stage.getChildAt(0).texture =
            resources[PLOT_FILE.fmt(me.parentPlace.name)].texture;
    }

    updateDisplay() {
        if(me.parentPlace.name !== this.currentPlotName) {
            this.changePlotDisplay();
        }

        this.plot.x = this.plotContainer.renderer.width / 2 - TILE_SIZE / 2 -
            TILE_SIZE * me.xPos;
        this.plot.y = this.plotContainer.renderer.height / 2 - TILE_SIZE / 2 -
            TILE_SIZE * me.yPos;
    }

    progressTime(amount) {
        if (amount === 0) {
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
            if (monster.fatigue() < 0.3 || monster.vitality() < 0.5) {
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
        if (this.minutes >= 60) {
            this.hours++;
            this.minutes -= 60;
            this.newHour = true;
        }

        this.newDay = false;
        if (this.hours >= 24) {
            this.days++;
            this.hours -= 24;
            this.newDay = true;
        }
    }

    formatted() {
        let minutes = this.minutes.toString();
        if (this.minutes < 10) {
            minutes = "0" + minutes;
        }

        let hours = this.hours.toString();
        if (this.hours < 10) {
            hours = "0" + hours;
        }


        return TIME_FORMAT.fmt(this.days, hours, minutes);
    }
}
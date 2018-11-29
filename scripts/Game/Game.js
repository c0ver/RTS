"use strict";

import {activeMonsters, me, monsterList, placeList} from "../Data.js";
import Inventory from "../EventTypes/Inventory.js";
import Gear from "../EventTypes/Gear.js";
import Thing from "./Thing.js";
import Battle from "./Battle.js";
import ActionCombat from "./ActionCombat.js";
import {chooseRandom, getObjByName} from "../Miscellaneous.js";
import {clone} from "../Clone.js";

let Sprite = PIXI.Sprite,
    resources = PIXI.loader.resources;

const EVENT_INFO = "Current Event: ({0})";

const PLOT_FILE = "assets/plot/images/{0}.png";
const MONSTER_FILE = "assets/monsters/{0}.png";
const PLAYER_ICON_FILE = "assets/playerIcon.png";
const TILE_SIZE = 64;
const FPS = 60;
const MONSTER_CHANGE_DIRECTION_SEC = 5;

export const BIRTH_CHANCE = [0, 1, 1];
const DEEP_COPY_DEPTH = 2;

export default class Game {

    constructor() {
        this.gameTime = new Time();
        this.currentEvent = null;
        this.currentPlotName = null;
        this.plot = null;
        this.totalGroup = null;

        // create the PixiJS application that matches the window size
        let $body = $("body");
        $body.empty();
        let width = $body.width();
        let height = $body.height();
        this.gameApp = new PIXI.Application(width, height);

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
        $("#overallContainer").append(this.gameApp.view);

        // add the plot to the group that holds all non player elements
        this.totalGroup = new PIXI.Container();
        this.plot = new Sprite(
            resources[PLOT_FILE.fmt(me.parentPlace.name)].texture);
        this.totalGroup.x = this.gameApp.renderer.width / 2 - TILE_SIZE / 2 -
            TILE_SIZE * me.xPos;
        this.totalGroup.y = this.gameApp.renderer.height / 2 - TILE_SIZE / 2 -
            TILE_SIZE * me.yPos;
        this.totalGroup.addChild(this.plot);
        this.currentPlotName = me.parentPlace.name;
        this.gameApp.stage.addChild(this.totalGroup);

        me.sprite = new Sprite(resources[PLAYER_ICON_FILE].texture);
        me.sprite.x = this.gameApp.renderer.width / 2 - TILE_SIZE / 2;
        me.sprite.y = this.gameApp.renderer.height / 2 - TILE_SIZE / 2;
        this.gameApp.stage.addChild(me.sprite);

        // all the non pixiJS stuff that provides info to player
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
        Battle.initialization();
        $("<div>", {id: "storyContainer"}).appendTo("#mainContainer");
        $("<p>", {id: "storyText"}).appendTo("#storyContainer");

        this.birthMonsters();

        // giving keyboard controls
        $(document).keydown(function(e) {
            switch(e.which) {
                case 87: // w
                    me.vy = -5;
                    break;
                case 83: // s
                    me.vy = 5;
                    break;
                case 65: // a
                    me.vx = -5;
                    break;
                case 68: // d
                    me.vx = 5;
                    break;
            }
        });
        $(document).keyup(function(e) {
            switch(e.which) {
                case 87: // w
                    me.vy = 0;
                    break;
                case 83: // s
                    me.vy = 0;
                    break;
                case 65: // a
                    me.vx = 0;
                    break;
                case 68: // d
                    me.vx = 0;
                    break;
            }
        });

        this.gameApp.ticker.add(delta => this.gameLoop(delta));
        console.groupEnd();
    }

    gameLoop(delta) {
        console.log("Game Loop");
        this.playerMovement();
        this.monsterMovement();

        this.checkForConflict();
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

        console.groupEnd();
    }

    changePlotDisplay() {
        console.log("Changing plot to {0}".fmt(me.parentPlace.name));

        // the plot will always be the first child
        this.gameApp.stage.getChildAt(0).texture =
            resources[PLOT_FILE.fmt(me.parentPlace.name)].texture;
    }

    playerMovement() {
        if (me.parentPlace.name !== this.currentPlotName) {
            this.changePlotDisplay();
        }

        Game.contain(me, this.totalGroup);

        // map moves opposite of player movement
        this.totalGroup.x -= me.vx;
        this.totalGroup.y -= me.vy;

    }

    progressTime(amount) {
        if (amount === 0) {
            return;
        }
        this.gameTime.addTime(amount);

        this.playerMovement();

        // end of the day
        if (this.gameTime.newDay === true) {
            console.log("It's a new day");

            // Randomly create monsters that can move around
            this.birthMonsters();
        }

        console.log("Active Monster List");
        console.log(activeMonsters);
        console.log("Number of monsters: " + Object.keys(activeMonsters).length);
        console.log('--------------------------------------------------------');
    }

    monsterMovement() {
        for (let monsterID in activeMonsters) {
            let monster = activeMonsters[monsterID];
            let monsterMoves =
                Math.floor(Math.random() * FPS * MONSTER_CHANGE_DIRECTION_SEC) === 0;
            if (monsterMoves === true) {
                let randomMove = Math.floor(Math.random() * 5);
                switch (randomMove) {
                    case 0:
                        monster.vx = 1;
                        monster.vy = 0;
                        break;
                    case 1:
                        monster.vx = -1;
                        monster.vy = 0;
                        break;
                    case 2:
                        monster.vx = 0;
                        monster.vy = 1;
                        break;
                    case 3:
                        monster.vx = 0;
                        monster.vy = -1;
                        break;
                    case 4:
                        monster.vx = 0;
                        monster.vy = 0;
                        break;
                }
            }

            Game.contain(monster, this.totalGroup);

            monster.sprite.x += monster.vx;
            monster.sprite.y += monster.vy;
        }
    }

    checkForConflict() {
        let monsterArray = Object.values(activeMonsters);

        for (let i = 0; i < monsterArray.length - 1; i++) {
            if(Game.collisionCheck(me, monsterArray[i])) {
                console.log("Player has collided with a monster");
                let participants = [];
                participants.push(monsterArray[i]);
                participants.push(me);

                new Battle(participants);

                this.gameApp.ticker.stop();
            }

            for (let j = i + 1; j < monsterArray.length; j++) {
                if (Game.collisionCheck(monsterArray[i], monsterArray[j])) {
                    console.log("Collision between {0} and {1}".fmt(i, j));
                    // fight
                    let participants = [];
                    participants.push(monsterArray[i]);
                    participants.push(monsterArray[j]);

                    new Battle(participants);

                    this.gameApp.ticker.stop();
                    return;
                }
            }
        }
    }

    // from https://github.com/kittykatattack/learningPixi#collision
    static collisionCheck(obj1, obj2) {

        //Define the variables we'll need to calculate
        let combinedHalfWidths, combinedHalfHeights, xDelta, yDelta;
        let sprite1 = obj1.sprite;
        let sprite2 = obj2.sprite;

        //Find the half-widths and half-heights of each sprite
        let halfWidth1 = sprite1.width / 2;
        let halfHeight1 = sprite1.height / 2;
        let halfWidth2 = sprite2.width / 2;
        let halfHeight2 = sprite2.height / 2;

        //Find the center points of each sprite
        let centerX1, centerY1, centerX2, centerY2;
        centerX1 = sprite1.x + halfWidth1;
        centerY1 = sprite1.y + halfHeight1;
        if(obj1 === me) {
            centerX2 = sprite2.getGlobalPosition().x + halfWidth2;
            centerY2 = sprite2.getGlobalPosition().y + halfHeight2;
        } else {
            centerX2 = sprite2.x + halfWidth2;
            centerY2 = sprite2.y + halfHeight2;
        }

        //Calculate the distance vector between the sprites
        xDelta = centerX1 - centerX2;
        yDelta = centerY1 - centerY2;

        //Figure out the combined half-widths and half-heights
        combinedHalfWidths = halfWidth1 + halfWidth2;
        combinedHalfHeights = halfHeight1 + halfHeight2;

        if(obj2 === me) {
            console.log("{0} {1}".fmt(xDelta, combinedHalfWidths));
            console.log("{0} {1}".fmt(yDelta, combinedHalfHeights));
        }

        //Check for a collision on the x axis
        if (Math.abs(xDelta) < combinedHalfWidths) {
            //A collision might be occurring. Check for a collision on the y axis
            return Math.abs(yDelta) < combinedHalfHeights;
        }

        return false;
    }

    // from: https://github.com/kittykatattack/learningPixi#containingmovement
    static contain(entity, container) {
        let sprite = entity.sprite;

        //Left
        if (sprite.x <= container.x) {
            sprite.x = container.x;
            if (entity.vx < 0) entity.vx = 0;
        }

        //Top
        if (sprite.y <= container.y) {
            sprite.y = container.y;
            if (entity.vy < 0) entity.vy = 0;
        }

        //Right
        if (sprite.x + sprite.width >= container.width) {
            sprite.x = container.width - sprite.width;
            if (entity.vx > 0) entity.vx = 0;
        }

        //Bottom
        if (sprite.y + sprite.height >= container.height) {
            sprite.y = container.height - sprite.height;
            entity.vy = 0;
            if (entity.vy > 0) entity.vy = 0;
        }
    }

    birthMonsters() {
        console.groupCollapsed("Adding to activeMonsters");

        let place = getObjByName("main", placeList);

        for(let i = 0; i < place.plot.length; i++) {
            for(let j = 0; j < place.plot[i].length; j++) {
                // between 0 to 99
                let birthChance = Math.floor(Math.random() * 100);
                let index = place.getTile(j, i).dangerLevel;

                // birth a monster off chance and with empty square
                if (birthChance < BIRTH_CHANCE[index] &&
                    !place.getTile(j, i).hasPlottables()) {
                    let monster = clone(chooseRandom(monsterList), false,
                        DEEP_COPY_DEPTH);
                    monster.id = (Thing.id++).toString();
                    monster.tag = monster.name + "#" + monster.id;
                    monster.sprite = new Sprite(
                        resources[MONSTER_FILE.fmt(monster.name)].texture);
                    monster.sprite.position.set(j * TILE_SIZE, i * TILE_SIZE);
                    monster.sprite.width = TILE_SIZE;
                    monster.sprite.height = TILE_SIZE;
                    this.totalGroup.addChild(monster.sprite);

                    activeMonsters[monster.id] = monster;
                }
            }
        } // end of looping through the plot
        console.log(activeMonsters);

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
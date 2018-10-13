import {me} from '../Data.js';
import Event from '../Game/Event.js';
import Next from "./Next.js";

const DEFAULT_BUTTON_SET = ["", "North", "", "West", "South", "East", "Explore",
    "Interact", "Rest"];

const UNKNOWN_COMMAND = "Unknown command given at Default event: |{0}|";

const INTERACT_TIME = 15;
const MOVE_TIME = 20;
const REST_TIME = 60;

const REST_STORY_TEXT = "You decide to take a break and rest for one hour.\n";

const TIER_1_FATIGUE = "\nYou feel tired and may need to rest soon.\n";
const TIER_2_FATIGUE = "\nYou are exhausted and will not be doing much of " +
    "anything until you rest for some time.\n";

// TODO: perhaps return this instead of making a new event every time
export default class Default extends Event {

    /**
     * @param tile {Tile} A tile on a plot
     */
    constructor(tile) {
        super(tile.name, tile.desc, DEFAULT_BUTTON_SET, null, null);

        for(let plottableID in tile.onTileList) {
            if(plottableID === me.id) continue;
            this.storyText += tile.onTileList[plottableID].desc;
        }

        if(me.fatigue() < 0.25) {
          this.storyText += TIER_2_FATIGUE;
        } else if(me.fatigue() < 0.5) {
            this.storyText += TIER_1_FATIGUE;
        }
    }

    chooseNewEvent(command) {
        let move = false;
        let nextEvent;
        switch(command) {
            case "North":
                me.move(0, -1);
                move = true;
                break;
            case "West":
                me.move(-1, 0);
                move = true;
                break;
            case "South":
                me.move(0, 1);
                move = true;
                break;
            case "East":
                me.move(1, 0);
                move = true;
                break;
            case "Interact":
                nextEvent = me.getTile().interact();
                break;
            case "Explore":
                break;
            case "Rest":
                me.rest();
                nextEvent = new Next("rest", REST_STORY_TEXT,
                    me.getTile().getEvent());
                break;
            default:
                console.error(UNKNOWN_COMMAND.fmt(command));
        }

        if(nextEvent !== undefined) {
            return nextEvent;
        }

        return me.getTile().getEvent();
    }

    findTimeTaken(command) {
        switch(command) {
            case "Interact":    return INTERACT_TIME;
            case "Rest":        return REST_TIME;
            default:            return MOVE_TIME;
        }
    }

    canDo(action) {
        let xDelta = 0;
        let yDelta = 0;
        switch(action) {
            case "North":
                yDelta = -1;
                break;
            case "South":
                yDelta = 1;
                break;
            case "West":
                xDelta = -1;
                break;
            case "East":
                xDelta = 1;
                break;
        }

        if(me.checkMove(xDelta, yDelta) === -1) {
            return false;
        }

        if(action === "North" || action === "South" ||
            action === "West" || action === "East") {
            return me.energy() >= me.energyCost("Move");
        }

        if(action === "Interact") {
            return me.getTile().hasPlottables(me.id)
        }

        return true;
    }
}
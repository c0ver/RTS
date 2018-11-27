import {placeList, totalList, me} from "../Data.js";
import Default from "../EventTypes/Default.js";
import Template from "../EventTypes/Template.js"
import Thing from "../Game/Thing.js";
import Entity from "./Plottables/Entity.js";
import FightEvent from "../EventTypes/FightEvent.js";

const PLOTTABLE_REMOVE_ERROR = "Trying to remove {0} when it isn't on the " +
    "tile in the first place";

export default class Tile extends Thing {
    constructor(name, desc, dangerLevel) {
        super(name, desc);
        this.dangerLevel = dangerLevel;

        // keys are id numbers
        this.onTileList = {};

        this.myTiles = {};
        this.myTiles[this.id] = this;
    }

    /**
     * Gets called after this already has a tile
     * @param tile {Tile} The tile to add to this
     */
    addTile(tile) {
        this.name += "\\" + tile.name;
        this.desc += "\n\n" + tile.desc;

        if (this.dangerLevel < tile.dangerLevel) {
            this.dangerLevel = tile.dangerLevel;
        }

        this.myTiles[tile.id] = tile;
    }

    addPlottable(plottable) {
        this.onTileList[plottable.id] = plottable;
    }

    removePlottable(plottable) {
        if (!this.onTileList.hasOwnProperty(plottable.id)) {
            console.error(PLOTTABLE_REMOVE_ERROR.fmt(plottable.tag));
            console.error("({0}, {1})".fmt(plottable.xPos, plottable.yPos));
        }
        delete this.onTileList[plottable.id];
    }

    hasTile(tileID) {
        return (tileID in this.myTiles);
    }

    interact() {
        // keys are id numbers
        let keys = Object.keys(this.onTileList);
        console.log(keys);

        let eventObject = {};
        let desc = "";
        for(let key of keys) {
            if (key === me.id) {
                continue;
            }

            eventObject[totalList[key].name] = this.onTileList[key].interact();
            desc += this.onTileList[key].desc;
        }
        eventObject["Go Back"] = new Default(this);

        return new Template("Interaction on " + this.name, desc, eventObject);
    }

    hasPlottables(selfID) {
        for(let plottableID in this.onTileList) {
            if (selfID !== plottableID) {
                return true;
            }
        }
        return false;
    }

    getEnemies(selfID) {
        let enemies = [];
        for(let plottableID in this.onTileList) {
            let plottable = this.onTileList[plottableID];
            if (selfID !== plottableID && plottable instanceof Entity &&
                plottable.hostility !== 0) {
                enemies.push(plottable);
            }
        }
        return enemies;
    }

    getPlace() {
        for(let plottableID in this.onTileList) {
            if (placeList[plottableID] != null) {
                return placeList[plottableID];
            }
        }
        return null;
    }

    getEvent() {
        let enemies = this.getEnemies(me.id);
        if (enemies.length !== 0) {
            let storyText = "";
            for(let enemy of enemies) {
                storyText += enemy.desc + '\n';
            }
            return new FightEvent("Fight", storyText, null, enemies);
        }

        return new Default(this);
    }
}
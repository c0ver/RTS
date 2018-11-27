import Event from '../Game/Event.js';
import Trade from "./Trade.js";
import {itemList, me} from "../Data.js";
import ItemEvent from "./ItemEvent.js";
import {getObjByName} from "../Miscellaneous.js";
import Gear from "./Gear.js";

const ITEM_DESC = "{0}({1}) - {2}\n";

export default class Inventory extends Event {
    constructor(person, nextEvent, subType) {
        super(person.name + "'s Inventory", null, null, nextEvent, null);
        this.self = person;

        if (person !== me) {
            this.other = person;
        }

        this.update(subType);
    }

    chooseNewEvent(command) {
        if (command === "Go Back") {
            return this.nextEvent;
        }

        // came from a trade Event
        if (this.nextEvent instanceof Trade || this.nextEvent instanceof Gear) {
            return this.nextEvent.chooseNewEvent(command);
        }

        // normal check of player's inventory
        return new ItemEvent(getObjByName(command, itemList), this);
    }

    update(subType) {
        this.storyText = "";
        this.buttonSet = [];
        for(let itemID in this.self.inventory) {
            let item = itemList[itemID];
            if (subType === undefined || item.subType === subType) {
                this.storyText += ITEM_DESC.fmt(item.name,
                    this.self.inventory[itemID], item.desc);
                this.buttonSet.push(item.name);
            }
        }
        this.buttonSet.push("Go Back");
        if (this.storyText === "") {
            this.storyText = "You have an empty inventory";
        }
    }
}
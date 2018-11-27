import {me} from "../Data.js";
import Tool from "../Thing/ItemTypes/Tool.js";
import Consumable from "../Thing/ItemTypes/Consumable.js";
import Clothing from "../Thing/ItemTypes/Clothing.js";
import Event from '../Game/Event.js';
import Inventory from "./Inventory.js";
import {EQUIP_TEXT} from "./Gear.js";
import Next from "./Next.js";

const ITEM_BUTTON_SET = ["Go Back", "Drop"];
Object.seal(ITEM_BUTTON_SET);

const DROP_TEXT = "You decide {0} isn't useful anymore and drop it.\n";
const CONSUME_TEXT = "You consume {0} for its effects.\n";

const EQUIP_TIME = 5;
const CONSUME_TIME = 5;

export default class ItemEvent extends Event {
    constructor(item, inventoryEvent) {
        super(item.name, item.desc, ITEM_BUTTON_SET.slice(), inventoryEvent, null);

        this.item = item;

        if (item instanceof Consumable) {
            this.buttonSet.push("Consume");
        } else if (item instanceof Clothing || item instanceof Tool) {
            this.buttonSet.push("Equip");
        }
    }

    chooseNewEvent(command) {
        let nextEvent;

        // nextEvent should be and inventory event
        switch(command) {
            case "Go Back":
                break;
            case "Drop":
                me.loseItem(this.item.id);
                nextEvent = new Next("Dropping" + this.item.name,
                    DROP_TEXT.fmt(this.item.name), this.nextEvent);
                break;
            case "Equip":
                me.equip(this.item.name);
                nextEvent = new Next("Equipping " + this.item.name,
                    EQUIP_TEXT.fmt(this.item.name, this.item.subType),
                    this.nextEvent);
                break;
            case "Consume":
                me.loseItem(this.item.id);
                nextEvent = new Next("Consuming " + this.item.name,
                    CONSUME_TEXT.fmt(this.item.name), this.nextEvent);
                break;
            default:
                console.error("{0} given to ItemEvent".fmt(command));
        }

        // update Inventory Event for changes in player's inventory
        if (this.nextEvent instanceof Inventory) {
            this.nextEvent.update(undefined);
        }

        if (nextEvent !== undefined) {
            return nextEvent;
        }

        return this.nextEvent;
    }
}
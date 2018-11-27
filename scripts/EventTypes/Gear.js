import {me} from "../Data.js";
import Event from "../Game/Event.js";
import Inventory from "./Inventory.js";
import Next from "./Next.js";

export const GEAR_SET = ["Headgear", "Armor", "Glove", "Footwear",
    "Weapon"];

const GEAR_CHOICE_TEXT = "Which slot do you want to modify?\n";
const ITEM_CHOICE_TEXT = "Which item do you want to equip?\n";
export const EQUIP_TEXT = "You equipped {0} to the {1} slot.\n";

export default class Gear extends Event {
    constructor(nextEvent) {
        super(me.name + "'s Gear", GEAR_CHOICE_TEXT, GEAR_SET.slice(),
            nextEvent, null);

        this.buttonSet.push("Go Back");

        this.gearSlot = null;
    }

    chooseNewEvent(command) {
        if (command === "Go Back") {
            return this.nextEvent;
        }

        for(let gearSlot of GEAR_SET) {
            // command is a slot subType to equip for
            if (command === gearSlot) {
                this.gearSlot = gearSlot;
                return new Inventory(me, this, command);
            }
        }

        // command is an item to equip
        me.equip(command);
        return new Next("Equipping " + command, EQUIP_TEXT.fmt(command,
            this.gearSlot), this);
    }
}
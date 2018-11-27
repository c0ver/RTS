import Event from '../Game/Event.js'
import Gear from "./Gear.js";

const NEXT_BUTTON_SET = ["Next"];

export default class Next extends Event {
    constructor(title, storyText, nextEvent, prevCommand) {
        super(title, storyText, NEXT_BUTTON_SET, nextEvent, null);

        this.prevCommand = prevCommand;
    }

    chooseNewEvent(command) {
        if (this.nextEvent === undefined) {
            console.error("There is nowhere to go after this event");
        }

        return this.nextEvent;
    }
}
import Template from './Template.js';
import {me, itemList} from "../Data.js";
import {getObjByName} from "../Miscellaneous.js";

export default class QuestEvent extends Template {

    /**
     * @param title
     * @param storyText
     * @param eventObject
     * @param eventJSON {Object} A JSON object of this event
     * @param quest {Quest} The quest this event is a part of
     */
    constructor(title, storyText, eventObject, eventJSON, quest) {
        super(title, storyText, eventObject);

        this.eventJSON = eventJSON;
        this.quest = quest;
    }

    sideEffect(command, newEvent) {
        if (newEvent === null) {
            for(let itemName in this.quest.nextChapter.gain) {
                if (itemName === "money") {
                    me.gainMoney(this.quest.nextChapter.gain[itemName]);
                    continue;
                }

                let item = getObjByName(itemName, itemList);
                me.gainItems(item.id, this.quest.nextChapter.gain[itemName]);
            }
        }

        if (this.eventJSON.hasOwnProperty("nextChapter")) {
            console.log("Next Chapter for this quest is chosen " + this.eventJSON.nextChapter);

            // the quest is done
            if (this.eventJSON.nextChapter === "DONE") {
                this.quest.updateChapter(null);
                return;
            }

            // move on to next chapter for this outcome
            this.quest.updateChapter(this.eventJSON.nextChapter);
        }
    }

}
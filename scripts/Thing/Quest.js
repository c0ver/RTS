import Chapter from '../Game/Chapter.js';
import Thing from '../Game/Thing.js';
import {totalList} from '../Data.js';
import {getObjByName} from "../Miscellaneous.js";

export default class Quest extends Thing {

    /**
     * @param name
     * @param desc
     * @param story {Object} Holds the storyline of the quest
     * @param startChapter {String} The name of the starting event sequence
     */
    constructor(name, desc, story, startChapter) {
        super(name, desc);

        this.story = {};
        for(let chapterName in story) {
            this.story[chapterName] = new Chapter(chapterName,
                story[chapterName], this);
        }

        this.nextChapter = this.story[startChapter];
        getObjByName(this.nextChapter.triggerName, totalList).addQuest(this);
    }

    /**
     * Give the plottable for the nextChapter this quest so it can be triggered
     */
    updateChapter(chapterName) {

        // remove the quest from the trigger to move on to the next chapter
        if (this.nextChapter.name === "N/A") {
            return;
        }
        let oldTrigger = getObjByName(this.nextChapter.triggerName, totalList);
        delete oldTrigger.quests[this.name];

        // this quest is finished
        if (chapterName === null) {
            console.log(this.name + " is finished");
            return;
        }

        let newTrigger = getObjByName(this.story[chapterName].triggerName, totalList);

        // totalList does not include this trigger
        if (newTrigger == null) {
            console.error(this.story[chapterName].triggerName +
                " is not a valid plottable");
            return;
        }

        this.nextChapter = this.story[chapterName];
        newTrigger.addQuest(this);
    }
}
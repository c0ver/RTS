import QuestEvent from '../EventTypes/QuestEvent.js';

export default class Chapter {
    /**
     * @param name {String} Name of this
     * @param chapter {Object}
     * @param quest {Quest} The quest this chapter is a part of
     */
    constructor(name, chapter, quest) {
        this.name = name;
        this.triggerName = chapter.triggerName;
        this.triggerEvent = chapter.triggerEvent;
        this.timeLength = chapter.timeLength;
        this.gain = chapter.gain;
        this.lose = chapter.lose;

        this.eventSeries = chapter.eventSeries;
        this.quest = quest;
        this.rootEvent = this.createEvent(0);
    }

    /**
     * Recursively create the chapter events
     * @param index {int} The index of the event in eventSeries
     * @returns {QuestEvent} The event with its children
     */
    createEvent(index) {
        let eventObject = {};

        let event = this.eventSeries[index];
        if (event === undefined) {
            console.log(this.eventSeries);
            console.log(index);
        }

        // create a branch for each child of this event
        for(let child in event.children) {

            // children hold the buttons and indexes of the next event
            // for this sequence
            let nextIndex = event.children[child];

            // make sure the nextIndex is a valid index
            if (typeof nextIndex !== "number") {
                console.error(this.eventSeries[index]);
                console.error("Has an invalid index");
            }


            if (nextIndex !== -1) {
                eventObject[child] = this.createEvent(nextIndex);
            } else {
                eventObject[child] = null;
            }
        }

        return new QuestEvent(String(index), event.text, eventObject,
                                this.eventSeries[index], this.quest);
    }
}
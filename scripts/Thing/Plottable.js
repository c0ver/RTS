"use strict";

import Thing from "../Game/Thing.js";
import Template from "../EventTypes/Template.js";
import Trade from "../EventTypes/Trade.js";

/**
 * @classdesc A Thing that has a location on a map
 */
export default class Plottable extends Thing {

    /**
     * @param name
     * @param desc
     * @param parentPlace {Place} the name of the place this is in
     * @param xPos {int} the x Position of this
     * @param yPos {int} the y Position of this
     */
    constructor(name, desc, parentPlace, xPos, yPos) {
        super(name, desc);

        this.parentPlace = parentPlace;
        this.xPos = xPos;
        this.yPos = yPos;

        this.quests = {};

        this.addToParentPlace();
    }

    interact() {
        let eventObject = {};
        eventObject["Go Back"] = this.getTile().getEvent();
        eventObject["Trade"] = new Trade("Trade with " + this.name, this.desc,
                                            this, this.getTile().getEvent());
        for(let questID in this.quests) {
            let quest = this.quests[questID];
            if (quest.nextChapter.triggerEvent === "Talk") {
                eventObject[quest.nextChapter.name] = quest.nextChapter.rootEvent;
            }
        }
        return new Template("Interaction with " + this.name,
                                this.desc, eventObject, this);
    }

    addQuest(quest) {
        this.quests[quest.name] = quest;
    }

    addToParentPlace() {
        if (this.parentPlace == null) {
            if (this.parentPlace === undefined) {
                console.error(this.name + " has an undefined parentPlace");
            }
            console.log(this.name + " has a null parentPlace");
            return;
        }

        if (this.xPos === -1 || this.yPos === -1) {
            console.log("Not adding {0} to plot due to invalid coordinates"
                .fmt(this.name));
            return;
        }

        console.log("Adding {0} to {1} at ({2}, {3})".fmt(this.tag,
            this.parentPlace.tag, this.xPos, this.yPos));

        this.parentPlace.addToPlot(this);
    }

    getTile() {
        return this.parentPlace.getTile(this.xPos, this.yPos);
    }

    info() {
        return this.name + '\n';
    }
}
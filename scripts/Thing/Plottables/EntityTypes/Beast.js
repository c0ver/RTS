import Entity from "../Entity.js";

const HOSTILITY = 1;
const START_LEVEL = 1;

export default class Beast extends Entity {
    constructor(name, desc, parentPlace, xPos, yPos, level, deathXP,
            baseStats, hostility, inventory, birthPriority) {
        if (level === undefined) level = START_LEVEL;
        if (hostility === undefined) hostility = HOSTILITY;

        super(name, desc, parentPlace, xPos, yPos, level, deathXP, baseStats,
            hostility, inventory, undefined, birthPriority);

    }

    // Beasts do not loot, override the Entity's loot function to do nothing
    loot(entity) {}
}
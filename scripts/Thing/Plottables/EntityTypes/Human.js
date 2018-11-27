import Entity from "../Entity.js";

// TODO: 10x^1.8
const WEALTH_LEVELS = [
    [0, 0, 0],
    [10, 0, 0],
    [8, 1, 0],
    [10, 2, 0],
    [32, 4, 1],
    [4, 10, 2]
];

const START_LEVEL = 1;
const DEATH_XP = 10;
const BASE_STATS = [10, 20, 8, 10];
const HOSTILITY = 0;

export default class Human extends Entity {
    /**
     * @param name
     * @param desc
     * @param parentPlace
     * @param xPos
     * @param yPos
     * @param level
     * @param deathXP
     * @param baseStats
     * @param hostility
     * @param inventory
     * @param wealthLevel {int} The index of WEALTH_LEVELS for this human
     * @param birthPriority
     */
    constructor(name, desc, parentPlace, xPos, yPos, level, deathXP,
                baseStats, hostility, inventory, wealthLevel, birthPriority) {
        if (level === undefined) level = START_LEVEL;
        if (deathXP === undefined) deathXP = DEATH_XP;
        if (baseStats === undefined) baseStats = BASE_STATS.slice();
        if (hostility === undefined) hostility = HOSTILITY;

        super(name, desc, parentPlace, xPos, yPos, level, deathXP, baseStats,
            hostility, inventory, WEALTH_LEVELS[wealthLevel], birthPriority);

    }
}
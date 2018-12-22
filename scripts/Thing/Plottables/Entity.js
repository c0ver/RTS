"use strict";

import {itemList, me} from '../../Data.js';
import Item, {CONVERSION_RATE, MONEY_TYPE_LENGTH, MONEY_TYPES} from "../Item.js";
import Mobile from './Mobile.js';
import {GEAR_SET} from "../../EventTypes/Gear.js";
import {getObjByName} from "../../Miscellaneous.js";

export const entityTypeEnum = Object.freeze({
    "HUMAN": 1,
    "BEAST": 2,
});

const ERROR_NOT_ENOUGH_ENERGY = "Not enough energy";
const ERROR_UNKNOWN_ACTION = "Unknown action: {0}";

const GAIN_XP_TEXT = "{0} gained {1} XP for a total of {2} XP.\n";
const LEVEL_UP_TEXT = "{0} leveled up to {1}.\n";
const LOOT_TEXT = "You found {0} {1}(s).\n";

export const STAT_NAMES = ["hp", "energy", "agility", "strength"];
const STAT_COUNT = STAT_NAMES.length;

const REST_BASE_GAIN = 5;

const BASE_XP_LEVEL = 10;
const XP_NEEDED_EXPONENT = 1.2;
const LEVEL_UP_MULTIPLIER = 1.2;

const DEFAULT_RANGE = 120;

const STAT_INFO = "Level: {0}\nHP: {1}\nEnergy: {2}\nAgility: {3}\nStrength: {4}\n";

export default class Entity extends Mobile {

    /**
     * @param name
     * @param desc
     * @param parentPlace
     * @param xPos
     * @param yPos
     * @param level {int} Level of this
     * @param deathXP {int} Experienced gained when killing this
     * @param baseStats {int[]} Array of stats
     * @param hostility {int} 1 for hostile, 0 for friendly
     * @param inventory {Object} Keys are id numbers, values are quantity of item
     * @param money {int[]} Money given in an array from low to high value
     * @param birthPriority {int} Priority for this entity has to be birthed
     */
    constructor(name, desc, parentPlace, xPos, yPos, level, deathXP,
                baseStats, hostility, inventory, money, birthPriority) {
        super(name, desc, parentPlace, xPos, yPos);

        this.level = level;
        this.deathXP = deathXP;
        this.hostility = hostility;
        this.birthPriority = birthPriority;
        this.range = DEFAULT_RANGE;

        this.inventory = {};
        for (let itemID in inventory) {
            if (itemList[itemID] === undefined) {
                console.error("{0} is not a valid item id".fmt(itemID));
                continue;
            }

            this.inventory[itemID] = inventory[itemID];
        }

        // key/value is slotName/itemID
        this.gear = {};
        for (let gearPart of GEAR_SET) {
            this.gear[gearPart] = null;
        }
        this.gearStats = {};
        for(let stat of STAT_NAMES) {
            this.gearStats[stat] = 0;
        }

        this.money = money;
        if (this.money === undefined) this.money = [0, 0, 0];

        this.XP = 0;
        this.isAlive = true;

        this.baseStats = {};
        for (let i = 0; i < baseStats.length; i++) {
            this.baseStats[STAT_NAMES[i]] = baseStats[i];
        }

        // is baseStats + gearStats
        this.maxStats = JSON.parse(JSON.stringify(this.baseStats));

        // only uses health and energy
        // current strength/agility depends on maxStats and missing hp/energy
        this.currentStats = JSON.parse(JSON.stringify(this.baseStats));
    }

    equip(itemName) {
        let newGear = getObjByName(itemName, itemList);

        if (!this.inventory.hasOwnProperty(newGear.id)) {
            console.error("You don't have a " + newGear.name);
            return;
        }

        let subType = newGear.subType;
        let currentGearID = this.gear[subType];
        let currentGear = getObjByName(itemName, itemList);
        console.log("Equipping {0} into slot {1}".fmt(currentGear.tag,
            subType));

        // move the current gear back into inventory
        if (currentGearID !== null) {
            this.gainItem(currentGearID);

            // remove the stats for this gear
            for(let stat of STAT_NAMES) {
                this.gearStats[stat] -= currentGear.stats[stat];
            }
        }

        // move the newGear from inventory to gear slot
        this.loseItem(newGear.id);
        this.gear[newGear.subType] = newGear.id;

        // add the stats for this gearStats
        for(let stat of STAT_NAMES) {
            this.gearStats[stat] += newGear.stats[stat];
        }

        for(let stat of STAT_NAMES) {
            this.maxStats[stat] = this.baseStats[stat] + this.gearStats[stat];
        }

        console.log(this.gearStats);
        console.log(this.maxStats);
    }

    loot(entity) {
        let text = "You search {0} for loot.\n".fmt(entity.name);

        for (let itemID in entity.inventory) {
            let item = itemList[itemID];

            text += LOOT_TEXT.fmt(entity.inventory[itemID], item.name);

            if (!this.inventory.hasOwnProperty(itemID)) {
                this.inventory[itemID] = 0;
            }
            this.inventory[itemID] += entity.inventory[itemID];
            delete entity.inventory[itemID];
        }

        return text;
    }

    /**
     * Adds multiple items at a time
     * @param itemID {String} ID of the item being added
     * @param quantity {int} Quantity of item to add
     */
    gainItems(itemID, quantity) {
        for (let i = 0; i < quantity; i++) {
            this.gainItem(itemID);
        }
    }

    gainItem(itemID) {
        if (!this.inventory.hasOwnProperty(itemID)) {
            this.inventory[itemID] = 0;
        }
        this.inventory[itemID]++;
    }

    /**
     * @param amount {int[]}
     */
    gainMoney(amount) {
        if (amount.length !== MONEY_TYPE_LENGTH) {
            console.error("Amount given is not the correct length array");
            console.error(amount);
            return;
        }

        for (let i = 0; i < MONEY_TYPE_LENGTH; i++) {
            this.money[i] += amount[i];
        }
    }

    gainHP(amount) {
        this.currentStats.hp += amount;
        if (this.currentStats.hp > this.maxStats.hp) {
            this.currentStats.hp = this.maxStats.hp;
        }
    }

    gainEnergy(amount) {
        this.currentStats.energy += amount;
        if (this.currentStats.energy > this.maxStats.energy) {
            this.currentStats.energy = this.maxStats.energy;
        }
    }

    loseItem(itemID) {
        if (!this.inventory.hasOwnProperty(itemID)) {
            console.error("{0} does not have a {1}".fmt(this.name, itemID));
            return;
        }

        this.inventory[itemID]--;
        if (this.inventory[itemID] === 0) {
            delete this.inventory[itemID];
        }
    }

    /**
     * TODO: Assumes perfect change, consider implementing imperfect change
     * @param amount
     * @returns {boolean} true if Entity has enough money to lose, false otherwise
     */
    loseMoney(amount) {
        if (amount.length !== MONEY_TYPE_LENGTH) {
            console.error("Amount given is not the correct length array");
            console.error(amount);
            return false;
        }

        let remainder = Item.totalValue(this.money) - Item.totalValue(amount);

        if (remainder < 0) return false;

        for (let i = MONEY_TYPE_LENGTH - 1; i >= 0; i--) {
            this.money[i] = Math.floor(remainder / CONVERSION_RATE[i]);
            remainder -= this.money[i] * CONVERSION_RATE[i];
        }
        return true;
    }

    loseHP(amount) {
        this.currentStats.hp -= amount;
        if (this.currentStats.hp < 0) {
            this.currentStats.hp = 0;
        }
    }

    loseEnergy(amount) {
        this.currentStats.energy = this.currentStats.energy - amount;
        if (this.currentStats.energy < 0) {
            this.currentStats.energy = 0;
            console.error(ERROR_NOT_ENOUGH_ENERGY);
        }
    }

    energyCost(action) {
        switch (action) {
            case "Attack":
                return 1;
            case "Defend":
                return 1;
            case "Run":
                return 1; // in addition to cost for Move
            case "Move":
                return 1;
            default:
                console.error(ERROR_UNKNOWN_ACTION.fmt(action));
                return 0;
        }
    }

    /**
     * Randomly chooses an action for the entity to take
     * @returns {string}
     */
    chooseAction() {
        let randomAction = Math.floor(Math.random() * 4);
        switch(randomAction) {
            case 0:     return "Defend";
            default:    return "Attack";
        }
    }

    gainXP(amount) {
        let text = GAIN_XP_TEXT.fmt(this.name, amount, this.XP);
        console.log(GAIN_XP_TEXT.fmt(this.tag, amount, this.XP));

        this.XP += amount;

        let XPNeeded = Math.floor(
            Math.pow(this.level, XP_NEEDED_EXPONENT) * BASE_XP_LEVEL);
        if (this.XP >= XPNeeded) {
            this.XP -= XPNeeded;
            text += this.levelUp();
        }

        return text;
    }

    levelUp() {
        this.level++;
        for (let stat of STAT_NAMES) {
            this.baseStats[stat] = Math.floor(this.baseStats[stat]
                                                * LEVEL_UP_MULTIPLIER);
            this.maxStats[stat] = this.baseStats[stat] + this.gearStats[stat];
        }

        this.deathXP = Math.floor(this.deathXP * LEVEL_UP_MULTIPLIER);

        console.log(LEVEL_UP_TEXT.fmt(this.tag, this.level));

        return LEVEL_UP_TEXT.fmt(this.name, this.level);
    }

    rest() {
        console.log(this.tag + " rested");
        this.gainEnergy(this.maxStats.energy / REST_BASE_GAIN);
        this.gainHP(this.maxStats.hp / REST_BASE_GAIN);
    }

    die() {
        if (this.isAlive === false) {
            console.error(this.name + " is already dead");
        }

        this.isAlive = false;
    }

    // fraction of energy left
    fatigue() {
        return this.currentStats.energy / this.maxStats.energy;
    }

    energy() {
        return this.currentStats.energy;
    }

    // fraction of health left
    vitality() {
        return this.currentStats.hp / this.maxStats.hp;
    }

    hp() {
        return this.currentStats.hp;
    }

    agility() {
        return this.maxStats.agility * Math.sqrt(this.vitality()) *
            Math.sqrt(this.fatigue());
    }

    strength() {
        return this.maxStats.strength * Math.sqrt(this.vitality()) *
            Math.sqrt(this.fatigue());
    }

    statInfo() {
        return STAT_INFO.fmt(this.level, Math.floor(this.hp()),
            Math.floor(this.energy()), Math.floor(this.agility()),
            Math.floor(this.strength()));
    }

    moneyInfo() {
        let temp = "\n";

        for (let i = 0; i < MONEY_TYPE_LENGTH; i++) {
            temp += "{0}: {1}\n".fmt(MONEY_TYPES[i], this.money[i]);
        }

        return temp;
    }

    info() {
        if (this === me) {
            return super.info() + this.statInfo() + this.moneyInfo();
        } else if (this.hostility === 0) {
            return super.info();
        }
        return super.info() + this.statInfo();
    }

    simpleInfo() {
        return super.info() + "HP: " + this.hp() + '\nEnergy: ' + this.energy()
            + '\n';
    }
}

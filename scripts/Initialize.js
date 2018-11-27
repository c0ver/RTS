import * as Data from './Data.js';
import {readFile, getObjByName} from "./Miscellaneous.js";

import Thing from './Game/Thing.js';
import {itemTypeEnum} from './Thing/Item.js';
import Misc from './Thing/ItemTypes/Misc.js';
import Tool from './Thing/ItemTypes/Tool.js';
import Clothing from './Thing/ItemTypes/Clothing.js';
import Consumable from './Thing/ItemTypes/Consumable.js';

// Required Event order
import './EventTypes/Inventory.js';

// Plottables needs to be imported before Tile
import Place from './Thing/Plottables/Place.js';
import Tile from './Thing/Tile.js';
import {entityTypeEnum} from './Thing/Plottables/Entity.js';
import Human from './Thing/Plottables/EntityTypes/Human.js';
import Quest from './Thing/Quest.js';
import Trader from "./Thing/Plottables/EntityTypes/Human/Trader.js";
import Beast from "./Thing/Plottables/EntityTypes/Beast.js";

const TILE_TEXT_FILE = "assets/json/tileText.json";
const PLACE_LIST_FILE = "assets/json/placeList.json";
const ITEM_LIST_FILE = "assets/json/itemList.json";
const MONSTER_LIST_FILE = "assets/json/monsterList.json";
const UNIQUE_NPC_LIST_FILE = "assets/json/uniqueNPCList.json";
const TRADER_LIST_FILE = "assets/json/traderList.json";
const QUEST_LIST_FILE = "assets/json/questList.json";

const ERROR_NO_LOCATION_GIVEN = "No location given to place npc: {0}";

const START_X = 1;
const START_Y = 1;

function createTiles() {
    console.group("Creating Tiles");

    let tileObject = JSON.parse(readFile(TILE_TEXT_FILE));

    for(let tileName in tileObject) {
        let tile = tileObject[tileName];
        console.group(tileName);
        Data.tileList[Thing.id] = new Tile(tileName, tile.desc, tile.dangerLevel);
        console.groupEnd();
    }

    Object.assign(Data.totalList, Data.tileList);
    console.log(Data.tileList);

    console.groupEnd();
}

function createPlaces() {
    console.group("Creating Places");

    let placeObject = JSON.parse(readFile(PLACE_LIST_FILE));

    // push main map onto list
    console.group("main");
    Data.placeList[Thing.id] = new Place("main", "main", null, -1, -1, 32,
        false, "WILDERNESS");
    console.groupEnd();

    for(let placeName in placeObject) {
        console.group(placeName);

        let p = placeObject[placeName];
        Data.placeList[Thing.id] =
            new Place(placeName, p.desc, getObjByName(p.parentPlace, Data.placeList),
                p.xPos, p.yPos, p.size, p.hasEntry, p.type);

        console.groupEnd();
    }

    Object.assign(Data.totalList, Data.placeList);
    console.log(Data.placeList);

    console.groupEnd();
}

function createItems() {
    console.group("Creating Items");

    let itemObject = JSON.parse(readFile(ITEM_LIST_FILE));

    for(let itemName in itemObject) {
        console.group(itemName);

        let item = itemObject[itemName];
        let itemType = itemTypeEnum[item.type];

        switch(itemType) {
            case 1:
                Data.itemList[Thing.id] = new Misc(itemName, item.desc,
                    item.rarity, item.type, item.subType, item.value);
                break;
            case 2:
                Data.itemList[Thing.id] = new Tool(itemName, item.desc,
                    item.rarity, item.type, item.subType, item.value,
                    item.stats);
                break;
            case 3:
                Data.itemList[Thing.id] = new Clothing(itemName, item.desc,
                    item.rarity, item.type, item.subType, item.value,
                    item.stats);
                break;
            case 4:
                Data.itemList[Thing.id] = new Consumable(itemName, item.desc,
                    item.rarity, item.type, item.subType, item.value,
                    item.strength);
                break;
            default:
                console.error("Unknown type: {0}".fmt(item.type));
        }

        console.groupEnd();
    }

    Object.assign(Data.totalList, Data.itemList);
    console.log(Data.itemList);

    console.groupEnd();
}

function createMonsters() {
    console.group("Creating Monsters");

    let monsterObject = JSON.parse(readFile(MONSTER_LIST_FILE));

    for(let monsterName in monsterObject) {
        let m = monsterObject[monsterName];
        let monsterType = entityTypeEnum[m.type];
        let inventory = getInventory(m.inventory);

        console.group(monsterName);

        switch(monsterType) {
            case 1:
                Data.monsterList[Thing.id] = new Human(monsterName, m.desc,
                    getObjByName("main", Data.placeList), -1, -1, m.level, m.deathXP,
                    m.baseStats, m.hostility, inventory, m.wealthLevel, m.birthPriority);
                break;
            case 2:
                Data.monsterList[Thing.id] = new Beast(monsterName, m.desc,
                    getObjByName("main", Data.placeList), -1, -1, m.level, m.deathXP,
                    m.baseStats, m.hostility, inventory, m.birthPriority);
                break;
            default:
                console.error("Unknown type: {0}".fmt(m.type));
        }

        console.groupEnd();
    }

    Object.assign(Data.totalList, Data.monsterList);
    console.log(Data.monsterList);

    console.groupEnd();
}

function createEntities() {
    console.group("Creating Entities");

    console.group("Player");
    Data.npcList[Thing.id] = Data.createMe(new Human("You", "myDesc",
        getObjByName("Westwend", Data.placeList), START_X, START_Y, undefined,
        undefined, undefined, undefined, {}, 0));
    console.groupEnd();

    createUniqueNPCs();
    createTraders();

    Object.assign(Data.totalList, Data.npcList);
    console.log(Data.npcList);

    console.groupEnd();
}

function createUniqueNPCs() {
    console.group("Creating unique NPCs");

    let npcObject = JSON.parse(readFile(UNIQUE_NPC_LIST_FILE));

    for(let npcName in npcObject) {
        console.group(npcName);

        let npc = npcObject[npcName];
        let npcType = entityTypeEnum[npc.type];

        let parentPlace = getObjByName(npc.parentPlace, Data.placeList);
        let inventory = getInventory(npc.inventory);

        let xPos = npc.xPos;
        let yPos = npc.yPos;
        if ("relativeTo" in npc) {
            let plottable = getObjByName(npc.relativeTo, Data.totalList);
            xPos = plottable.xPos + npc["xDelta"];
            yPos = plottable.yPos + npc["yDelta"];
        } else if (xPos === undefined || yPos === undefined) {
            console.error(ERROR_NO_LOCATION_GIVEN.fmt(npcName));
        }

        switch(npcType) {
            case 1:
                Data.npcList[Thing.id] = new Human(npcName, npc.desc,
                    parentPlace, xPos, yPos, npc.level, npc.deathXP,
                    npc.baseStats, undefined, inventory, npc.wealthLevel);
                break;
            case 2:
                break;
            default:
                console.error("Unknown type: {0}".fmt(item.type));
        }

        console.groupEnd();
    }

    console.groupEnd();
}

function createTraders() {
    console.group("Creating Traders");

    let traderObject = JSON.parse(readFile(TRADER_LIST_FILE));

    for(let traderName in traderObject) {
        console.group(traderName);

        let t = traderObject[traderName];
        let inventory = getInventory(t.inventory);

        for(let placeID in Data.placeList) {
            if (Data.placeList[placeID].type === "TOWN") {
                Data.npcList[Thing.id] = new Trader(traderName,
                    Data.placeList[placeID], inventory, t.wealthLevel,
                    t.squareType);
            }
        }

        console.groupEnd();
    }

    console.groupEnd();
}

function createQuests() {
    console.group("Creating Quests");

    let questObject = JSON.parse(readFile(QUEST_LIST_FILE));

    for(let questName in questObject) {
        console.group(questName);

        let q = questObject[questName];
        Data.questList[Thing.id] = new Quest(questName, q.desc, q.story, q.start);

        console.groupEnd();
    }

    Object.assign(Data.totalList, Data.questList);
    console.log(Data.questList);

    console.groupEnd();
}

function getInventory(nameInventory) {

    let idInventory = {};

    for(let itemName in nameInventory) {
        let item = getObjByName(itemName, Data.itemList);
        idInventory[item.id] = nameInventory[itemName];
    }

    return idInventory;
}

createTiles();
createPlaces();
createItems();
createMonsters();
createEntities();
createQuests();

console.group("List of everything:");
console.log(Data.totalList);
console.groupEnd();


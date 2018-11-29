"use strict";

import {me, activeMonsters} from "../Data.js";

const BATTLE_INFO = "Battle between: ";

// storyText
const NO_ENERGY = "{0} {1} too weary to {2}.\n";
const ATTACK_TEXT = "{0} {1} {2} for {3} damage.\n";
const DIE_TEXT = "\n{0} {1} from this battle.\n";
const RUN_TEXT = "{0} {1} away from this battle.\n";
const DEFEND_TEXT = "{0} {1} a defensive stance.\n";
const END_TEXT = "The fight between {0} and {1} has ended. " +
    "{0} {2} victorious.\n\n";

const VERBS = {
    "ME": {
        "ENERGY": "are",
        "ATTACK": "attack",
        "DIE": "die",
        "RUN": "run",
        "DEFEND": "take",
        "END": "emerge"
    },
    "OTHER": {
        "ENERGY": "is",
        "ATTACK": "attacks",
        "DIE": "dies",
        "RUN": "runs",
        "DEFEND": "takes",
        "END": "emerges"
    }
};

const DEFEND_MODIFIER = 1.5;

// Crit chance:  0.1 * x ^ 3.3219
// x = 1, chance = 10%
// x = 2, chance = 100%
const CRIT_CHANCE_1 = 0.1;
const CRIT_CHANCE_2 = 3.321928095;

const CRIT_DAMAGE_MODIFIER = 3;

// Attack, Defend, Run
const NUMBER_OF_ACTIONS = 3;

const GRID_SIZE = 5;
const BORDER_WIDTH = 3;

let Sprite = PIXI.Sprite,
    resources = PIXI.loader.resources;

/**
 * Is a battle between two npc characters for now
 */
export default class Battle {

    /**
     * @param entityList {Entity[]} List of entities involved in this battle
     */
    constructor(entityList) {
        // deal with multiple enemies later
        if (entityList.length > 2) console.error("More than two fighters");

        this.entityList = entityList;
        this.totalXP = 0;

        this.entityList.sort(function (a, b) {
            return b.speed - a.speed
        });

        let $battleContainer = $("#battleContainer");
        $battleContainer.css("visibility", "visible");

        // let entity1 = new Sprite(
        //     resources[MONSTER_FILE.fmt()]
        // )

        // this.battle();
    }

    /**
     * A turn of the battle
     * @returns {String} storyText -- unneeded if player is not part of battle
     */
    turn() {
        let storyText = "";

        // checks if an action occurred this time
        this.actionOccurredThisTurn = false;

        for (let i = 0; i < this.fighters.length; i++) {
            let self = this.fighters[i];

            let subj = "OTHER";
            if (self.entity === me) subj = "ME";

            // randomly choose an enemy
            let enemy = self;
            while (enemy === self) {
                let randomEnemyIndex = Math.floor(Math.random() *
                    this.fighters.length);
                enemy = this.fighters[randomEnemyIndex];
            }

            // self does not have enough energy to perform the chosen action
            // so skip his turn
            if (self.actionSuccess === false) {
                storyText += NO_ENERGY.fmt(self.name, VERBS[subj].ENERGY,
                    self.command);
                console.log(NO_ENERGY.fmt(self.tag, VERBS[subj].ENERGY,
                    self.command));
                continue;
            }
            this.actionOccurredThisTurn = true;

            switch (self.command) {
                case "Attack":
                    // between 0 and 1
                    let critChance = Math.pow(self.entity.agility() /
                        enemy.entity.agility(), CRIT_CHANCE_2) * CRIT_CHANCE_1;
                    let damageModifier = 1;
                    if (Math.random() < critChance) {
                        damageModifier = CRIT_DAMAGE_MODIFIER;
                    }

                    let damage = Math.floor(self.attack / enemy.defense *
                        damageModifier);
                    if (damage === 0) damage = damageModifier;
                    if (enemy.entity.energy() === 0) damage = enemy.entity.hp();

                    enemy.entity.loseHP(damage);

                    storyText += ATTACK_TEXT.fmt(self.name, VERBS[subj].ATTACK,
                        enemy.name, damage);
                    console.log(ATTACK_TEXT.fmt(self.tag, VERBS[subj].ATTACK,
                        enemy.tag, damage));

                    // battle has ended when the enemy dies
                    if (enemy.entity.hp() === 0 ||
                        enemy.entity.energy() === 0) {

                        storyText += this.removeFighterFromBattle(self, enemy,
                            subj);

                        // no more enemies left
                        if (this.fighters.length === 1) {
                            storyText += END_TEXT.fmt(self.name, enemy.name,
                                VERBS[subj].END);
                            console.log(END_TEXT.fmt(self.tag, enemy.tag,
                                VERBS[subj].END));
                        }

                        if (enemy === me) return storyText;
                    }
                    break;

                case "Defend":
                    self.defense *= DEFEND_MODIFIER;

                    storyText += DEFEND_TEXT.fmt(self.name, VERBS[subj].DEFEND);
                    console.log(DEFEND_TEXT.fmt(self.tag, VERBS[subj].DEFEND));
                    break;

                case "Run":
                    // randomly choose an adjacent square to run to
                    let random = Math.floor(Math.random() * 4);
                    switch (random) {
                        case 0:
                            self.entity.move(0, -1);
                            break;
                        case 1:
                            self.entity.move(0, 1);
                            break;
                        case 2:
                            self.entity.move(1, 0);
                            break;
                        case 3:
                            self.entity.move(-1, 0);
                            break;
                    }

                    let index = this.fighters.indexOf(self);
                    this.fighters.splice(index, 1);

                    storyText += RUN_TEXT.fmt(self.name, VERBS[subj].RUN);
                    console.log(RUN_TEXT.fmt(self.tag, VERBS[subj].RUN));
            }

            // energy cost may be dependent on entity
            self.entity.loseEnergy(self.entity.energyCost(self.command));

            if (this.fighters.length === 1) {
                break;
            }
        }

        // reset modifiers after each round
        for (let i = 0; i < this.fighters.length; i++) {
            this.fighters[i].attack = this.fighters[i].entity.strength();
            this.fighters[i].defense = this.fighters[i].entity.strength();
        }

        return storyText;
    }

    removeFighterFromBattle(self, enemy, subj) {
        let storyText = "";

        // switch the subj for the die text
        if (subj === "ME") subj = "OTHER";
        else subj = "ME";

        storyText += DIE_TEXT.fmt(enemy.name, VERBS[subj].DIE);
        console.log(DIE_TEXT.fmt(enemy.tag, VERBS[subj].DIE));

        // remove dead from this battle, activeMonsters, plot
        let index = this.fighters.indexOf(enemy);
        this.fighters.splice(index, 1);
        enemy.entity.getTile().removePlottable(enemy.entity);
        enemy.entity.die();

        if (enemy.entity === me) {
            // TODO: go to Losing Screen
            console.error("You died");
            return;
        }

        this.totalXP += enemy.entity.deathXP;

        delete activeMonsters[enemy.entity.id];

        return storyText;
    }

    /**
     * Repeatedly call turn until there is only one fighter left
     */
    battle() {
        let battleText = BATTLE_INFO;
        for (let fighter of this.fighters) {
            battleText += fighter.tag + ", ";
        }
        console.log(battleText);

        while (this.fighters.length > 1) {
            // randomly choose an action for each fighter each time
            for (let fighter of this.fighters) {
                fighter.setCommand(fighter.entity.chooseAction());
            }
            this.fighters.sort(function (a, b) {
                return b.speed - a.speed
            });

            this.turn();

            if (this.actionOccurredThisTurn === false) {
                console.log("Everyone is too tired to fight");
                for (let fighter of this.fighters) {
                    fighter.entity.rest();
                }
                break;
            }
        }

        this.fighters[0].entity.gainXP(this.totalXP);
        for (let entity of this.entityList) {
            if (this.fighters[0].entity === entity) continue;

            this.fighters[0].entity.loot(entity);
        }
    }

    static actionSpeed(command) {
        switch (command) {
            case "Attack":
                return 1;
            case "Defend":
                return 2;
            case "Inventory":
                return 1;
            case "Run":
                return 3;
        }
    }

    static initialization() {
        $("<div>", {id: "battleContainer"}).css("visibility", "hidden")
            .appendTo("#mainContainer");
        let $battleContainer = $("#battleContainer");
        let width = $battleContainer.width();
        let height = $battleContainer.height();
        Battle.battleApp = new PIXI.Application(width, height);
        $battleContainer.append(Battle.battleApp.view);

        let grid = new PIXI.Container();
        let rectangleWidth = width / GRID_SIZE;
        let rectangleHeight = height / GRID_SIZE;
        for(let i = 0; i < GRID_SIZE; i++) {
            for(let j = 0; j < GRID_SIZE; j++) {
                let square = new PIXI.Graphics();
                square.lineStyle(BORDER_WIDTH, 0x1E231D, 1);
                square.beginFill(0x6D8467);
                square.drawRect(0, 0, rectangleWidth, rectangleHeight);
                square.endFill();
                square.position.set(i * rectangleWidth, j * rectangleHeight);

                grid.addChild(square);
            }
        }

        Battle.battleApp.stage.addChild(grid);
    }

}

class Fighter {
    /**
     * @param {Entity} entity
     * @param {String} command
     */
    constructor(entity, command) {
        this.name = entity.name;
        this.tag = entity.tag;
        this.entity = entity;
        this.defense = entity.strength();
        this.attack = entity.strength();

        this.setCommand(command);
    }

    setCommand(command) {
        this.command = command;
        this.actionSuccess = this.entity.energy() >= this.entity.energyCost(command);

        // larger number is faster
        this.speed = this.entity.agility() * this.entity.fatigue() *
            Battle.actionSpeed(command);
    }
}

Battle.battleApp = {};

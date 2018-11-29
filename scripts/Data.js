export let placeList = {};
export let tileList = {};

export let itemList = {};

export let monsterList = {};
export let activeMonsters = {};

export let npcList = {};

export let questList = {};

export let totalList = {};

 PIXI.loader
     .add("assets/plot/images/Taedmorden.png")
     .add("assets/plot/images/Westwend.png")
     .add("assets/plot/images/Pirn.png")
     .add("assets/plot/images/main.png")
     .add("assets/playerIcon.png")
     .add("assets/monsters/bear.png")
     .add("assets/monsters/wolf.png")
     .load(function() {
         console.log("Finished loading");
     });

// the function needs to be in here because exported values cannot be redeclared
// me should probably be in here instead of Game.js to avoid circular dependencies
export let me;
export function createMe(player) {
    console.log("Creating me");
    me = player;
    console.log(me);
    return me;
}

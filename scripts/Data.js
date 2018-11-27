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
     .load(function() {
         console.log("finished loading");
     });

// the player
export let me;
export function createMe(player) {
    console.log("Creating me");
    me = player;
    console.log(me);
    return me;
}

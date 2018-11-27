"use strict";

import {me} from "../Data.js";

export default class ActionCombat {

    constructor() {
        let $battleContainer = $("#battleContainer");
        $battleContainer.css("visibility", "visible");
        let width = $battleContainer.width();
        let height = $battleContainer.height();
        this.app = new PIXI.Application(width, height);
        $battleContainer.append(this.app.view);

        // PIXI.loader
        //     .add("assets/arrow.png")
        //     .add("assets/cat.png")
        //     .load(this.setup());

// create a new Sprite from an image path
        var arrow = PIXI.Sprite.fromImage('assets/arrow.png');

// center the sprite's anchor point
        arrow.anchor.set(0.5);

// move the sprite to the center of the screen
        arrow.x = this.app.screen.width / 2;
        arrow.y = this.app.screen.height / 2;

        this.app.stage.addChild(arrow);

// Listen for animate update
        this.app.ticker.add(function(delta) {
            // just for fun, let's rotate mr rabbit a little
            // delta is 1 if running at 100% performance
            // creates frame-independent transformation
            arrow.rotation += 0.1 * delta;
        });
    }

    setup() {
        console.log("Setting up battle");

        let arrow = new PIXI.Sprite(
            PIXI.loader.resources["assets/arrow.png"].texture
        );

        console.log(arrow);
        console.log(this.app)
        this.app.stage.addChild(arrow);
    }
}

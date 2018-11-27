import Human from "../Human.js";

const TRADER_DESC = "A person specializing in the art of buying low and selling " +
    "high.\n";

export default class Trader extends Human {
    /**
     * @param name
     * @param parentPlace
     * @param inventory
     * @param wealthLevel
     * @param squareType
     */
    constructor(name, parentPlace, inventory, wealthLevel, squareType) {
        let pos = parentPlace.getTileCoordinates("MARKET");
        if (squareType !== undefined) {
            pos = parentPlace.getTileCoordinates(squareType);
        }

        super(name, TRADER_DESC, parentPlace, pos[0], pos[1], undefined,
            undefined, undefined, undefined, inventory, wealthLevel);

    }
}
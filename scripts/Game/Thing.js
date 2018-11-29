export default class Thing {

    /**
     * @param {String} name - the name of this
     * @param {String} desc - the description of this
     */
    constructor(name, desc) {
        this.name = name;
        this.desc = desc;
        this.id = (Thing.id++).toString();

        this.tag = this.name + "#" + this.id;

        this.sprite = null;
    }

}

Thing.id = 1;
import WheelbuilderQuery from './WheelbuilderQuery';


export default class WheelbuilderStageOptions {
    constructor() {
        this.options = {}
    }

    init() {

    }

    have_member(option_name) {
        if (this.options.hasOwnProperty(option_name)) {
            return true;
        }
        return false;
    }

    all_options_selected() {
        let ret_val = true;
        for (let key in this.options) {
            if (this.options[key] === null) ret_val = false
        }
        return ret_val;
    }

    set(option_name, value) {
        if (value === "Pick one...") {
            this.options[option_name] = null;
        } else {
            this.options[option_name] = value;
        }
    }

    get(option_name) {
        return this.options[option_name];
    }

    get_attributes() {
        return Object.keys(this.options);
    }

    remove_option(option_name) {
        delete this.options[option_name];
    }

    get_current_selection(){
        return this.options;
    }

    to_query() {
        //TODO implement?
    }

}



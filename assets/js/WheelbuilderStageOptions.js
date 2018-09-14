import WheelbuilderConfig from './WheelbuilderConfig';

// collects options associated with given Stage that are present on page
export default class WheelbuilderStageOptions {
    constructor() {
        this.options = {};
        this.wb_config = new WheelbuilderConfig();
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
        if ((value === this.wb_config.zeroth_option_default_name) ||
            (value === this.wb_config.zeroth_option_alternative_name)) {
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

    reset() {
        for (let key in this.options) {
            this.options[key] = null;
        }
    }

    to_query() {
        //TODO implement?
    }

}



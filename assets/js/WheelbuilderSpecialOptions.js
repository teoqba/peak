import WheelbuilderConfig from './WheelbuilderConfig.js';

export default class WheelbuilderSpecialOptions {
    constructor(option_aliases) {
        this.config = new WheelbuilderConfig();
        this.option_aliases = option_aliases;
        this.poe_option_name = this.config.poe_option_name;
        this.special_option_status = {};
    }

    init() {
        // hide all the special options
        for (let i=0; i<this.config.special_options.length; i++) {
            let option_name = this.config.special_options[i];
            try {
                let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
                option_object.show();
                this.special_option_status[option_name] = true;
            } catch (e) {}
        }
    }

    is_special_option_hidden(option_name) {
        if(this.special_option_status.hasOwnProperty(option_name)){
            return this.special_option_status[option_name]
        } else {
            return false
        }
    }

    show_hide(query_result) {
        // Point of engagements
        if (this.option_aliases.all_options_on_page_aliased.hasOwnProperty(this.poe_option_name)) {
            try {
                this.points_of_engagements_logic(query_result);
            } catch (e) {console.log('PEO Error', e);}
        }
    }

    points_of_engagements_logic(query_result) {
        let option_name = this.poe_option_name;
        let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
        if ((query_result['Rear_Hub'].length === 1) && (query_result[option_name].length > 0)){
            option_object.show();
            this.special_option_status[option_name] = false;
        } else {
            option_object.hide();
            this.special_option_status[option_name] = true;
        }
    }
}

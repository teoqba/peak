import WheelbuilderConfig from './WheelbuilderConfig.js';
//
// controls special options such as Points Of Engagements or Bearing Upgrades
//
export default class WheelbuilderSpecialOptions {
    constructor(option_aliases) {
        this.config = new WheelbuilderConfig();
        this.option_aliases = option_aliases;
        this.poe_option_name = this.config.poe_option_name;
        this.front_bearing_upgrade = this.config.front_bearing_upgrade;
        this.rear_bearing_upgrade = this.config.rear_bearing_upgrade;
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
            } catch (e) {} // poe does not exist, don't do anything.
        }
        // Front ceramic bearing
        if (this.option_aliases.all_options_on_page_aliased.hasOwnProperty(this.front_bearing_upgrade)) {
            try {
                this.front_bearing_upgrade_logic(query_result);
            } catch (e) {} // poe does not exist, don't do anything.
        }
        // Rear ceramic bearing
        if (this.option_aliases.all_options_on_page_aliased.hasOwnProperty(this.rear_bearing_upgrade)) {
            try {
                this.rear_bearing_upgrade_logic(query_result);
            } catch (e) {} // poe does not exist, don't do anything.
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
            let $option_values_object = $(option_object).find('.wb-empty-option');
            $option_values_object.prop('selected', true);
            this.special_option_status[option_name] = true;
        }
    }
    front_bearing_upgrade_logic(query_result){
        let option_name = this.front_bearing_upgrade;
        let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
        if ((query_result['Front_Hub'].length === 1) && (query_result[option_name].length > 0)){
            option_object.show();
            this.special_option_status[option_name] = false;
        } else {
            option_object.hide();
            let $empty_option = $(option_object).find('.wb-empty-option');
            $empty_option.prop('selected', true);
            $empty_option.text(this.config.zeroth_option_default_name);
            this.special_option_status[option_name] = true;
        }
    }

    rear_bearing_upgrade_logic(query_result){
        let option_name = this.rear_bearing_upgrade;
        let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
        if ((query_result['Rear_Hub'].length === 1) && (query_result[option_name].length > 0)){
            option_object.show();
            this.special_option_status[option_name] = false;
        } else {
            option_object.hide();
            let $empty_option = $(option_object).find('.wb-empty-option');
            $empty_option.prop('selected', true);
            $empty_option.text(this.config.zeroth_option_default_name);
            this.special_option_status[option_name] = true;
        }
    }
}

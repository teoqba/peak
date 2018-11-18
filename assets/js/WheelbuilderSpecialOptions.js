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
        this.front_rim_decal = this.config.front_rim_decal_color;
        this.rear_rim_decal = this.config.rear_rim_decal_color;
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
            } catch (e) {}
        }
        // Rear ceramic bearing
        if (this.option_aliases.all_options_on_page_aliased.hasOwnProperty(this.rear_bearing_upgrade)) {
            try {
                this.rear_bearing_upgrade_logic(query_result);
            } catch (e) {}
        }

        // Options which showing was delegated to stage two
        if (query_result['inventory_type'] !== 'Rims') { // so they don't show in stage one when back button is pressed
            if (this.option_aliases.all_options_on_page_aliased.hasOwnProperty(this.front_rim_decal)) {
                let option_object = this.option_aliases.all_options_on_page_aliased[this.front_rim_decal];
                if (this.is_special_option_hidden(this.front_rim_decal)) {
                    option_object.hide();
                } else {
                    option_object.show();
                }
            }

            if (this.option_aliases.all_options_on_page_aliased.hasOwnProperty(this.rear_rim_decal)) {
                let option_object = this.option_aliases.all_options_on_page_aliased[this.rear_rim_decal];
                if (this.is_special_option_hidden(this.rear_rim_decal)) {
                    option_object.hide();
                } else {
                    option_object.show();
                }

            }
        }
    }

    delegate_rim_options_show_hide_to_stage_two(query_result, build_type) {
        // Front Rim Decals Color
        if (this.option_aliases.all_options_on_page_aliased.hasOwnProperty(this.front_rim_decal)) {
            try {
                this.front_rim_decal_logic(query_result, build_type);
            } catch (e) {}
        }
        // Rear rim Decals Color
        if (this.option_aliases.all_options_on_page_aliased.hasOwnProperty(this.rear_rim_decal)) {
            try {
                this.rear_rim_decal_logic(query_result, build_type);
            } catch (e) {}
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

    front_rim_decal_logic(query_result, build_type) {
        //TODO: we need to have query type here. This should be only enabled for rim query
        if (query_result['inventory_type'] === 'Rims') {
            let option_name = this.front_rim_decal;
            let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
            // if ((query_result['Front_Rim_Model'].length === 1) && (query_result[option_name].length > 0)) {
            if ((query_result[option_name].length > 0) && (build_type !== 'Rear Wheel') ) {
                // option_object.show();
                this.special_option_status[option_name] = false;
            } else {
                // option_object.hide();
                //TODO: swatch does not have empty option, so there is not fallback selection.
                // We need this when we will have selection of rims whan one has customizable decal and other not
                // let $option_values_object = $(option_object).find('.wb-empty-option');
                // $option_values_object.prop('selected', true);
                this.special_option_status[option_name] = true;
            }
        }
    }

    rear_rim_decal_logic(query_result, build_type) {
        //TODO: we need to have query type here. This should be only enabled for rim query
        if (query_result['inventory_type'] === 'Rims') {
            let option_name = this.rear_rim_decal;
            let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
            // if ((query_result['Rear_Rim_Model'].length === 1) && (query_result[option_name].length > 0)) {
            if ((query_result[option_name].length > 0) && (build_type !== 'Front Wheel')) {
                // option_object.show();
                this.special_option_status[option_name] = false;
            } else {
                // option_object.hide();
                //TODO: swatch does not have empty option, so there is not fallback selection.
                // We need this when we will have selection of rims whan one has customizable decal and other not
                // let $option_values_object = $(option_object).find('.wb-empty-option');
                // $option_values_object.prop('selected', true);
                this.special_option_status[option_name] = true;
            }
        }
    }
}

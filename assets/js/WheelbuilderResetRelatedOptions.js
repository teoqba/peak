import WheelbuilderConfig from './WheelbuilderConfig.js';

export default class WheelbuilderResetRelatedOptions {
    // Module to reset additional options when master option is reset
    // Example: Reset Hub Color when Hub is reset
    constructor(parent) {
        this.parent = parent;
        this.all_options_on_page = parent.all_options_on_page;
        this.wb_config = new WheelbuilderConfig();
        this.option_aliases = parent.option_aliases;

    }

    related_option_reset($changed_option) {

        let option_name = this.parent.get_name_of_changed_option($changed_option);
        let option_name_alias = this.option_aliases.option_alias[option_name];
        let $option_object = $(this.option_aliases.all_options_on_page_aliased[option_name_alias]);
        const $option_values_object = $option_object.find('.form-select');
        const $selected_item = $option_values_object.find(':selected');
        let selected_index = $selected_item.index();

        if ((option_name_alias === 'Front_Hub') && selected_index < 1) {
            // hub special options are reset everytime option change in WheelbuilderFilterStages.on_option_change_addition_action
            let related_options = ['Front_Hub_Color'];
            this.do_reset(related_options, this.parent.hub_query);
            this.parent.hub_query.remove('Front_Hub_Style');
        } else if ((option_name_alias === 'Rear_Hub') && selected_index < 1) {
            // hub special options are reset everytime option change in WheelbuilderFilterStages.on_option_change_addition_action
            let related_options = ['Rear_Hub_Color', 'Drivetrain_Type'];
            this.do_reset(related_options, this.parent.hub_query);
            this.parent.hub_query.remove('Rear_Hub_Style');

            console.log("Calling reset from related options1");
            this.parent.weight_query.reset('Drivetrain_Type');
            console.log("Weight query after reset", this.parent.weight_query.rear_hub_query);
        } else if ((option_name_alias === 'Front_Rim_Model') && selected_index < 1) {
            let related_options = ['Front_Hole_Count'];
            this.do_reset(related_options, this.parent.rim_query);
        } else if ((option_name_alias === 'Rear_Rim_Model') && selected_index < 1) {
            let related_options = ['Rear_Hole_Count'];
            this.do_reset(related_options, this.parent.rim_query);
        } else if ((option_name_alias === 'Drivetrain_Type') && selected_index < 1) {
            console.log("Calling reset from related options2");
            this.parent.weight_query.reset('Drivetrain_Type');
            console.log("Weight query after reset", this.parent.weight_query.rear_hub_query);
        }
    }

    do_reset(related_options, query) {
        for (let i=0; i< related_options.length; i++) {
            let option_name = related_options[i];
            this.parent.reset_option_selection(option_name);
            query.remove(option_name);
        }

    }

}

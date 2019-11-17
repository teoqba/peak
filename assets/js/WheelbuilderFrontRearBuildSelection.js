import WheelbuilderConfig from './WheelbuilderConfig.js';
import utils from "@bigcommerce/stencil-utils/src/main";

export default class WheelbuilderFrontRearBuildSelection {
    // Depending if customer chosen Wheelset/Front/Rear Wheel hide or show relevant options
    constructor(option_aliases, all_other_options_on_page) {
        this.wb_config = new WheelbuilderConfig();

        this.front_wheel_options = this.wb_config.front_wheel_options;
        this.rear_wheel_options = this.wb_config.rear_wheel_options;

        this.front_wheel_options_stage_one = this.wb_config.front_wheel_options_stage_one;
        this.rear_wheel_options_stage_one = this.wb_config.rear_wheel_options_stage_one;

        this.option_aliases = option_aliases;
        this.all_other_options_on_page = all_other_options_on_page;
        this.is_front_wheel_hidden = false;
        this.is_rear_wheel_hidden = false;
    }
    init() {
        if (this.all_other_options_on_page.hasOwnProperty(this.wb_config.build_type_option_name)) {
            return true;
        }
        return false

    }
    get_wheel_build_type() {
        const $option_object = this.all_other_options_on_page[this.wb_config.build_type_option_name];
        const $checked_rectangle = $option_object.find('.form-rectangle:checked');
        const $label = $checked_rectangle.parent('.form-label');
        const $span = $label.find('.rectangle-text');
        let wheel_build_type = $span.text();
        return wheel_build_type

    }

    get_front_rear_options_to_hide(stage_one_finished){
        if (stage_one_finished === true) { //hide unhide Front Rear options only when stage one is completed
            let wheel_build_type = this.get_wheel_build_type();
            if (wheel_build_type === 'Front Wheel') {
                return this.rear_wheel_options;
            } else if (wheel_build_type === 'Rear Wheel') {
                return this.front_wheel_options;
            } else { //Wheelset
                return [];
            }
        } else {
            return []; //nothing to hide
        }
    }

     get_stage_one_front_rear_options_to_hide() {
        // if Front Wheel button selected - return 'rear'
        // if Rear Wheel button selected - return 'front'
        // if Wheelset button selected - return 'wheelset'
        let wheel_build_type = this.get_wheel_build_type();
        if (wheel_build_type === 'Front Wheel') {
            return 'rear';
        } else if (wheel_build_type === 'Rear Wheel') {
            return 'front';
        } else { //Wheelset
            return 'wheelset';
        }
    }

    disable_selections() {
        const $option_object = this.all_other_options_on_page[this.wb_config.build_type_option_name];
        const $options = $option_object.find('.form-rectangle');
        $options.each(function() {
            $(this).attr('disabled', 'disabled');
        });
    }

    reset_selection(){
        const $option_object = this.all_other_options_on_page[this.wb_config.build_type_option_name];
        const $options = $option_object.find('.form-rectangle');
        let first_elem = $options.first();
        $(first_elem).prop('checked', true);

    }

    hide_selections_buttons() {
        const $option_object = this.all_other_options_on_page[this.wb_config.build_type_option_name];
        $option_object.hide();

    }
    show_selections_buttons() {
        const $option_object = this.all_other_options_on_page[this.wb_config.build_type_option_name];
        $option_object.show();
    }

    check_first() {
        //always check the first item in the "I want to build"
        const $option_object = this.all_other_options_on_page[this.wb_config.build_type_option_name];
        let items = $option_object.find('.form-rectangle');
        let item = items[0];
        $(item).prop('checked', true);
        // fire pricing  update
        utils.hooks.emit('product-option-change');
        $(item).change();
    }
}

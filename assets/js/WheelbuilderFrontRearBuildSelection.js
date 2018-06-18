import WheelbuilderConfig from './WheelbuilderConfig.js';

export default class WheelbuilderFrontRearBuildSelection {
    // Depending if customer chosen Wheelset/Front/Rear Wheel hide or show relevant options
    constructor(option_aliases, all_other_options_on_page) {
        this.wb_config = new WheelbuilderConfig();

        this.front_wheel_options = this.wb_config.front_wheel_options;
        this.rear_wheel_options = this.wb_config.rear_wheel_options;

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
}

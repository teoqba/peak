import WheelbuilderConfig from './WheelbuilderConfig.js';

export default class WheelbuilderFrontRearBuildSelection {
    // Depending if customer chosen Wheelset/Front/Rear Wheel hide or show relevant options
    constructor(option_aliases, all_other_options_on_page) {
        this.wb_config = new WheelbuilderConfig()
        this.front_wheel_options = this.wb_config.front_wheel_options;
        this.rear_wheel_options = this.wb_config.rear_wheel_options;
        this.option_aliases = option_aliases;
        this.all_other_options_on_page = all_other_options_on_page;
        this.is_front_wheel_hidden = false;
        this.is_rear_wheel_hidden = false;
    }

    get_wheel_build_type() {
        const $option_object = this.all_other_options_on_page[this.wb_config.build_type_option_name];
        const $checked_rectangle = $option_object.find('.form-rectangle:checked');
        const $label = $checked_rectangle.parent('.form-label');
        const $span = $label.find('.rectangle-text');
        let wheel_build_type = $span.text();
        return wheel_build_type

    }

    __show_hide_action(action, wheel_choice_object) {
        // Goes through wheel_choice_object (its either front_wheel_options or rear_wheel_options arrays)
        // and hides option_object given by this label
        for (let i = 0; i < wheel_choice_object.length; i++) {
            let option_name = wheel_choice_object[i];
            let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
            if (action === 'show') {
                option_object.show();
            } else {
                option_object.hide();
            }

        }
    }

    rear_wheel_action(action){
        // if action can be 'hide' or 'show'
        this.__show_hide_action(action, this.rear_wheel_options)
    }

    front_wheel_action(action){
        // if action can be 'hide' or 'show'
        this.__show_hide_action(action, this.front_wheel_options)
    }

    show_hide_front_rear(){
        let wheel_build_type = this.get_wheel_build_type();
        if (wheel_build_type === 'Front Wheel') {
            this.rear_wheel_action('hide');
            this.front_wheel_action('show');
        } else if (wheel_build_type === 'Rear Wheel') {
            this.rear_wheel_action('show');
            this.front_wheel_action('hide');
        } else { //Wheelset
            this.rear_wheel_action('show' );
            this.front_wheel_action('show');
        }
    }
}

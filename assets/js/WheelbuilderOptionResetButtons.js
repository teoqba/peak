import WheelbuilderConfig from './WheelbuilderConfig.js';

export default class WheelbuilderOptionResetButtons {
    // hides and shows option reset buttons
    constructor(parent) {
        this.parent = parent;
        this.all_options_on_page = parent.all_options_on_page;
        this.wb_config = new WheelbuilderConfig();
        this.$reset_buttons = this.parent.$reset_buttons;
        this.option_aliases = parent.option_aliases;
        this.all_buttons = {}; // {option_name: $button_object}
    }

    init() {
        //find and hide all buttons
        this.find_all_buttons();
    }

    find_all_buttons() {
        // find and hide all buttons
        // option_name is real option name, not alias
        for (let option_name in this.all_options_on_page) {
            let $obj = this.find_button_object(option_name);
            this.all_buttons[option_name] = $obj;
            $obj.hide();
        }
    }

    find_button_object(option_name) {
        // input is option name, not alias
        let button_id = '#'+this.wb_config.option_reset_button_prefix + option_name.split('_').join('\\ ');
        let $button_object = this.parent.$parent_page.find(button_id);
        return $button_object
    }

    find_real_option_name(option_name) {
        let real_option_name =  this.option_aliases.alias_to_real_name[option_name];
        if (real_option_name == undefined) real_option_name = option_name;
        return real_option_name;
    }

    show(option_name) {
        // if option is aliases finds its real name
        option_name = this.find_real_option_name(option_name);
        let $button_object = this.all_buttons[option_name];
        try {
            $button_object.show();
        } catch(err) {}
    }


    hide(option_name) {
        // if option is aliases finds its real name
        option_name = this.find_real_option_name(option_name);
        let $button_object = this.all_buttons[option_name];
        try {
            $button_object.hide();
        } catch(err) {}
    }
;}
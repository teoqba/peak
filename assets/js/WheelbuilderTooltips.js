import WheelbuilderConfig from './WheelbuilderConfig.js';

export default class WheelbuilderTooltips {
    // hides and shows option reset buttons
    constructor(parent, tooltips_text) {
        this.parent = parent;
        this.tooltips_text = tooltips_text;
        this.all_options_on_page = parent.all_options_on_page;
        this.wb_config = new WheelbuilderConfig();
        this.$reset_buttons = this.parent.$reset_buttons;
        this.option_aliases = parent.option_aliases;

    }

    init() {
        this.find_all_tooltips();
    }

    find_all_tooltips() {
        // find and hide all buttons
        // option_name is real option name, not alias
        for (let option_name in this.all_options_on_page) {
            let $bubble_obj = this.find_tooltip_object(option_name)['bubble'];
            let $icon_obj = this.find_tooltip_object(option_name)['icon'];

            let t_text="No tool tip available";
            if (this.tooltips_text.hasOwnProperty(option_name)) {
                t_text = this.tooltips_text[option_name];
            } else {
                $icon_obj.hide();
            }
            $bubble_obj.html(t_text);
        }
    }

    find_tooltip_object(option_name) {
        // input is option name, not alias
        let tooltip_icon = '#'+this.wb_config.option_tooltip_icon_prefix + option_name.split('_').join('\\ ');
        let tooltip_bubble = '#'+this.wb_config.option_tooltip_bubble_prefix + option_name.split('_').join('\\ ');
        let $tooltip_icon_object = this.parent.$parent_page.find(tooltip_icon);
        let $tooltip_bubble_object = this.parent.$parent_page.find(tooltip_bubble);
        return {"bubble": $tooltip_bubble_object, "icon": $tooltip_icon_object};
    }
;}
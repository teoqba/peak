import WheelbuilderConfig from './WheelbuilderConfig.js';

export default class WheelbuilderTooltips {
    constructor(parent, tooltips_text) {
        this.parent = parent;
        this.tooltips_text = tooltips_text;
        this.all_options_on_page = parent.all_options_on_page;
        this.wb_config = new WheelbuilderConfig();
    }

    init() {
        this.find_all_tooltips();
    }
    // TODO: add error catching when the JSON has errors in syntax
    find_all_tooltips() {
        // iterate over all the options on the website and and see if in tooltip file there is a tooltip for this option
        for (let option_name in this.all_options_on_page) {
            let tooltip_object = this.find_tooltip_object(option_name);
            let $bubble_obj = tooltip_object['bubble'];
            let $icon_obj = tooltip_object['icon'];

            let t_text = "No tool tip available";
            let option_name_with_space = option_name.split('_').join(' ');
            try {
                if (this.tooltips_text.hasOwnProperty(option_name_with_space)) {
                    t_text = this.tooltips_text[option_name_with_space];
                    $icon_obj.show();
                } else {
                    // if tooltip text for option does not exist in the file, hide the tooltip icon
                    $icon_obj.hide();
                }
                $bubble_obj.html(t_text);
            } catch (err) {
                // hide option in the case there is some problem with parsing of the json file
                console.log('Error in tooltip parse');
                $icon_obj.hide();
            }
        }
    }

    find_tooltip_object(option_name) {
        // for given option, find tooltip icon object and tooltip bubble object
        let tooltip_icon = '#'+this.wb_config.option_tooltip_icon_prefix + option_name.split('_').join('\\ ');
        let tooltip_bubble = '#'+this.wb_config.option_tooltip_bubble_prefix + option_name.split('_').join('\\ ');
        let $tooltip_icon_object = this.parent.$parent_page.find(tooltip_icon);
        let $tooltip_bubble_object = this.parent.$parent_page.find(tooltip_bubble);
        return {"bubble": $tooltip_bubble_object, "icon": $tooltip_icon_object};
    }
;}
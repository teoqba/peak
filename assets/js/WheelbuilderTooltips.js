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
            let $bubble_obj = this.find_tooltip_object(option_name)['bubble'];
            let $icon_obj = this.find_tooltip_object(option_name)['icon'];

            let t_text="No tool tip available";
            if (this.tooltips_text.hasOwnProperty(option_name)) {
                t_text = this.tooltips_text[option_name];
            } else {
                // if tooltip text for option does not exist in the file, hide the tooltip icon
                $icon_obj.hide();
            }
            $bubble_obj.html(t_text);
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
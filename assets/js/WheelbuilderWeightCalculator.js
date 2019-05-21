import WheelbuilderConfig from './WheelbuilderConfig.js';

export default class WheelbuilderWeightCalculator {
    constructor(parent) {
        this.wb_config = new WheelbuilderConfig();
        this.front_rim_weight = 0;
        this.rear_rim_weight = 0;
        this.front_hub_weight = 0;
        this.rear_hub_weight = 0;
        this.spoke_weight = 0;
        this.total_build_weight = 0;
        this.front_hole_count = 0;
        this.rear_hole_count = 0;

        this.front_wheel_weight = 0;
        this.rear_wheel_weight = 0;
        this.front_spoke_weight = 0;
        this.rear_spoke_weight = 0;

        this.parent = parent;
    }

    set_component_weight(component_name, weight) {
        weight = parseInt(weight);
        if (component_name === 'front_rim') {
            this.front_rim_weight = weight;
            this.parent.$front_rim_weight_display.text(this.format_inline_weight_display(weight));
        } else if (component_name == 'rear_rim') {
            this.rear_rim_weight = weight;
            this.parent.$rear_rim_weight_display.text(this.format_inline_weight_display(weight));
        } else if (component_name === 'front_hub') {
            this.front_hub_weight = weight;
            this.parent.$front_hub_weight_display.text(this.format_inline_weight_display(weight));
        } else if (component_name === 'rear_hub') {
            this.rear_hub_weight = weight;
            this.parent.$rear_hub_weight_display.text(this.format_inline_weight_display(weight));
        } else if (component_name === 'spoke') {
            let front_hole_count = this.get_count("Front_Hole_Count");
            let rear_hole_count = this.get_count("Rear_Hole_Count");
            this.spoke_weight = (front_hole_count * weight) + (rear_hole_count * weight);
            this.front_spoke_weight = front_hole_count * weight;
            this.rear_spoke_weight = rear_hole_count * weight;
            this.parent.$spoke_weight_display.text(this.format_inline_weight_display(this.spoke_weight));
        }
        this.total_build_weight = this.front_rim_weight + this.rear_rim_weight
                            + this.front_hub_weight + this.rear_hub_weight
                            + this.spoke_weight;

        // Calculate front and rear wheel builds weight separately
        this.front_wheel_weight = this.front_rim_weight + this.front_hub_weight + this.front_spoke_weight;
        this.rear_wheel_weight = this.rear_rim_weight + this.rear_hub_weight + this.rear_spoke_weight;

        let build_type = this.parent.wb_front_rear_selection.get_wheel_build_type();
        if (build_type === "Wheelset") {
            this.parent.$total_weight_display.text('Front Wheel Weight:' + this.front_rim_weight +
                                                   'g    Rear Rim Weight:' + this.rear_rim_weight +
                                                   'g    Total Build Weight: ' + this.total_build_weight + 'g');
        } else {
            this.parent.$total_weight_display.text('Total Build Weight: ' + this.total_build_weight + 'g');
        }
    }

    format_inline_weight_display(weight){
        return (weight > 0) ? weight + " g" : "";
    }

    get_count(hole_count_label) {
        let $option = this.parent.option_aliases.all_options_on_page_aliased[hole_count_label];
        let value = this.parent.find_currently_selected_text_in_option($option);

        let hole_count = 0;
        if ((value != this.wb_config.zeroth_option_default_name) && (value != this.wb_config.zeroth_option_alternative_name)) {
            hole_count = parseInt(value.substring(0,2));
        }
       return hole_count
    }
}
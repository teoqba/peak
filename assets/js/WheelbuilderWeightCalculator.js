import WheelbuilderConfig from './WheelbuilderConfig.js';

export default class WheelbuilderWeightCalculator {
    constructor(parent) {
        this.wb_config = new WheelbuilderConfig();
        this.front_rim_weight = 0.0;
        this.rear_rim_weight = 0.0;
        this.front_hub_weight = 0.0;
        this.rear_hub_weight = 0.0;
        this.spoke_weight = 0.0;
        this.total_build_weight = 0.0;
        this.front_hole_count = 0.0;
        this.rear_hole_count = 0.0;
        this.nipple_weight = 0.0;

        this.front_wheel_weight = 0.0;
        this.rear_wheel_weight = 0.0;
        this.front_spoke_weight = 0.0;
        this.rear_spoke_weight = 0.0;
        this.front_nipple_weight = 0.0;
        this.rear_nipple_weight = 0.0;

        this.parent = parent;

        this.no_data_label = "n/a";
        this.fraction_digits = 2;  // how many digits to display for floating numbers
        this.reset_inline_display(0);
        this.init_weight_display_table();
    };

    init_weight_display_table() {
        this.weight_display_table = this.parent.$parent_page.find('#wb-weight-calc-table');
        this.front_rim_table_cell = this.parent.$parent_page.find('#wb-front-rim-weight');
        this.front_hub_table_cell = this.parent.$parent_page.find('#wb-front-hub-weight');
        this.front_spokes_table_cell = this.parent.$parent_page.find('#wb-front-spokes-weight');
        this.front_nipples_table_cell = this.parent.$parent_page.find('#wb-front-nipples-weight');
        this.front_wheel_table_cell = this.parent.$parent_page.find('#wb-front-wheel-weight');

        this.rear_rim_table_cell = this.parent.$parent_page.find('#wb-rear-rim-weight');
        this.rear_hub_table_cell = this.parent.$parent_page.find('#wb-rear-hub-weight');
        this.rear_spokes_table_cell = this.parent.$parent_page.find('#wb-rear-spokes-weight');
        this.rear_nipples_table_cell = this.parent.$parent_page.find('#wb-rear-nipples-weight');
        this.rear_wheel_table_cell = this.parent.$parent_page.find('#wb-rear-wheel-weight');

        this.total_weight_table_cell = this.parent.$parent_page.find('#wb-wheelset-weight');

        this.front_weight_table_row = this.parent.$parent_page.find('#wb-front-wheel-weight-row');
        this.rear_weight_table_row = this.parent.$parent_page.find('#wb-rear-wheel-weight-row');
        this.total_weight_table_row = this.parent.$parent_page.find('#wb-wheelset-weight-row');

        this.front_wheel_table_cell.text("-");
        this.rear_wheel_table_cell.text("-");
        this.total_weight_table_cell.text("-");
    }

    set_component_weight(component_name, weight) {
        if (weight !== this.no_data_label) {
            weight = parseFloat(weight);
        }

        if (component_name === 'front_rim') {
            this.front_rim_weight = weight;
            this.parent.$front_rim_weight_display.text(this.format_inline_weight_display(weight));
        } else if (component_name === 'rear_rim') {
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
            this.spoke_weight = (weight === this.no_data_label) ? this.no_data_label : (front_hole_count * weight) + (rear_hole_count * weight);
            this.front_spoke_weight =  (weight === this.no_data_label) ? this.no_data_label : (front_hole_count * weight);
            this.rear_spoke_weight = (weight === this.no_data_label) ? this.no_data_label : (rear_hole_count * weight);
            this.parent.$spoke_weight_display.text(this.format_inline_weight_display(this.spoke_weight));
        } else if (component_name === 'nipple') {
            let front_hole_count = this.get_count("Front_Hole_Count");
            let rear_hole_count = this.get_count("Rear_Hole_Count");
            this.nipple_weight = (weight === this.no_data_label) ? this.no_data_label : (front_hole_count * weight) + (rear_hole_count * weight);
            this.front_nipple_weight = (weight === this.no_data_label) ? this.no_data_label : (front_hole_count * weight);
            this.rear_nipple_weight = (weight === this.no_data_label) ? this.no_data_label : (rear_hole_count * weight);
            this.parent.$nipple_weight_display.text(this.format_inline_weight_display(this.nipple_weight));
        }
        this.update_table_display();
        this.calculate_totals();

    }

    format_inline_weight_display(weight){
        if (weight === this.no_data_label) return weight;

        // if weight is number, add unit or no display for 0
        return (weight > 0) ? this.format_fraction(weight) + " g" : "";
    }

    format_table_cell_weight_display(weight){
        if (weight === this.no_data_label) return weight;

        // if weight is number, add unit or no display for 0
        return (weight > 0) ? this.format_fraction(weight) : "-";
    }

    get_count(hole_count_label) {
        let $option = this.parent.option_aliases.all_options_on_page_aliased[hole_count_label];
        let value = this.parent.find_currently_selected_text_in_option($option);

        let hole_count = 0;
        if ((value !== this.wb_config.zeroth_option_default_name) && (value !== this.wb_config.zeroth_option_alternative_name)) {
            hole_count = parseInt(value.substring(0,2));
        }
        return hole_count;
    }

    calculate_totals() {
        if ((this.front_rim_weight === this.no_data_label) || (this.rear_rim_weight === this.no_data_label) ||
            (this.front_hub_weight === this.no_data_label) || (this.rear_hub_weight === this.no_data_label) ||
            (this.spoke_weight === this.no_data_label) || (this.nipple_weight === this.no_data_label)) {
            this.total_build_weight = this.no_data_label;
        } else {
            this.total_build_weight = this.front_rim_weight + this.rear_rim_weight
                + this.front_hub_weight + this.rear_hub_weight
                + this.spoke_weight + this.nipple_weight;
        }

        // Calculate front and rear wheel builds weight separately
        if ((this.front_rim_weight === this.no_data_label) || (this.front_hub_weight === this.no_data_label) ||
            (this.spoke_weight === this.no_data_label) || (this.front_nipple_weight === this.no_data_label)) {
            this.front_wheel_weight = this.no_data_label;
        } else {
            this.front_wheel_weight = this.front_rim_weight + this.front_hub_weight + this.front_spoke_weight +
                                      this.front_nipple_weight;
        }

        if ((this.rear_rim_weight === this.no_data_label) || (this.rear_hub_weight === this.no_data_label) ||
            (this.spoke_weight === this.no_data_label) || (this.rear_nipple_weight === this.no_data_label)) {
            this.rear_wheel_weight = this.no_data_label
        } else {
            this.rear_wheel_weight = this.rear_rim_weight + this.rear_hub_weight + this.rear_spoke_weight +
                                     this.rear_nipple_weight;
        }

        this.display_table_totals();

    }

    format_fraction(value) {
        if (value === this.no_data_label) {
            return value
        }

        return value.toFixed(this.fraction_digits);
    }

    update_table_display() {
        this.front_rim_table_cell.text(this.format_table_cell_weight_display(this.front_rim_weight));
        this.rear_rim_table_cell.text(this.format_table_cell_weight_display(this.rear_rim_weight));

        this.front_hub_table_cell.text(this.format_table_cell_weight_display(this.front_hub_weight));
        this.rear_hub_table_cell.text(this.format_table_cell_weight_display(this.rear_hub_weight));

        this.front_spokes_table_cell.text(this.format_table_cell_weight_display(this.front_spoke_weight));
        this.rear_spokes_table_cell.text(this.format_table_cell_weight_display(this.rear_spoke_weight));

        this.front_nipples_table_cell.text(this.format_table_cell_weight_display(this.front_nipple_weight));
        this.rear_nipples_table_cell.text(this.format_table_cell_weight_display(this.rear_nipple_weight));

    }

    switch_table_visibility_to(build_type) {
        if (build_type === "Wheelset") {
            this.front_weight_table_row.show();
            this.rear_weight_table_row.show();
            this.total_weight_table_row.show();
        } else if (build_type === "Front Wheel") {
            this.front_weight_table_row.show();
            this.rear_weight_table_row.hide();
            this.total_weight_table_row.hide();
        } else if (build_type === "Rear Wheel") {
            this.front_weight_table_row.hide();
            this.rear_weight_table_row.show();
            this.total_weight_table_row.hide();
        }
    }

    display_table_totals() {
        let build_type = this.parent.wb_front_rear_selection.get_wheel_build_type();

        if (build_type === "Wheelset") {
            this.switch_table_visibility_to(build_type);
            if ((this.front_rim_weight !== 0) && (this.rear_rim_weight !== 0) &&
                (this.front_hub_weight !== 0) && (this.rear_hub_weight !== 0) &&
                (this.front_spoke_weight !== 0) && (this.rear_spoke_weight !== 0) &&
                (this.front_nipple_weight !== 0) && (this.rear_nipple_weight !== 0)) {

                this.front_wheel_table_cell.text(this.format_table_cell_weight_display(this.front_wheel_weight));
                this.rear_wheel_table_cell.text(this.format_table_cell_weight_display(this.rear_wheel_weight));
                this.total_weight_table_cell.text(this.format_table_cell_weight_display(this.front_wheel_weight + this.rear_wheel_weight));

            } else {
                this.front_wheel_table_cell.text("-");
                this.rear_wheel_table_cell.text("-");
                this.total_weight_table_cell.text("-");
            }
        } else if (build_type === "Front Wheel") {
            this.switch_table_visibility_to(build_type);
            if ((this.front_rim_weight !== 0) &&
                (this.front_hub_weight !== 0) &&
                (this.front_spoke_weight !== 0) &&
                (this.front_nipple_weight !== 0)) {

                this.front_wheel_table_cell.text(this.format_table_cell_weight_display(this.front_wheel_weight));
            } else {
                this.front_wheel_table_cell.text("-");
            }
        } else if (build_type === "Rear Wheel") {
            this.switch_table_visibility_to(build_type);
            if ((this.rear_rim_weight !== 0) &&
                (this.rear_hub_weight !== 0) &&
                (this.rear_spoke_weight !== 0) &&
                (this.rear_nipple_weight !== 0)) {

                this.rear_wheel_table_cell.text(this.format_table_cell_weight_display(this.rear_wheel_weight));
            } else {
                this.rear_wheel_table_cell.text("-");
            }
        }
    }

    reset_inline_display(weight) {
        this.parent.$front_rim_weight_display.text(this.format_inline_weight_display(weight));
        this.parent.$rear_rim_weight_display.text(this.format_inline_weight_display(weight));
        this.parent.$front_hub_weight_display.text(this.format_inline_weight_display(weight));
        this.parent.$rear_hub_weight_display.text(this.format_inline_weight_display(weight));
        this.parent.$spoke_weight_display.text(this.format_inline_weight_display(weight));
        this.parent.$nipple_weight_display.text(this.format_inline_weight_display(weight));
    }

}
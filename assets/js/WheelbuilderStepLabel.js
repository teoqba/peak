import WheelbuilderConfig from './WheelbuilderConfig.js';

export default class WheelbuilderStepLabel {
    constructor($parent_page) {
        this.$parent_page = $parent_page;
        this.wb_config = new WheelbuilderConfig();

        this.$step_label = null;

        this.step_one_name = this.wb_config.step_one_name;
        this.step_two_name = this.wb_config.step_two_name;

    }

    init() {
        this.$step_label = this.$parent_page.find('.wb-step-label');
        this.set_to_step_one();

    }

    set_to_step_one() {
        this.$step_label.text(this.step_one_name);
    }

    set_to_step_two(){
        this.$step_label.text(this.step_two_name);
    }
    hide() {
        this.$step_label.hide();

    }
    show() {
        this.$step_label.show();
    }
}
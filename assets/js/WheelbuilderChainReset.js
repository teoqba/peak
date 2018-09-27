import WheelbuilderConfig from './WheelbuilderConfig.js';

export default class WheelbuilderChainReset {
    constructor(parent) {
        this.parent = parent;
        this.wb_config = new WheelbuilderConfig();
        this.stage_one_options_on_page = this.parent.stage_one_options_on_page;
    }

    chained_reset(option_name) {
        if (this.wb_config.chained_reset_options.indexOf(option_name) > -1) {

        }
    }
}
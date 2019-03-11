import WheelbuilderConfig from './WheelbuilderConfig.js';

export default class WheelbuilderRimSizeChangeLogic {
    // When first different sized rims are chosen (29er and 27.5) and that WheelSize,
    // need_to_rerun query resetts query for the incompatybile rim and forced query to be rerun again
    constructor(parent) {
        this.parent = parent;
        this.ajax_request = parent.ajax_post;
        this.wb_config = new WheelbuilderConfig();

        this.$step_label = null;

        this.step_one_name = this.wb_config.step_one_name;
        this.step_two_name = this.wb_config.step_two_name;
        this.option_prefix = ['Front', 'Rear']

    }

    need_to_rerun_rim_query(query_result) {
        let result = false;

        for (let i=0; i < this.option_prefix.length; i++) {
            let prefix = this.option_prefix[i];
            let rim_option_name = prefix + '_Rim_Model';
            let hole_option_name = prefix + '_Hole_Count';
            let no_of_available_rims = query_result[rim_option_name].length;
            if (no_of_available_rims === 0) {
                this.parent.rim_query.remove(rim_option_name);
                this.parent.rim_query.remove(hole_option_name);
                result = true;
            }
        }
        return result;
    }
}

import WheelbuilderConfig from './WheelbuilderConfig.js';

export default class WheelbuilderHubSpokeConnector {
    constructor() {
        this.wb_config = new WheelbuilderConfig();

        this.last_front_hub_style = null;
        this.last_rear_hub_style = null;
        this.last_spoke_style = null;
    }

    front_hub_style_changed(query_result) {
        let new_hub_style = query_result['Front_Hub_Style'];
        if (this.last_front_hub_style === null) {
            if (JSON.stringify(new_hub_style) !== JSON.stringify(this.last_front_hub_style)) {
                return true;
            }
        }
        return false;
    }

    set_front_hub_style(new_hub_style) {
        this.last_front_hub_style = new_hub_style;
        this.last_spoke_style = this.last_front_hub_style;
    }

    rear_hub_style_changed(query_result) {
        let new_hub_style = query_result['Front_Hub_Style'];
        if (this.rear_hub_style_changed === null) {
            if (JSON.stringify(new_hub_style) !== JSON.stringify(this.last_rear_hub_style)) {
                return true;
            }
        }
        return false;
    }

    set_rear_hub_style(new_hub_style) {
        this.last_rear_hub_style = new_hub_style;
        this.last_spoke_style = this.last_rear_hub_style;
    }

    spoke_style_changed(query_result) {
        let new_spoke_style = query_result['Spokes_Style'];
        if (JSON.stringify(new_spoke_style) !== JSON.stringify(this.last_spoke_style)) {
            return true;
        }
        return false;
    }

    set_spoke_style(new_spoke_style) {
        this.last_spoke_style = new_spoke_style;
        this.last_front_hub_style = new_spoke_style;
        this.last_rear_hub_style = new_spoke_style;
    }

    is_straight_pull(spoke_style) {
        if (spoke_style === null) {
            return false;
        }

        if(spoke_style.length === 1) {
            if (spoke_style[0] === 'Straight Pull') {
                return true;
            }
        }
        return false;
    }

    reset() {
        this.last_front_hub_style = null;
        this.last_rear_hub_style = null;
        this.last_spoke_style = null;
    }

}

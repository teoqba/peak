export default class WheelbuilderHubSpokeConnector {
    constructor() {
        this.last_hub_style = null;
        this.last_front_hub_style = null;
        this.last_rear_hub_style = null;
        this.last_spoke_style = null;
    }


    // hub_style_changed(query_result) {
    //     let new_hub_style = query_result['Hub_Style'];
    //     console.log('Got hub style', new_hub_style);
    //     if (JSON.stringify(new_hub_style) !== JSON.stringify(this.last_hub_style)) {
    //         this.last_hub_style = new_hub_style;
    //         return true;
    //     }
    //     return false;
    // }

    front_hub_style_changed(query_result) {
        let new_hub_style = query_result['Front_Hub_Style'];
        console.log('Got hub front style', new_hub_style);
        if (JSON.stringify(new_hub_style) !== JSON.stringify(this.last_front_hub_style)) {
            this.last_front_hub_style = new_hub_style;
            if (this.is_straight_pull(this.last_rear_hub_style)) {
                this.last_spoke_style = this.last_rear_hub_style;
            } else {
                this.last_spoke_style = this.last_front_hub_style;
            }
            return true;
        }
        return false;
    }

    rear_hub_style_changed(query_result) {
        let new_hub_style = query_result['Front_Hub_Style'];
        console.log('Got hub rear style', new_hub_style);
        if (JSON.stringify(new_hub_style) !== JSON.stringify(this.last_rear_hub_style)) {
            this.last_rear_hub_style = new_hub_style;
            if (this.is_straight_pull(this.last_front_hub_style)) {
                this.last_spoke_style = this.last_front_hub_style;
            } else {
                this.last_spoke_style = this.last_rear_hub_style;
            }
            return true;
        }
        return false;
    }


    spoke_style_changed(query_result) {
        let new_spoke_style = query_result['Spokes_Style'];
        console.log('Got hub spoke style', new_spoke_style);
        if (JSON.stringify(new_spoke_style) !== JSON.stringify(this.last_spoke_style)) {
            this.last_spoke_style = new_spoke_style;
            this.last_front_hub_style = new_spoke_style;
            this.last_rear_hub_style = new_spoke_style;
            return true;
        }
        return false;
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
}

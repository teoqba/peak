
export default class WheelbuilderWeightCalculator {
    constructor(parent) {
        this.front_rim_weight = 0;
        this.rear_rim_weight = 0;
        this.front_hub_weight = 0;
        this.rear_hub_weight = 0;
        this.total_build_weight = 0;
        this.parent = parent
    }

    set_component_weight(component_name, weight) {

        weight = parseInt(weight);
        if (component_name === 'front_rim') {
            this.front_rim_weight = weight;
        } else if (component_name == 'rear_rim') {
            this.rear_rim_weight = weight;
        } else if (component_name === 'front_hub') {
            this.front_rim_weight = weight;
        } else if (component_name === 'rear_hub') {
            this.rear_hub_weight = weight;
        }
    this.total_build_weight = this.front_rim_weight + this.rear_rim_weight
                            + this.front_hub_weight + this.rear_hub_weight;
    this.parent.$total_weight_display.text('Total Build Weight: ' + this.total_build_weight+'g');
    }


}
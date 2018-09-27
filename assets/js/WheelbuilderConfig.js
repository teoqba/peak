export default class WheelbuilderConfig {
    constructor() {

        // Option names
        this.build_type_option_name = 'You_want_to_build:';

        this.zeroth_option_default_name = 'Pick one...';
        this.zeroth_option_alternative_name = 'Reset selection...';

        this.option_default_selection = {'Intended_Application': 'All'};

        // Step names:
        this.step_one_name = 'Step 1: Select Rim';
        this.step_two_name = 'Step 2: Select Hub';

        // Front Rear Selection
        this.front_wheel_options = ['Front_Disc_Brake_Interface', 'Front_Axle_Type',
            'Front_Hub', 'Front_Hub_Color'];

        this.rear_wheel_options = ['Rear_Disc_Brake_Interface', 'Rear_Axle_Type',
            'Rear_Hub', 'Rear_Hub_Color', 'Points_of_Engagement',
            'Drivetrain_Type'];

        this.front_wheel_options_stage_one = ['Front_Hole_Count', 'Front_Rim_Choice', 'Front_Rim_Model'];
        this.rear_wheel_options_stage_one =['Rear_Hole_Count', 'Rear_Rim_Choice', 'Rear_Rim_Model'];

        // List of options for which subset of the values will be included in query
        this.find_initial_subset_of_rim_options = ['Front_Rim_Model', 'Rear_Rim_Model', 'Front_Rim_Choice', 'Rear_Rim_Choice'];
        this.find_initial_subset_of_hub_options = [];


        // special attributes that will be optionally shown
        this.poe_option_name = 'Points_of_Engagement';
        this.front_bearing_upgrade = 'Front_Hub_Ceramic_Bearing_Upgrade';
        this.rear_bearing_upgrade = 'Rear_Hub_Ceramic_Bearing_Upgrade';

        this.special_options = [this.poe_option_name, this.rear_bearing_upgrade, this.front_bearing_upgrade];

        // Spokes options
        this.spokes_default_style = ["J-Bend", "Straight Pull"];

    }
}

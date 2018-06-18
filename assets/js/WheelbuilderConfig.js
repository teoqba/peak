export default class WheelbuilderConfig {
    constructor() {

        // Option names
        this.build_type_option_name = 'You_want_to_build:';

        this.zeroth_option_default_name = 'Pick one...';
        this.zeroth_option_alternative_name = 'Reset selection...';

        // Step names:
        this.step_one_name = 'Step 1: Select Rim';
        this.step_two_name = 'Step 2: Select Hub';

        // Front Rear Selection
        this.front_wheel_options = ['Front_Disc_Brake_Interface', 'Front_Axle_Type',
            'Front_Hub', 'Front_Hub_Color'];

        this.rear_wheel_options = ['Rear_Disc_Brake_Interface', 'Rear_Axle_Type',
            'Rear_Hub', 'Rear_Hub_Color', 'Points_of_Engagement',
            'Drivetrain_Type'];

    }
}

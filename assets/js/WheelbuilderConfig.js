export default class WheelbuilderConfig {
    constructor() {
        this.build_type_option_name = 'You_want_to_build:';

        this.front_wheel_options = ['Front_Disc_Brake_Interface', 'Front_Axle_Type',
            'Front_Hub', 'Front_Hub_Color'];

        this.rear_wheel_options = ['Rear_Disc_Brake_Interface', 'Rear_Axle_Type',
            'Rear_Hub', 'Rear_Hub_Color', 'Points_of_Engagement',
            'Drivetrain_Type'];

        this.front_wheel_stage_2_options = ['Front_Disc_Brake_Interface', 'Front_Axle_Type'];

        this.rear_wheel_stage_2_options = ['Rear_Disc_Brake_Interface', 'Rear_Axle_Type'];

        this.front_wheel_stage_3_options = ['Front_Hub', 'Front_Hub_Color'];

        this.rear_wheel_stage_3_options = ['Rear_Hub', 'Rear_Hub_Color', 'Points_of_Engagement',
            'Drivetrain_Type'];

    }
}

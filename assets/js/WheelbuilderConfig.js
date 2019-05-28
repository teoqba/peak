export default class WheelbuilderConfig {
    constructor() {
        // If true use test database
        this.use_sandbox_db = true; // remember  to also swap stencil file when toggling this variable
        // if true shows query and query result
        this.debug_query = false;
        this.enable_query_timings = false;

        // hardcode common_option_roots TODO: to be removed later when other is fixed
        this.hardcoded_common_option_roots = ['Front_Hole_Count', 'Rear_Hole_Count'];

        // Adresses of backend
        // this.database_address = "http://52.53.51.220";
        // this.database_port = 8080;

        this.database_address = "https://filters.wheelbuilderfilters.com";
        this.database_port = 443;

        // this.database_address = "http://WeightTest-env.pw9bzyjumt.us-west-1.elasticbeanstalk.com";
        // this.database_port = 80;

        // set urls depending if we use test environment or not. For "query" this.usesandbox is included in message body (query)
        if (this.use_sandbox_db) {
            this.database_urls = {
                "option_names_roots": this.database_address + ":" + this.database_port + "/options_names_roots?testdb=True",
                "query": this.database_address + ":" + this.database_port + "/wbdb_query",
                "tooltips":  this.database_address + ":" + this.database_port + "/tooltips",
                "weight": this.database_address + ":" + this.database_port + "/get_weight"
            };
        } else {
            this.database_urls = {
                "option_names_roots": this.database_address + ":" + this.database_port + "/options_names_roots",
                "query": this.database_address + ":" + this.database_port + "/wbdb_query",
                "tooltips": this.database_address + ":" + this.database_port + "/tooltips",
                "weight": this.database_address + ":" + this.database_port + "/get_weight"
            };
        }

        // Option names
        this.build_type_option_name = 'I_want_to_build:';

        this.zeroth_option_default_name = 'Pick one...';
        this.zeroth_option_alternative_name = 'Reset selection...';

        this.option_default_selection = {'Intended_Application': 'All', 'Rim_Brand': 'All', 'Rim_Material': 'All'};

        // Filtering control
        this.minumum_no_of_options_for_filtering = 8;

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

        this.front_rear_common_options = ['Intended_Application', 'Rim_Brand', 'Rim_Material'];

        // List of options for which subset of the values will be included in query
        this.find_initial_subset_of_rim_options = ['Front_Rim_Model', 'Rear_Rim_Model', 'Front_Rim_Choice', 'Rear_Rim_Choice'];
        this.find_initial_subset_of_hub_options = [];


        // special attributes that will be optionally shown
        this.poe_option_name = 'Points_of_Engagement';
        this.front_bearing_upgrade = 'Front_Hub_Bearings';
        this.rear_bearing_upgrade = 'Rear_Hub_Bearings';
        this.front_rim_decal_color = 'Front_Rim_Decal';
        this.rear_rim_decal_color = 'Rear_Rim_Decal';

        this.special_options = [this.poe_option_name, this.rear_bearing_upgrade, this.front_bearing_upgrade,
                                this.front_rim_decal_color, this.rear_rim_decal_color];

        // Spokes options
        this.spokes_default_style = ["J-Bend", "Straight Pull"];

        // Reset buttons
        this.option_reset_button_prefix = 'wb-reset-button-';

        // Tooltips
        this.option_tooltip_bubble_prefix = 'wb-tooltip-';
        this.option_tooltip_icon_prefix = 'wb-tooltip-icon-';

        // Swatch options
        this.swatch_options = [this.front_rim_decal_color, this.rear_rim_decal_color];
    }
}

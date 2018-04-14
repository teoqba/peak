// https://stackoverflow.com/questions/4371565/can-you-create-javascript-regexes-on-the-fly-using-string-variables

export default class WheelbuilderOptionAliases {
    constructor(all_options_on_page) {
        this.all_options_on_page = all_options_on_page;
        //TODO: This should come from database. There should be application that would validate it
        this.option_name_roots = ['Rim_Size', 'Hole_Count', 'Rim_Choice', 'Rim_Material',
            'Disc_Brake_Type', 'Front_Axle_Type', 'Rear_Axle_Type', 'Front_Hub', 'Front_Hub_Color',
            'Rear_Hub', 'Rear_Hub_Color', 'Drivetrain_Type', 'Points_of_Engagement', 'Spoke_Type',
            'Spoke_Color', 'Ceramic_Bearing_Option', 'Decals'];

        this.option_map = this.map_option_names();
    }


    map_option_names() {
        let options_map = {};
        for (let option_name in this.all_options_on_page) {
            console.log('Option name', option_name);
            // Check if option_name in the keys:
            if (this.option_name_roots.indexOf(option_name) > -1) {
                options_map[option_name] = option_name;
            } else {
                for (let i=0; i<this.option_name_roots.length; i++ ) {
                    let root = this.option_name_roots[i];
                    let reg_exp = new RegExp(root, "i");
                    let test = reg_exp.test(option_name);
                    if (test) {
                        options_map[option_name] = root;
                    }

                }
            }
        }
        return options_map;
    }
}

// examples() {
//     let root = "Rim_Choice";
//     let name = "Enve_Rim_Choice";
//
//     let reg = new RegExp(root, 'i'); // i for case insensiteive
//
//     let v_test = reg.test(name);
//     console.log(v_test);
//
//     let v_match = name.match(reg);
//     console.log(v_match);
//     //[ 'rim_choice', index: 5, input: 'enve_rim_choice' ]
//
//     console.log(name.indexOf(root));
// }

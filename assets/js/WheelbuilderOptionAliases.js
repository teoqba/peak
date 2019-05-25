// https://stackoverflow.com/questions/4371565/can-you-create-javascript-regexes-on-the-fly-using-string-variables

export default class WheelbuilderOptionAliases {
    constructor(all_options_on_page, option_name_roots) {
        this.all_options_on_page = all_options_on_page;
        //TODO: This should come from database. There should be application that would validate it

        this.option_name_roots = option_name_roots;

        this.option_alias = {}; //  {"known_option_name":"changed_option_name" }
        this.alias_to_real_name = {};  //{"changed_option_name":"real_option_name" }
        this.all_options_on_page_aliased = {}; // same format as all_options_on_page: {"old_option_name": option_object}

        // FORMAT:
        // new option_name (alias): recognized_option_name
        //
        this.renamed_options = {
            'Front_Disc_Type': 'Front_Disc_Brake_Interface',
            'Rear_Disc_Type': 'Rear_Disc_Brake_Interface',
            'Front_Spoke_Count': 'Front_Hole_Count',
            'Rear_Spoke_Count': 'Rear_Hole_Count',
            'Wheel_Size': 'Rim_Size',
            'Brand': 'Rim_Brand',
            'Material': 'Rim_Material'
        };

        this.find_option_aliases_v2();
    }

    find_option_aliases() {
        // this version uses regexp to find aliases of the options *known_option_name*
        // generates two Objects:
        // -> this.option_alias
        // -> this.all_options_on_page_aliased
        for (let option_name in this.all_options_on_page) {
            // Check if option_name in the keys:
            if (this.option_name_roots.indexOf(option_name) > -1) {
                this.option_alias[option_name] = option_name;
                this.alias_to_real_name[option_name] = option_name;
                this.all_options_on_page_aliased[option_name] = this.all_options_on_page[option_name];

            } else {
                for (let i=0; i<this.option_name_roots.length; i++ ) {
                    let root = this.option_name_roots[i];
                    let reg_exp = new RegExp(root, "i");
                    let test = reg_exp.test(option_name);
                    if (test) {
                        this.option_alias[option_name] = root;
                        this.alias_to_real_name[root] = option_name;
                        this.all_options_on_page_aliased[root] = this.all_options_on_page[option_name];
                    }
                }
            }
        }
    }

    find_option_aliases_v2() {
        // this version uses renamed_options object map renamed options in OptionSets to known option names used in filtering
        // generates two Objects:
        // -> this.option_alias
        // -> this.all_options_on_page_aliased
        for (let option_name in this.all_options_on_page) {
            // Check if option_name in the keys:
            if (this.renamed_options.hasOwnProperty(option_name)) {
                let real_name = this.renamed_options[option_name];
                if (this.option_name_roots.indexOf(real_name) > -1) {
                    this.option_alias[option_name] = real_name;
                    this.alias_to_real_name[real_name] = option_name;
                    this.all_options_on_page_aliased[real_name] = this.all_options_on_page[option_name];
                }

            } else {
                if (this.option_name_roots.indexOf(option_name) > -1) {
                    this.option_alias[option_name] = option_name;
                    this.alias_to_real_name[option_name] = option_name;
                    this.all_options_on_page_aliased[option_name] = this.all_options_on_page[option_name];
                }
            } // include Nipple type too, required to set Nipple_Type in  WeightCalculatorQuery
            if (option_name === "Nipple_Type") {
                this.option_alias[option_name] = option_name;
                this.alias_to_real_name[option_name] = option_name;
                this.all_options_on_page_aliased[option_name] = this.all_options_on_page[option_name];
            }
        }
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

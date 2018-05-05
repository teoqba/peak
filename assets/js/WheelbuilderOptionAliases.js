// https://stackoverflow.com/questions/4371565/can-you-create-javascript-regexes-on-the-fly-using-string-variables

export default class WheelbuilderOptionAliases {
    constructor(all_options_on_page, option_name_roots) {
        this.all_options_on_page = all_options_on_page;
        //TODO: This should come from database. There should be application that would validate it

        this.option_name_roots = option_name_roots;

        this.option_alias = {}; //  {"old_option_name":"new_option_name" }
        this.revert_alias_to_original = {};  //{"new_option_name":"old_option_name" }
        this.all_options_on_page_aliased = {}; // same format as all_options_on_page: {"new_option_name": option_object}
        this.find_option_aliases();
    }

    find_option_aliases() {
        // generates two Objects:
        // -> this.option_alias
        // -> this.all_options_on_page_aliased
        for (let option_name in this.all_options_on_page) {
            // Check if option_name in the keys:
            if (this.option_name_roots.indexOf(option_name) > -1) {
                this.option_alias[option_name] = option_name;
                this.revert_alias_to_original[option_name] = option_name;
                this.all_options_on_page_aliased[option_name] = this.all_options_on_page[option_name];

            } else {
                for (let i=0; i<this.option_name_roots.length; i++ ) {
                    let root = this.option_name_roots[i];
                    let reg_exp = new RegExp(root, "i");
                    let test = reg_exp.test(option_name);
                    if (test) {
                        this.option_alias[option_name] = root;
                        this.revert_alias_to_original[root] = option_name;
                        this.all_options_on_page_aliased[root] = this.all_options_on_page[option_name];
                    }
                }
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

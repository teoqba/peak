import WheelbuilderQuery from './WheelbuilderQuery';
import WheelbuilderOptionAliases from './WheelbuilderOptionAliases';


export default class WheelbuilderFilters {
    constructor($parent_page) {
        console.log('WB init');

        this.$parent_page = $parent_page;
        this.all_options_on_page = this.get_all_options_on_page();

        // These needs to be unique between the two
        // this.all_known_rim_options = ['Hole_Count', 'Rims', 'Material', 'Style', 'Rim_Compatibility', 'Dimensions'];
        // These are the _root_ option names
        this.all_known_rim_options = ['Hole_Count', 'Rim_Size', 'Rim_Style', 'Dimensions',
                                      'Rim_Material', 'Rim_Compatibility', 'Rim_Choice'];
        // this.all_known_hub_options = ['Hubs', 'Hole_Count', 'Color', 'Type', 'Compatibility', 'Axle', 'Brake_Type'];
        // this needs to reflect FRONT/REAR HUB, add Optional "Points_of_Engegement"
        this.all_known_hub_options = ['Hole_Count', 'Axle_Type', 'Disc_Brake_Type', 'Drivetrain_Type', 'Hub_Color',
                                      'Hub_Style', 'Hub_Type', 'Hubs'];

        this.all_known_options = this.all_known_rim_options.concat(this.all_known_hub_options);
        this.query_api_url = {"initial": "http://localhost:8000/wbdb_query_initial",
                              "single_query": "http://localhost:8000/wbdb_query_single",
                              "double_query": "http://localhost:8000/wbdb_query_double"};
        // this.query_api_url2 = "http://localhost:8000/wbdb_query2";
        this.option_aliases = new WheelbuilderOptionAliases(this.all_options_on_page);
        console.log('Option map', this.option_aliases.all_options_on_page_aliased);
        // for query common fields will be initialized in initial_filter_parser
        this.query = new WheelbuilderQuery(this.all_known_rim_options, this.all_known_hub_options);
        this.rim_hub_common_options = this.query.rim_hub_common_defaults;
        this.initial_filer_done = false;
        this.initial_filter();
    }

    filter_options($changedOption) {
        // Main call. This is called from ProductUtils page.
        if (this.initial_filer_done) this.prepare_query($changedOption);
    }

    get_all_options_on_page() {
        // Find all the options on currently loaded product page. Currently it only looks at the options from set-select.html
        // returns JSON with {option_name: option_object}
        let all_options = {};
        let $all_set_select_options = this.$parent_page.find('.form-field-select');
        $all_set_select_options.each(function () {
            // find name of option
            let option_name = $(this).find('.wb-option-display-name').text();
            option_name = option_name.split(' ').join('_');
            all_options[option_name] = $(this);
        });
        return all_options;
    }

    get_name_of_changed_option($changedOption) {
        // let $from = $changedOption.parents('form');
        let $form = $changedOption.parents('.form-field-options');
        let name = $form.find('.wb-option-display-name').text();
        return name.split(' ').join('_');

    }

    get_type_of_changed_option(option_name) {
        if (this.rim_hub_common_options.hasOwnProperty(option_name)) {
            return 'common';
        }

        // console.log('Got option name', option_name, this.all_known_hub_options.indexOf(option_name));

        if (this.all_known_hub_options.indexOf(option_name) > -1 ) {
            return 'Hubs';
        } else if (this.all_known_rim_options.indexOf(option_name) > -1) {
            return 'Rims';
        } else {
            console.log('Unknown option_type', option_name);
            return null;
        }
    }

    initial_filter() {
        // Used at class initialization.
        // Search through options, and if there is a *-rim option, filter every other option according to rim selection
        let initial_query = new WheelbuilderQuery(this.all_known_rim_options, this.all_known_hub_options);
        let option_values_array = [];
        for (let option_name in this.all_options_on_page) {
            let option_name_alias = this.option_aliases.option_alias[option_name];
            console.log('Got option RIM alias', initial_query.is_option_rim(option_name_alias));
            if (initial_query.is_option_rim(option_name_alias)) {
                // let $option_object = $(this.all_options_on_page[option_name]);
                let $option_object = $(this.option_aliases.all_options_on_page_aliased[option_name_alias]);
                let $option_values_object = $option_object.find('.wb-option');
                $option_values_object.each(function(){
                   let option_value = $(this).text()
                   option_values_array.push(option_value);
                });
                initial_query.set(option_name_alias, option_values_array);
                initial_query.set('inventory_type', 'Rims');
                initial_query.log("INITIAL QUERY");
            }
        }
        if (option_values_array.length !== 0) {
            console.log("INITIAL QUERY NOT EMPTY MAKING AJAX CALL");
            this.ajax_call(initial_query.get_query(), this.query_api_url.initial, this.initial_filter_parser);
        }

    }

    initial_filter_parser(query_result, parent) {
        if (JSON.stringify(query_result) !== JSON.stringify({})) {
            for (let key in parent.query.rim_hub_common_defaults) {
                if (query_result.hasOwnProperty(key)) {
                    let values = query_result[key];
                    parent.query.set_common_options_defaults(key, values);
                }
            }
        }
        console.log('Query common defaults', parent.query.rim_hub_common_defaults);
        // set common fields in query
        parent.query.revert_common_attributes_values_to_defaults();
        parent.initial_filer_done = true;
        parent.ajax_call(parent.query.get_query(), parent.query_api_url.double_query, parent.result_parser);
    }

    ajax_call(query, url, parser) {
        let _this = this;
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                console.log('Response', this.responseText);
                let result =  JSON.parse(this.responseText);
                console.log('AJax result', result);
                parser(result, _this);

            }
        };
        xhttp.open("POST", url, true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send(JSON.stringify(query));
    }

    prepare_query($changed_option) {
        let option_name = this.get_name_of_changed_option($changed_option);
        let option_name_alias = this.option_aliases.option_alias[option_name];
        let option_type = this.get_type_of_changed_option(option_name_alias);
        let $option_object = $(this.option_aliases.all_options_on_page_aliased[option_name_alias]);
        const $option_values_object = $option_object.find('.form-select');
        const $selected_item = $option_values_object.find(':selected');
        let selected_index = $selected_item.index();
        let value = $selected_item.text();
        if (selected_index > 0 ) {
            this.query.set(option_name_alias, value);
        } else {
            this.query.remove(option_name_alias);
        }
        if (this.get_type_of_changed_option(option_name_alias) === 'common'){
            this.query.log("QUERY READY TO BE SEND FOR OPTION COMMON");
            this.query.remove('inventory_type');
            this.ajax_call(this.query.get_query(), this.query_api_url.single_query, this.result_parser);
        } else {
            this.query.set('inventory_type', option_type);
            this.query.log("QUERY READY TO BE SEND");
            this.ajax_call(this.query.get_query(), this.query_api_url.double_query, this.result_parser);
        }
    }

    autoselect(option, query_result) {
        if (query_result.length === 1) {
            let data_label = 'data-wb-label="' + query_result[0]+'"';
            let one_option = $(option).find('.form-select option['+ data_label + ']');
            $(one_option).attr("selected", "selected");
            return true;
        }
        return false;
    }

    check_if_build_is_invalid(query_result) {
        for (let key in query_result) {
            try {
                if (query_result[key].length === 0) {
                    alert('Cannot finish the build. Selected options are not compatible: ' + key );
                    return
                }
            } catch(err) {}
        }
    }

    result_parser(query_result, parent) {
        parent.check_if_build_is_invalid(query_result);
        let all_known_options = parent.all_known_options; //aliases
        let all_options_on_page = parent.all_options_on_page;
        let all_options_on_page_aliased = parent.option_aliases.all_options_on_page_aliased;
        if (JSON.stringify(query_result) !== JSON.stringify({})) {
            for (let i = 0; i < all_known_options.length; i++) {
                let option_name_alias = all_known_options[i];

                //show hide options
                if (((all_options_on_page_aliased.hasOwnProperty(option_name_alias))) && (query_result.hasOwnProperty(option_name_alias))) {
                    let option = all_options_on_page_aliased[option_name_alias];
                    let $option_values_object = $(option).find('.wb-option');
                    let $empty_option = $(option).find('.wb-empty-option');
                    // $empty_option.hide();
                    $option_values_object.each(function () {
                        let result = query_result[option_name_alias];
                        let name = $(this).text();
                        if (name === 'Pick one ...') $(this).hide();
                        if (result.indexOf(name) < 0) {
                            $(this).hide();
                        } else {
                            $(this).show();
                        }
                    });
                    // if only one option is available, autoselect it
                    parent.autoselect(option, query_result[option_name_alias])
                }
            }
        }
    }
}



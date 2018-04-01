
export default class WheelbuilderFilters {
    constructor($parent_page) {
        console.log('WB init');
        this.$parent_page = $parent_page;
        this.all_options_on_page = this.get_all_options_on_page();
        this.all_known_rim_options = ['Hole_Count', 'Rims', 'Material', 'Style', 'Rim_Compatibility', 'Dimensions'];
        this.all_known_hub_options = ['Hubs', 'Hole_Count', 'Color', 'Type', 'Compatibility', 'Axle'];
        this.all_known_options = this.all_known_rim_options.concat(this.all_known_hub_options);
        this.rim_hub_common_options = {'Hole_Count': []};
        this.query_api_url = "http://localhost:8000/wbdb_query"
        this.initial_filtering_options = ['Hole_Count']; //should be here also style: rim or disc brake
        this.initial_filter();
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

    initialize_filters() {
        // this.prepare_query();
    }

    common_options_to_query() {
        let query = {};
        for (let key in this.rim_hub_common_options) {
            let values = this.rim_hub_common_options[key];
            query[key] = {'$in': values};
        }
        return query;
    }

    set_defaults_if_option_not_selected(option_name) {
        if (option_name === 'Hole_Count') {
            return {'$in': this.allowed_hole_counts};
        } else {
            return null;
        }

    }

    initial_filter() {
        // Used at class initialization.
        // Search through options, and if there is a *-rim option, filter every other option according to rim selection
        let query = {};
        let option_values_array = [];
        for (let option_name in this.all_options_on_page) {
            if (this.option_is_rim(option_name)) {
                let $option_object = $(this.all_options_on_page[option_name]);
                let $option_values_object = $option_object.find('.wb-option');
                $option_values_object.each(function(){
                   let option_value = $(this).text()
                   option_values_array.push(option_value);
                });
                query['Rims'] = {'$in': option_values_array};
                query['attributes'] = this.all_known_rim_options;
            }
        }
        if (option_values_array.length !== 0) {
            console.log("INITIAL QUERY NOT EMPTY MAKING AJAX CALL")
            this.ajax_call(query, this.query_api_url, this.initial_filter_parser);
        }

    }

    option_is_rim(option_name) {
        // check if option has  {prefix}-rim* extension
        let extension = /Rims/g; //matches {prefix}-rim* expression
        let test = option_name.match(extension);
        return (test) ? (true) : (false);
    }

    option_belongs_to_rim(option_name) {
        // Check if option is in rim-options group, if not, check if its {prefix}-rim* extension
        // TODO: This will find Hole_Count and assign it to Rim Options. Is this correct?
        if (this.all_known_rim_options.indexOf(option_name) > 0) return true
        return this.option_is_rim(option_name)
        // TODO the dash might be a problem when we will just use Rims as option name
    }

    // prepare_query() {
    //     let query = {};
    //     let make_query = false; // in no option is selected, dont make query
    //     query['Hubs'] = {};
    //     query['Rims'] = {};
    //
    //     // iterate over all the options and find selected value of each option
    //     for (let option_name in this.all_options_on_page) {
    //         let $option_object = $(this.all_options_on_page[option_name]);
    //         // Find if option is Rim name in format -rim*
    //         let query_selector = 'Hubs';
    //         if (this.option_belongs_to_rim(option_name)) query_selector = 'Rims';
    //         // find value of that option
    //         const $option_values_object = $option_object.find('.form-select');
    //         const $selected_item = $option_values_object.find(':selected');
    //         let selected_index = $selected_item.index();
    //         if (selected_index > 0 ) { //skip 1st option which is "Pick one.." or something
    //             make_query = true;
    //             let selected_option_value = $selected_item.text();
    //             query[query_selector][option_name] = selected_option_value;
    //         }
    //         else {
    //             if (this.set_defaults_if_option_not_selected(option_name) !== null) {
    //                 console.log('Option name doing this', option_name);
    //                 query[query_selector][option_name] = this.set_defaults_if_option_not_selected(option_name);
    //             }
    //         }
    //     }
    //
    //     query['hubs_attributes'] = this.all_known_hub_options;
    //     query['rims_attributes'] = this.all_known_rim_options;
    //     console.log("Query before ajax", query);
    //     if (make_query) {
    //         console.log('Output', query);
    //         this.ajax_call(query, this.query_api_url, false);
    //     }
    //
    // }

    // result_parser(query_result, parent) {
    //     let attributes_list = parent.all_known_options;
    //     let options_list = parent.all_options_on_page;
    //     if (JSON.stringify(query_result) !== JSON.stringify({})) {
    //         for (let i = 0; i < attributes_list.length; i++) {
    //             let attribute = attributes_list[i];
    //             if (((options_list.hasOwnProperty(attribute))) && (query_result.hasOwnProperty(attribute))) {
    //                 let option = options_list[attribute];
    //                 let $option_values_object = $(option).find('.wb-option');
    //                 $option_values_object.each(function () {
    //                     let result = query_result[attribute];
    //                     let name = $(this).text();
    //                     if (result.indexOf(name) < 0) {
    //                         $(this).hide();
    //                     } else {
    //                         $(this).show();
    //                     }
    //                 });
    //             }
    //         }
    //     }
    // }

    result_parser(query_result, parent) {
        let attributes_list = parent.all_known_options;
        let options_list = parent.all_options_on_page;
        if (JSON.stringify(query_result) !== JSON.stringify({})) {
            for (let i = 0; i < attributes_list.length; i++) {
                let attribute = attributes_list[i];
                if (((options_list.hasOwnProperty(attribute))) && (query_result.hasOwnProperty(attribute))) {
                    let option = options_list[attribute];
                    let $option_values_object = $(option).find('.wb-option');
                    $option_values_object.each(function () {
                        let result = query_result[attribute];
                        let name = $(this).text();
                        if (result.indexOf(name) < 0) {
                            $(this).hide();
                        } else {
                            $(this).show();
                        }
                    });
                }
            }
        }
    }


    initial_filter_parser(query_result, parent) {
        let rim_hub_common_options = parent.rim_hub_common_options;
        if (JSON.stringify(query_result) !== JSON.stringify({})) {
            for (let key in rim_hub_common_options) {
                if (query_result.hasOwnProperty(key)) {
                    let values = query_result[key];
                    rim_hub_common_options[key] = values;
                }
            }
            console.log('Common Fields', parent.rim_hub_common_options);
        }
        let query = parent.common_options_to_query();
        query['attributes'] = parent.all_known_options;
        parent.ajax_call(query, parent.query_api_url, parent.result_parser);
    }


    ajax_call(query, url, parser) {
        let _this = this;
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                console.log('Response', this.responseText);
                let result =  JSON.parse(this.responseText);
                console.log('AJax result', result);
                // _this.result_parser(result, _this.all_known_options, _this.all_options_on_page);
                parser(result, _this);

            }
        };
        xhttp.open("POST", url, true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send(JSON.stringify(query));
    }
}



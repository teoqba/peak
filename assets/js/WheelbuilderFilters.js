import WheelbuilderQuery from './WheelbuilderQuery';

export default class WheelbuilderFilters {
    constructor($parent_page) {
        console.log('WB init');

        this.$parent_page = $parent_page;
        this.all_options_on_page = this.get_all_options_on_page();
        // These needs to be unique between the two
        this.all_known_rim_options = ['Hole_Count', 'Rims', 'Material', 'Style', 'Rim_Compatibility', 'Dimensions'];
        this.all_known_hub_options = ['Hubs', 'Hole_Count', 'Color', 'Type', 'Compatibility', 'Axle'];
        this.all_known_options = this.all_known_rim_options.concat(this.all_known_hub_options);
        this.rim_hub_common_options = {'Hole_Count': []};
        this.query_api_url = "http://localhost:8000/wbdb_query";

        // for query common fields will be initialized in initial_filter_parser
        this.query = new WheelbuilderQuery(this.all_known_rim_options, this.all_known_hub_options);
        this.initial_filert_done = false;
        this.initial_filter();
    }

    filter_options($changedOption) {
        // Main call. This is called from ProductUtils page.
        if (this.initial_filert_done)  this.prepare_query($changedOption);
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

    initial_filter() {
        // Used at class initialization.
        // Search through options, and if there is a *-rim option, filter every other option according to rim selection
        let initial_query = new WheelbuilderQuery(this.all_known_rim_options, this.all_known_hub_options);
        let option_values_array = [];
        for (let option_name in this.all_options_on_page) {
            if (initial_query.is_option_rim(option_name)) {
                let $option_object = $(this.all_options_on_page[option_name]);
                let $option_values_object = $option_object.find('.wb-option');
                $option_values_object.each(function(){
                   let option_value = $(this).text()
                   option_values_array.push(option_value);
                });
                initial_query.set(option_name, option_values_array);
                initial_query.set('inventory_type', 'Rims');
                initial_query.log("INITIAL QUERY");
            }
        }
        if (option_values_array.length !== 0) {
            console.log("INITIAL QUERY NOT EMPTY MAKING AJAX CALL")
            this.ajax_call(initial_query.get_query(), this.query_api_url, this.initial_filter_parser);
        }

    }

    initial_filter_parser(query_result, parent) {
        if (JSON.stringify(query_result) !== JSON.stringify({})) {
            for (let key in parent.query.rim_hub_common_options) {
                if (query_result.hasOwnProperty(key)) {
                    let values = query_result[key];
                    parent.query.set_common_options_defaults(key, values);
                }
            }
        }
        // set common fields in query
        parent.query.set_query_common_options_to_defaults();
        parent.initial_filert_done = true;
        parent.ajax_call(parent.query.get_query(), parent.query_api_url, parent.result_parser);
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
        let $option_object = $(this.all_options_on_page[option_name]);
        const $option_values_object = $option_object.find('.form-select');
        const $selected_item = $option_values_object.find(':selected');
        let selected_index = $selected_item.index();
        let value = $selected_item.text();
        if (selected_index > 0 ) {
            this.query.set(option_name, value);
        } else {
            this.query.remove(option_name);
        }
        this.query.log("QUERY READY TO BE SEND");
        this.ajax_call(this.query.get_query(), this.query_api_url, this.result_parser);

    }

    result_parser(query_result, parent) {
        let attributes_list = parent.all_known_options;
        let options_list = parent.all_options_on_page;
        if (JSON.stringify(query_result) !== JSON.stringify({})) {
            for (let i = 0; i < attributes_list.length; i++) {
                let attribute = attributes_list[i];
                if (((options_list.hasOwnProperty(attribute))) && (query_result.hasOwnProperty(attribute))) {
                    let option = options_list[attribute];
                    let $option_values_object = $(option).find('.wb-option');
                    // parent.set_new_query(attribute, query_result[attribute]);
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
}



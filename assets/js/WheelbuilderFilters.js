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
        this.query_api_url = {"initial": "http://localhost:8000/wbdb_query",
                              "Rims": "http://localhost:8000/wbdb_query_rims_first",
                              "Hubs": "http://localhost:8000/wbdb_query_hubs_first",
                              "common": "http://localhost:8000/wbdb_query_rims_first"};

        this._option_types = {'rims':'Rims', 'hubs':'Hubs'}
        this.query = new WheelbuilderQuery();

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

    initialize_filters($changedOption) {
        // let changed_option_name = this.get_name_of_changed_option($changedOption);
        // let changed_option_type = this.get_option_type(changed_option_name);
        // console.log('I GOT NEW OPTION', $changedOption);
        // this.prepare_query(changed_option_type);
    }

    get_option_type(option_name) {
        // Check if option belongs either to Rim Group, Hub Group or is Common Option
        let option_type = null;
        if (this.all_known_hub_options.indexOf(option_name) > -1 ) {
            option_type = this._option_types['hubs'];
        } else if ((this.all_known_rim_options.indexOf(option_name) > -1 ) || (this.query.option_is_rim(option_name))) {
            option_type = this._option_types['rims'];
        } else {
            console.log('WB FILTERS: Unrecognized option type');

        }
        if (this.rim_hub_common_options.hasOwnProperty(option_name)) {
            option_type = 'common';
        }
        return option_type;
    }

    common_options_to_query() {
        let query = {};
        for (let key in this.rim_hub_common_options) {
            let values = this.rim_hub_common_options[key];
            query[key] = {'$in': values};
        }
        return query;
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
        let query = {};
        let option_values_array = [];
        for (let option_name in this.all_options_on_page) {
            if (this.query.option_is_rim(option_name)) {
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
            this.ajax_call(query, this.query_api_url.initial, this.initial_filter_parser);
        }

    }

    prepare_query2($changed_option) {

    }

    prepare_query(changed_option_type) {
        console.log('PARENT QUERY', this.query);
        let query = {};
        let make_query = false; // in no option is selected, dont make query
        for (let key in this._option_types) {
            query[this._option_types[key]] = {};
        }
        // iterate over all the options and find selected value of each option
        for (let option_name in this.all_options_on_page) {

            let option_type = this.get_option_type(option_name);
            if (option_type === 'common') option_type='Rims' //Assume that Rims if over hub always

            let $option_object = $(this.all_options_on_page[option_name]);
            // find value of that option
            const $option_values_object = $option_object.find('.form-select');
            const $selected_item = $option_values_object.find(':selected');
            let selected_index = $selected_item.index();
            if (selected_index > 0 ) { //skip 1st option which is "Pick one.." or something
                make_query = true;
                let selected_option_value = $selected_item.text();
                query[option_type][option_name] = selected_option_value;
            } else {
                if (this.rim_hub_common_options.hasOwnProperty(option_name)) {
                    let values = this.rim_hub_common_options[option_name]
                    query[option_type][option_name] =  {'$in': values};
                }
            }
        }
        query['rim_attributes'] = this.all_known_rim_options;
        query['hub_attributes'] = this.all_known_hub_options;
        query['common_attributes'] = this.rim_hub_common_options;
        console.log("Query before ajax", query);
        console.log("I WILL ASK",this.query_api_url[changed_option_type], changed_option_type);
        if (make_query) {
            console.log('Output', query);
            this.ajax_call(query, this.query_api_url[changed_option_type], this.result_parser);
        }

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

    initial_filter_parser(query_result, parent) {
        // let rim_hub_common_options = parent.rim_hub_common_options;
        if (JSON.stringify(query_result) !== JSON.stringify({})) {
            for (let key in parent.rim_hub_common_options) {
                if (query_result.hasOwnProperty(key)) {
                    let values = query_result[key];
                    parent.rim_hub_common_options[key] = values;
                }
            }
        }
        let query = parent.common_options_to_query();
        console.log("INITIAL QUERY", query);
        query['attributes'] = parent.all_known_options;
        parent.ajax_call(query, parent.query_api_url.initial, parent.result_parser);
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



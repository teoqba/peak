
export default class WheelbuilderFilters {
    constructor($parent_page) {
        console.log('WB init');
        this.$parent_page = $parent_page;
        this.all_options_on_page = this.get_all_options_on_page();
        this.all_known_rim_options = ['Hole_Count', 'Rims', 'Material', 'Style', 'Compatibility', 'Dimensions'];
        this.all_known_hub_options = ['Hubs', 'Hole_Count', 'Color', 'Type', 'Compatibility', 'Axle'];
        this.all_known_options = this.all_known_rim_options.concat(this.all_known_hub_options);
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
        this.prepare_query();
    }

    inital_filter() {
        // Used at class initialization.
        // Search through options, and if there is a *-rim option, filter every other option according to rim selection
        let _this = this;
        this.$all_options_on_page.each(function () {
            let option_name = $(this).find('.wb-option-display-name').text();
            option_name = option_name.split(' ').join('_');
            if (_this.option_is_rim(option_name)) {
                //do initial filtering
            }
        });

    }

    option_is_rim(option_name) {
        // Check if option is in rim-options group, if not, check if its {prefix}-rim* extension

        // TODO: This will find Hole_Count and assign it to Rim Options. Is this correct?
        if (this.all_known_rim_options.indexOf(option_name) > 0) return true

        // TODO the dash might be a problem when we will just use Rims as option name
        let extension = /-rim*/g; //matches {prefix}-rim* expression
        let test = option_name.match(extension);
        return (test) ? (true) : (false);
    }

    prepare_query() {
        let query = {};
        let make_query = false; // in no option is selected, dont make query
        query['Hubs'] = {};
        query['Rims'] = {};

        // iterate over all the options and find selected value of each option
        for (let option_name in this.all_options_on_page) {
            let $option_object = $(this.all_options_on_page[option_name]);
            // Find if option is Rim name in format -rim*
            let query_selector = 'Hubs';
            if (this.option_is_rim(option_name)) query_selector = 'Rims';
            // find value of that option
            const $option_values_object = $option_object.find('.form-select');
            const $selected_item = $option_values_object.find(':selected');
            let selected_index = $selected_item.index();
            console.log('Selected index', selected_index);
            if (selected_index > 0 ) { //skip 1st option which is "Pick one.." or something
                make_query = true;
                let selected_option_value = $selected_item.text();
                query[query_selector][option_name] = selected_option_value;
            }
        }

        query['hubs_attributes'] = this.all_known_hub_options;
        query['rims_attributes'] = this.all_known_rim_options;
        console.log("Query before ajax", query);
        if (make_query) {
            console.log('Output', query);
            this.ajax_call(query);
        }

    }

    result_parser(query_result, attributes_list, options_list) {
        // called from ajax_call
        console.log('Query result', query_result);
        for (let i=0; i< attributes_list.length; i++){
            let attribute = attributes_list[i];
            if(options_list.hasOwnProperty(attribute)){
                let option = options_list[attribute];
                let $option_values_object = $(option).find('.wb-option');
                $option_values_object.each(function(){
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

    ajax_call(query) {
        let _this = this;
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                console.log('Response', this.responseText);
                let result =  JSON.parse(this.responseText);
                // _this.result_parser(result, _this.all_known_options, _this.options_list);
                _this.result_parser(result, _this.all_known_options, _this.all_options_on_page);

            }
        };
        xhttp.open("POST", "http://localhost:8000/wbdb_query", true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send(JSON.stringify(query));
    }

}

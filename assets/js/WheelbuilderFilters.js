
export default class WheelbuilderFilters {
    constructor($parent_page) {
        console.log('WB init');
        this.$parent_page = $parent_page;
        this.$all_options_on_page = this.get_all_options_on_page();
        this.options_list = {};
        this.rim_options_group = [];
        this.hub_options_group = ['Hubs', 'Hole_Count', 'Color', 'Type', 'Compatibility', 'Axle'];
        console.log('Test',this.option_is_rim('Enve-'));
    }

    get_all_options_on_page() {
        // Find all the options. Currently it only looks at the options form set-select.html
        let $all_set_select_options = this.$parent_page.find('.form-field-select');
        return $all_set_select_options;
    }

    initialize_filters() {
        this.prepare_query()
    }

    option_is_rim(option_name) {
        // Check if option is in rim-options group, if not, check if its {prefix}-rim* extension
        if (this.rim_options_group.indexOf(option_name) > 0) return true

        let extension = /-rim*/g; //matches {prefix}-rim* expressiob
        let test = option_name.match(extension);
        return (test) ? (true) : (false);
    }

    prepare_query() {
        let output = {};
        let query = {};
        let make_query = false; // in no option is selected, dont make query
        query['collection'] = 'Hubs';
        // query['Hubs'] = {};
        // query['Rims'] = {};
        // Find all the options from template set-select

        //TODO crate a json with all the options so its easier to hide them
        //TODO make a list with hubsnames from the DB query [hub1, hub2]
        //TODO iterate over options names, if name not in list -> hide.

        let _this = this;
        // iterate over all the options and find name=value pairs
        this.$all_options_on_page.each(function () {
            // find name of option
            let option_name = $(this).find('.wb-option-display-name').text();
            option_name = option_name.split(' ').join('_');
            if (_this.option_is_rim(option_name)) {
                let query_selector = 'Rims';
            } else {
                let query_selector = 'Hubs';
            }
            // add option to group of all the options on the given page
            _this.options_list[option_name] = this;
            // find value of that option
            const $option_values_object = $(this).find('.form-select');
            const $selected_item = $option_values_object.find(':selected');
            let selected_index = $selected_item.index();
            if (selected_index > 0 ) { //skip 1st option which is "Pick one.." or something
                make_query = true;
                let selected_option_value = $selected_item.text();
                // find option id (number)
                let selected_option_id = $selected_item.prop('value');
                console.log(option_name, selected_option_value, selected_option_id, selected_index);
                output[option_name] = {'id': selected_option_id, 'value': selected_option_value};
                query[option_name] = selected_option_value;

                // // BONUS EXAMPLE HOW TO SELECTE OPTION TO HIDE
                // if (selected_option_value === '24H') {
                //     // '[data-product-attribute-value="300"]'
                //     let option_selector = '[data-product-attribute-value=' + '"' + '300' + '"]'
                //     const option_to_hide = $form.find(option_selector);
                //     option_to_hide.hide();
                // }
            }
        });
        query['attributes'] = this.hub_options_group;
        console.log("Local options list", this.options_list);
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
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                let result =  JSON.parse(this.responseText);
                _this.result_parser(result, _this.hub_options_group, _this.options_list);

            }
        };
        xhttp.open("POST", "http://localhost:8000/wbdb_query", true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send(JSON.stringify(query));
    }

}

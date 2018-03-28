import utils from '@bigcommerce/stencil-utils';

export default class wbc {
    constructor() {
        console.log('WB init');
        this.options_list = {}
    }

    init_filter($changedOption) {
        this.$changedOption = $changedOption;
        this.get_all_options_on_page();
        this.attributes_list = ['Hubs', 'Hole_Count', 'Style', 'Color', 'Type', 'Compatibility'];

        this.prepare_query()
    }

    get_all_options_on_page() {
        const $form = this.$changedOption.parents('form');
        this.$all_set_select_options = $form.find('.form-field-select');
    }

    prepare_query() {
        let output = {};
        let query = {};
        let make_query = false; // in no option is selected, dont make query
        query['collection'] = 'Hubs';
        // Find all the options from template set-select

        //TODO crate a json with all the options so its easier to hide them
        //TODO make a list with hubsnames from the DB query [hub1, hub2]
        //TODO iterate over options names, if name not in list -> hide.

        let options_list = {};
        // iterate over all the options and find name=value pairs
        this.$all_set_select_options.each(function () {
            // find name of option
            let option_name = $(this).find('.wb-option-display-name').text();
            option_name = option_name.split(' ').join('_')
            // add option to group of all the options on the given page
            options_list[option_name] = this;
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
        query['attributes'] = this.attributes_list;
        this.options_list = options_list;
        if (make_query) {
            console.log('Output', query);
            this.ajax_call(query, this.result_parser);
        }

    }

    result_parser(query_result, attributes_list, options_list) {
        // called from ajax_call
        console.log('Options list', options_list);
        console.log('Query result', query_result);
        for (let i=0; i< attributes_list.length; i++){
            let attribute = attributes_list[i];
            if(options_list.hasOwnProperty(attribute)){
                let option = options_list[attribute];
                let $option_values_object = $(option).find('.wb-option');
                $option_values_object.each(function(){
                    let result = query_result[attribute];
                    let name = $(this).text();
                    console.log('index of', name, result.indexOf(name), result);
                    if (result.indexOf(name) < 0) {
                        $(this).hide();
                    }
                });
            }
        }
    }

    ajax_call(query, query_result_parser) {
        // https://www.w3schools.com/xml/tryit.asp?filename=tryajax_get

        let result_parser = query_result_parser;
        let options_list = this.options_list;
        let attributes_list = this.attributes_list
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                let result =  JSON.parse(this.responseText);
                result_parser(result, attributes_list, options_list);

            }
        };
        xhttp.open("POST", "http://localhost:8000/wbdb_query", true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send(JSON.stringify(query));
    }

}

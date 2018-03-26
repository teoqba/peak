import utils from '@bigcommerce/stencil-utils';

export default class wbc {
    constructor() {
        console.log('WB init');
    }

    init_filter($changedOption) {
        this.$changedOption = $changedOption;
        this.list_all_options();
    }
    list_all_options() {
        // this.$changedOption = $changedOption;
        const $form = this.$changedOption.parents('form');
        let output = {};
        let query = {};
        let make_query = false; // in no option is selected, dont make quert
        query['collection'] = 'Hubs';
        // Find all the options from template set-select
        const $set_select_options = $form.find('.form-field-select');

        // iterate over all the options and find name=value pairs
        $set_select_options.each(function () {
            // find name of option
            let option_name = $(this).find('.wb-option-display-name').text();
            option_name = option_name.split(' ').join('_')
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
        if (make_query) {
            console.log('Output', query);
            this.ajax_call(query, this.result_parser);
        }

    }

    result_parser(result) {
        // called from ajax_call
        console.log('Query result', result);

    }

    ajax_call(query, query_result_parser) {
        // https://www.w3schools.com/xml/tryit.asp?filename=tryajax_get
        let result_parser = query_result_parser;
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                let result =  JSON.parse(this.responseText);
                result_parser(result);

            }
        };
        xhttp.open("POST", "http://localhost:8000/wbdb_query", true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send(JSON.stringify(query));
    }

}

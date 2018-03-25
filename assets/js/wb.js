import utils from '@bigcommerce/stencil-utils';

export default class wbc {
    constructor() {
        console.log('WB init');
    }

    list_all_options($changedOption) {
        this.$changedOption = $changedOption;
        const $form = this.$changedOption.parents('form');
        // Find all the options from template set-select
        const $set_select_options = $form.find('.form-field-select');

        // iterate over all the options and find name=value pairs
        $set_select_options.each(function () {
            // find name of option
            let option_name = $(this).find('.wb-option-display-name').text();
            option_name = option_name.split(' ').join('_')
            //find value of that option
            const $option_values_object = $(this).find('.form-select');
            const $selected_item = $option_values_object.find(':selected');
            let selected_option_value = $selected_item.text();
            let selected_option_id = $selected_item.prop('value');


            // BONUS EXAMPLE HOW TO SELECTE OPTION TO HIDE
            // let option_value = $option_value_object.find(':selected').text();
            console.log(option_name, selected_option_value, selected_option_id);
            if (selected_option_value === '24H') {
                // '[data-product-attribute-value="300"]'
                let option_selector = '[data-product-attribute-value=' + '"' + '300' + '"]'
                const option_to_hide = $form.find(option_selector);
                option_to_hide.hide();
            }
        });

    }

    get_product_name() {
        const $main_parents = this.$changedOption.parents('.productView');
        const $title = $main_parents.find('.productView-title');
        console.log('Product name', $title.text());
    }
    get_product_category() {
        // const $all_parents = this.$changedOption.parents("div.body");
        // console.log($all_parents);
    }
    get_product(id) {
        // Example of use of api.product.getById
        // /Users/kaminski/Projects/BigCommerce/cornerstone/assets/js/theme/global/quick-view.js
        let callback = function(error, response) {
            console.log('REspnse', $( response));
            let $prod = $(response);
            // console.log('Prod text', $prod.text());
            // console.log('Error', error);
            return response};

        var p = utils.api.product.getById(id,{}, callback);
        console.log('Product,', p);
    }

    ajax_call(Hole_Count) {
        // https://www.w3schools.com/xml/tryit.asp?filename=tryajax_get
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                console.log("Ajax ready", this.responseText);
            }
        };
        xhttp.open("POST", "http://localhost:8000/wbdb_query", true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send(JSON.stringify({collection:"Hubs", Hole_Count:Hole_Count}));
    }
}

import utils from "@bigcommerce/stencil-utils/src/main";

export default class WheelbuilderNoFilters {
    constructor($parent_page) {
        console.log('WB init without filters');
        this.$parent_page = $parent_page;
        this.all_options_on_page = null;
        this.loader = $('#wb-load-spinner');

    }

    init() {
        this.all_options_on_page = this.get_all_options_on_page();
        this.remove_placeholder_options();
        this.loader.hide();
    }

    remove_placeholder_options() {
        // In all the wheelbuilder options on page removes  "option_placeholder_*" option
        for (let option_name in this.all_options_on_page) {
            let $option_object = this.all_options_on_page[option_name];
            let $option_values_object = $option_object.find('.wb-option');

            $option_values_object.each(function () {
                let name = $(this).text();
                if (name.indexOf('placeholder') > -1) {
                    $(this).hide();
                }
            });
        }
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

    filter_options(object){
    // dummy function to keep this compatybile with wheelbuilderFilterStages.jsß
    }
}
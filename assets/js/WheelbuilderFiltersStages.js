import WheelbuilderQuery from './WheelbuilderQuery';
import WheelbuilderOptionAliases from './WheelbuilderOptionAliases';
import WheelbuilderStageOptions from './WheelbuilderStageOptions.js';

export default class WheelbuilderFiltersStages {
    constructor($parent_page) {
        console.log('WB init');

        this.$parent_page = $parent_page;
        this.all_options_on_page = null;
        this.initial_filer_done = false;
        this.all_known_rim_options = []; // not used here really, only in general wizard
        this.all_known_hub_options = []; // not used here really, only in general wizard
        this.all_known_options = [];     // this will be used for option names aliasing
        this.common_options_roots = [];  // not used here really, only in general wizard
        this.rim_hub_common_options = {};// not used here really, only in general wizard

        //TODO: put those to WB_DB too
        this.all_known_stage_one_options = ['Rim_Choice', 'Rim_Size', 'Hole_Count'];
        this.all_known_stage_two_options = ['Disc_Brake_Type'];
        // These two are used to decide if one of the stages is done.
        // Those are json with structure {option_name:null,..}
        // If all the null values are changed to option_values, given stage is considered done
        this.stage_one_options_on_page = new WheelbuilderStageOptions();
        this.stage_two_options_on_page = new WheelbuilderStageOptions();
        this.stage_one_finished = false;
        this.stage_two_finished = false;
        this.stage_one_first_pass = true;
        this.stage_two_first_pass = true;

        this.query_api_url = {"option_names_roots": "http://localhost:8000/options_names_roots",
                              "query": "http://localhost:8000/wbdb_query"};
    }

    init() {
        this.ajax_get(this.query_api_url.option_names_roots).then(this.finish_init.bind(this), this.errorHandler)
    }

    errorHandler(e){
        console.log("Error in Promise", e);
    }

    finish_init(query_result) {
        console.log("Finishing initalization", query_result, this.all_known_rim_options);
        this.all_options_on_page = this.get_all_options_on_page();
        this.all_known_rim_options = query_result['rims_roots'];
        this.all_known_hub_options = query_result['hubs_roots'];
        this.all_known_options = query_result['rims_hubs_roots'];

        this.common_options_roots = query_result['common_roots'];
        // Find aliases of the option names on page
        this.option_aliases = new WheelbuilderOptionAliases(this.all_options_on_page, this.all_known_options);

        this.init_stage_one_two_options();
        // Define Query that will be used throughout the page
        this.query = new WheelbuilderQuery(this.all_known_rim_options, this.all_known_hub_options,
                                           this.all_known_options, this.common_options_roots);

        this.stage_one_query = new WheelbuilderQuery(this.all_known_rim_options, this.all_known_hub_options,
            Object.keys(this.stage_one_options_on_page.options), this.common_options_roots);
        this.stage_one_query.set('inventory_type', 'Rims');
        this.rim_hub_common_options = this.query.rim_hub_common_defaults;

        this.hide_stage_two_stage_three_options();
        this.initial_filer_done = true;
    }

    init_stage_one_two_options() {
        for(let key in this.option_aliases.all_options_on_page_aliased) {
            if (this.all_known_stage_one_options.indexOf(key) > -1) {
                this.stage_one_options_on_page.set(key, null);
            } else if (this.all_known_stage_two_options.indexOf(key) > -1) {
                this.stage_two_options_on_page.set(key, null);
            }
        }
    }

    filter_options($changedOption) {
        // Main call. This is called from ProductUtils page.
        if (this.initial_filer_done) this.divide_into_stages_and_query($changedOption);
    }

    divide_into_stages_and_query($changedOption) {
        let option_name = this.get_name_of_changed_option($changedOption);
        let option_name_alias = this.option_aliases.option_alias[option_name];
        let $option_object = $(this.option_aliases.all_options_on_page_aliased[option_name_alias]);
        const $option_values_object = $option_object.find('.form-select');
        const $selected_item = $option_values_object.find(':selected');
        let value = $selected_item.text();
        if (this.stage_one_options_on_page.have_member(option_name_alias)) this.stage_one_options_on_page.set(option_name_alias, value) ;
        if (this.stage_two_options_on_page.have_member(option_name_alias)) this.stage_two_options_on_page.set(option_name_alias, value) ;

        if (this.stage_one_options_on_page.all_options_selected()) this.stage_one_finished = true;
        if (this.stage_two_options_on_page.all_options_selected()) this.stage_two_finished = true;
        console.log('Stage 1 options on page', this.stage_one_options_on_page);
        // if Stage 1 and Stage 2 are finished filter whatever is left in stage 3
        if (this.stage_one_finished && this.stage_two_finished)
            this.prepare_query($changedOption);

        // Stage 1: filter only after all choice is done
        if (this.stage_one_finished && this.stage_one_first_pass) {
            this.filter_after_stage_one_done();
            this.show_stage_two_options();
            this.stage_one_first_pass = false;
        }

        // Stage 2: Filter after everything is done
        if (this.stage_two_finished && this.stage_two_first_pass) {
            this.filter_after_stage_two_done();
            this.show_all_options();
            this.stage_two_first_pass = false;
        }
        if (!this.stage_one_finished) {
            this.prepare_query_one($changedOption)
        }
    }

    hide_stage_two_stage_three_options() {
        for (let option_name in this.option_aliases.all_options_on_page_aliased) {
            if (!this.stage_one_options_on_page.have_member(option_name)) {
                let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
                option_object.hide();
            }
        }
    }

    show_stage_two_options() {
        for (let option_name in this.option_aliases.all_options_on_page_aliased) {
            if (this.stage_two_options_on_page.have_member(option_name)) {
                let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
                option_object.show();
            }
        }
    }

    show_all_options() {
        console.log("Starting to show all options");
        for (let option_name in this.option_aliases.all_options_on_page_aliased) {
            let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
            option_object.show();
        }
    }


    filter_after_stage_one_done() {
        for(let option_name in this.stage_one_options_on_page.options) {
            this.query.set(option_name, this.stage_one_options_on_page.get(option_name));
        }
        this.query.set('inventory_type', 'Hubs');
        this.ajax_post(this.query.get_query(),this.query_api_url.query, this.result_parser);
    }

    filter_after_stage_two_done() {
        for(let option_name in this.stage_two_options_on_page.options) {
            this.query.set(option_name, this.stage_two_options_on_page.get(option_name));
        }
        this.query.set('inventory_type', 'Hubs');
        this.ajax_post(this.query.get_query(),this.query_api_url.query, this.result_parser);
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

    ajax_post(query, url, parser) {
        let _this = this;
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                // console.log('Response', this.responseText);
                let result =  JSON.parse(this.responseText);
                console.log('AJax result', result);
                parser(result, _this);

            }
        };
        xhttp.open("POST", url, true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send(JSON.stringify(query));
    }

    ajax_get(url) {
        // https://medium.com/front-end-hacking/ajax-async-callback-promise-e98f8074ebd7
        let promise_obj = new Promise(function(resolve, reject) {
            let xhttp = new XMLHttpRequest();
            xhttp.open("GET", url, true);
            xhttp.setRequestHeader("Content-Type", "application/json");
            xhttp.send();

            xhttp.onreadystatechange = function() {
                if (this.readyState === 4 && this.status === 200) {
                    let result =  JSON.parse(this.responseText);
                    resolve(result);}
                // } else {

                //     reject(this.status);
                // }
            };
        });
        return promise_obj;
    }

    prepare_query($changed_option) {
        let option_name = this.get_name_of_changed_option($changed_option);
        let option_name_alias = this.option_aliases.option_alias[option_name];
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
        this.ajax_post(this.query.get_query(), this.query_api_url.query, this.result_parser);
    }


    prepare_query_one($changed_option) {
        let option_name = this.get_name_of_changed_option($changed_option);
        let option_name_alias = this.option_aliases.option_alias[option_name];
        let $option_object = $(this.option_aliases.all_options_on_page_aliased[option_name_alias]);
        const $option_values_object = $option_object.find('.form-select');
        const $selected_item = $option_values_object.find(':selected');
        let selected_index = $selected_item.index();
        let value = $selected_item.text();
        if (selected_index > 0 ) {
            this.stage_one_query.set(option_name_alias, value);
        } else {
            this.stage_one_query.remove(option_name_alias);
        }
        this.stage_one_query.log('Stage one query');
        this.ajax_post(this.stage_one_query.get_query(), this.query_api_url.query, this.result_parser);
    }


    autoselect(option, query_result) {
        if (query_result.length === 1) {
            let data_label = 'data-wb-label="' + query_result[0]+'"';
            let one_option = $(option).find('.form-select option['+ data_label + ']');
            let option_name = $(option).find('.wb-option-display-name').text();
            let value = $(one_option).text();
            option_name = option_name.split(' ').join('_');
            // select option
            $(one_option).attr("selected", "selected");
            // make sura that this selection is also reflected in query
            this.query.set(option_name, value);
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
        console.log('Query results in resilt pareser', query_result);
        // parent.check_if_build_is_invalid(query_result);
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
                    // parent.autoselect(option, query_result[option_name_alias])
                }
            }
        }
    }
}


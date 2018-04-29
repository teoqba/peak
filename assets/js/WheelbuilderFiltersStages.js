import WheelbuilderQuery from './WheelbuilderQuery';
import WheelbuilderOptionAliases from './WheelbuilderOptionAliases';
import WheelbuilderStageOptions from './WheelbuilderStageOptions.js';

export default class WheelbuilderFiltersStages {
    constructor($parent_page) {
        console.log('WB init');

        this.$parent_page = $parent_page;
        this.all_options_on_page = null;
        this.initial_filer_done = false;
        this.all_known_rim_options = [];
        this.all_known_hub_options = [];
        this.all_known_options = [];
        this.common_options_roots = [];
        this.rim_hub_common_options = {};

        this.all_known_stage_one_options = ['Rim_Choice', 'Rim_Size', 'Hole_Count'];
        this.all_known_stage_two_options = ['Axle_Type', 'Disc_Brake_Type'];
        this.stage_one_options_on_page = new WheelbuilderStageOptions();
        this.stage_two_options_on_page = new WheelbuilderStageOptions();
        this.stage_one_finished = false;
        this.stage_two_finished = false;

        this.query_api_url = {"initial": "http://localhost:8000/wbdb_query_initial",
                              "single_query": "http://localhost:8000/wbdb_query_single",
                              "double_query": "http://localhost:8000/wbdb_query_double",
                              "option_names_roots": "http://localhost:8000/options_names_roots",
                              "query": "http://localhost:8000/wbdb_query",};
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
        this.option_aliases = new WheelbuilderOptionAliases(this.all_options_on_page, this.all_known_options);

        this.init_stage_one_two_options();

        this.query = new WheelbuilderQuery(this.all_known_rim_options, this.all_known_hub_options,
                                           this.all_known_options, this.common_options_roots);
        this.rim_hub_common_options = this.query.rim_hub_common_defaults;
        console.log('ALl roots', this.all_known_options);
        this.hide_stage_two_stage_three_options();
        // this.initial_filter();
        this.initial_filer_done = true;// hack
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

    hide_stage_two_stage_three_options() {
        for (let option_name in this.option_aliases.all_options_on_page_aliased) {
            if (!this.stage_one_options_on_page.have_member(option_name)) {
                let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
                option_object.hide();
            }
        }
    }

    filter_options($changedOption) {
        // Main call. This is called from ProductUtils page.
        if (this.initial_filer_done) this.on_changed_option($changedOption);
        // if (this.initial_filer_done) this.prepare_query($changedOption);
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

    on_changed_option($changedOption) {
        console.log('Starting on changed option');
        let option_name = this.get_name_of_changed_option($changedOption);
        let option_name_alias = this.option_aliases.option_alias[option_name];
        let $option_object = $(this.option_aliases.all_options_on_page_aliased[option_name_alias]);
        const $option_values_object = $option_object.find('.form-select');
        const $selected_item = $option_values_object.find(':selected');
        let value = $selected_item.text();
        if (this.stage_one_options_on_page.have_member(option_name)) this.stage_one_options_on_page.set(option_name, value) ;
        if (this.stage_two_options_on_page.have_member(option_name)) this.stage_two_options_on_page.set(option_name, value) ;

        if (this.stage_one_options_on_page.all_options_selected()) this.stage_one_finished = true;
        if (this.stage_two_options_on_page.all_options_selected()) this.stage_two_finished = true;

        if (this.stage_one_finished) {
            // TODO: this needs to be done only once
            this.filter_stage_two_options();
            this.show_stage_two_options();
        }
        if (this.stage_two_finished) this.show_all_options();
    }


    filter_stage_two_options() {
        let stage_two_query = new WheelbuilderQuery(this.all_known_rim_options, this.all_known_hub_options,
                                                    this.all_known_options, this.common_options_roots);

        for(let option_name in this.stage_one_options_on_page.options) {
            // stage_two_query.set(option_name, this.stage_one_options_on_page[option_name]);
            stage_two_query.set(option_name, this.stage_one_options_on_page.get(option_name));
        }
        stage_two_query.set('inventory_type', 'Hubs');
        stage_two_query.log('Stage two query');
        this.ajax_post(stage_two_query.get_query(),this.query_api_url.query, this.result_parser);
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

    get_type_of_changed_option(option_name) {
        if (this.rim_hub_common_options.hasOwnProperty(option_name)) {
            return 'common';
        }

        if (this.all_known_hub_options.indexOf(option_name) > -1 ) {
            return 'Hubs';
        } else if (this.all_known_rim_options.indexOf(option_name) > -1) {
            return 'Rims';
        } else {
            console.log('Unknown option_type', option_name);
            return null;
        }
    }

    ajax_post(query, url, parser) {
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
        let option_type = this.get_type_of_changed_option(option_name_alias);
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
        if (this.get_type_of_changed_option(option_name_alias) === 'common'){
            this.query.log("QUERY READY TO BE SEND FOR OPTION COMMON");
            this.query.remove('inventory_type');
            this.ajax_post(this.query.get_query(), this.query_api_url.single_query, this.result_parser);
        } else {
            this.query.set('inventory_type', option_type);
            this.query.log("QUERY READY TO BE SEND");
            this.ajax_post(this.query.get_query(), this.query_api_url.double_query, this.result_parser);
        }
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



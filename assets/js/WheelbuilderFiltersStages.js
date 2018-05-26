import WheelbuilderQuery from './WheelbuilderQuery';
import WheelbuilderOptionAliases from './WheelbuilderOptionAliases';
import WheelbuilderStageOptions from './WheelbuilderStageOptions.js';

export default class WheelbuilderFiltersStages {
    constructor($parent_page) {
        console.log('WB init');

        this.$parent_page = $parent_page;
        this.all_options_on_page = null;
        this.initial_filter_done = false;
        this.all_known_rim_options = []; // not used here really, only in general wizard
        this.all_known_hub_options = []; // not used here really, only in general wizard
        this.all_known_options = [];     // this will be used for option names aliasing
        this.common_options_roots = [];  // not used here really, only in general wizard
        this.rim_hub_common_options = {};// not used here really, only in general wizard

        //TODO: put those to WB_DB too
        this.all_known_stage_one_options = ['Rim_Choice', 'Rim_Size', 'Hole_Count', 'Brake_Type', 'Rim_Model'];
        this.all_known_stage_two_options = ['Front_Disc_Brake_Interface', 'Rear_Disc_Brake_Interface',
                                            'Front_Axle_Type', 'Rear_Axle_Type'];
        // These two are used to decide if one of the stages is done.
        // Those are json with structure {option_name:null,..}
        // If all the null values are changed to option_values, given stage is considered done
        this.stage_one_options_on_page = new WheelbuilderStageOptions();
        this.stage_two_options_on_page = new WheelbuilderStageOptions();
        this.stage_one_finished = false;
        this.stage_two_finished = false;
        this.stage_one_first_pass = true;
        this.stage_two_first_pass = true;

        // this.query_api_url = {"option_names_roots": "http://localhost:8000/options_names_roots",
        //                       "query": "http://localhost:8000/wbdb_query"};
        this.query_api_url = {"option_names_roots": "http://52.53.197.100:8000/options_names_roots",
            "query": "http://52.53.197.100:8000/wbdb_query"};
    }

    init() {
        this.ajax_get(this.query_api_url.option_names_roots).then(this.finish_init.bind(this), this.errorHandler)
    }

    errorHandler(e){
        console.log("Error in Promise", e);
    }

    finish_init(query_result) {
        // this is callback function called after ajax_get to fetch known set of options
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
        this.query.set('inventory_type', 'Hubs');

        this.stage_one_query = new WheelbuilderQuery(this.all_known_rim_options, this.all_known_hub_options,
                                                     this.stage_one_options_on_page.get_attributes(), this.common_options_roots);
        this.stage_one_query.set('inventory_type', 'Rims');
        this.rim_hub_common_options = this.query.rim_hub_common_defaults;

        this.hide_stage_two_stage_three_options();
        this.initial_filter();
        this.analyze_options_on_page()
        this.initial_filter_done = true; //this is not completely right, should be called in results_parser for initial query
    }

    analyze_options_on_page(){
        // Analyze which options are on the page and try to guess defaults for options that are not included
        // If Brake Type is not given, and Front/Rear Disc Brake type is given, set Brake_Type: Disc
        if ((!this.option_aliases.all_options_on_page_aliased.hasOwnProperty('Brake_Type')) &&
            ((this.option_aliases.all_options_on_page_aliased.hasOwnProperty('Front_Disc_Brake_Interface')) ||
            (this.option_aliases.all_options_on_page_aliased.hasOwnProperty('Rear_Disc_Brake_Interface')))){

            this.stage_one_query.set('Brake_Type', 'Disc Brake');
            this.query.set('Front_Disc_Brake_Interface', {'$ne':'Rim Brake'});
            this.query.set('Rear_Disc_Brake_Interface', {'$ne':'Rim Brake'});
        }
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
        if (this.initial_filter_done) this.divide_into_stages_and_query($changedOption);
    }

    divide_into_stages_and_query($changedOption) {
        // Stage 1: asking about Rim attributes
        // Stage 2: asking about basic Hub attributes
        // Stage 3: choosing the hub
        let option_name = this.get_name_of_changed_option($changedOption);
        let option_name_alias = this.option_aliases.option_alias[option_name];
        let $option_object = $(this.option_aliases.all_options_on_page_aliased[option_name_alias]);
        const $option_values_object = $option_object.find('.form-select');
        const $selected_item = $option_values_object.find(':selected');
        let value = $selected_item.text();
        // set variables controlling stages visibility: this.stage_*_finished
        this.stages_control(option_name_alias, value);

        // If Stage 1 is finished we choose only Hub options, so work with general query each time new option changes
        if (this.stage_one_finished && !this.stage_one_first_pass)
            this.prepare_query($changedOption, this.query);

        // decide if its time to show new stage
        this.unravel_stages();

        if (!this.stage_one_finished) {
            this.prepare_query($changedOption, this.stage_one_query);
        }
    }

    stages_control(option_name_alias, value) {
        // sets variables that controls stages visibility
        if (this.stage_one_options_on_page.have_member(option_name_alias)) this.stage_one_options_on_page.set(option_name_alias, value) ;
        if (this.stage_two_options_on_page.have_member(option_name_alias)) this.stage_two_options_on_page.set(option_name_alias, value) ;

        if (this.stage_one_options_on_page.all_options_selected()) this.stage_one_finished = true;
        if (this.stage_two_options_on_page.all_options_selected()) this.stage_two_finished = true;
    }

    unravel_stages() {
        // decides if it is time to show new stage
        // Stage 1: filter only after all choice is done
        if (this.stage_one_finished && this.stage_one_first_pass) {
            this.filter_after_stage_one_is_done();
            this.show_stage_two_options();
            this.stage_one_first_pass = false;
        }

        // Stage 2:
        if (this.stage_two_finished && this.stage_two_first_pass) {
            // this.filter_after_stage_two_done();
            this.show_all_options();
            this.stage_two_first_pass = false;
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

    initial_filter() {
        // Used at class initialization.
        // Filters options in Stage 1, to avoid incompatible builds
        // Filter all the options based on the results find for Rim-Choice
        let initial_query = new WheelbuilderQuery(this.all_known_rim_options, this.all_known_hub_options,
            this.all_known_options, this.common_options_roots);
        let option_values_array = [];
        for (let option_name in this.all_options_on_page) {
            let option_name_alias = this.option_aliases.option_alias[option_name];
            if ((option_name_alias === 'Rim_Choice') || (option_name_alias === 'Rim_Model') ) {
                // if (initial_query.is_option_rim(option_name_alias)) {
                // let $option_object = $(this.all_options_on_page[option_name]);
                let $option_object = $(this.option_aliases.all_options_on_page_aliased[option_name_alias]);
                let $option_values_object = $option_object.find('.wb-option');
                $option_values_object.each(function(){
                    let option_value = $(this).text()
                    option_values_array.push(option_value);
                });
                initial_query.set(option_name_alias, option_values_array);
                initial_query.set('inventory_type', 'Rims');
                initial_query.log("INITIAL QUERY");
            }
        }
        if (option_values_array.length !== 0) {
            console.log("INITIAL QUERY NOT EMPTY MAKING AJAX CALL");
            this.ajax_post(initial_query.get_query(), this.query_api_url.query, this.result_parser_initial);
        }

    }

    filter_after_stage_one_is_done() {
        for(let option_name in this.stage_one_options_on_page.options) {
            this.query.set(option_name, this.stage_one_options_on_page.get(option_name));
        }
        // TODO: to be tested
        // Try to mess with brake type options
        if (this.stage_one_options_on_page.have_member('Brake_Type')) {
            let brake_type = this.stage_one_options_on_page.get('Brake_Type');
            if (brake_type === 'Rim Brake') {
                this.query.set('Front_Disc_Brake_Interface', 'Rim Brake');
                this.query.set('Rear_Disc_Brake_Interface', 'Rim Brake');
                this.remove_option_from_page('Front_Disc_Brake_Interface');
                this.remove_option_from_page('Rear_Disc_Brake_Interface');
                this.stage_two_options_on_page.remove_option('Front_Disc_Brake_Interface');
                this.stage_two_options_on_page.remove_option('Rear_Disc_Brake_Interface');
            }else {
                this.query.set('Front_Disc_Brake_Interface', {'$ne':'Rim Brake'});
                this.query.set('Rear_Disc_Brake_Interface', {'$ne':'Rim Brake'});
            }
        }
        this.query.log('query in filter after stage one');
        this.ajax_post(this.query.get_query(),this.query_api_url.query, this.result_parser);
    }

    remove_option_from_page(option_name) {
        let option = this.option_aliases.all_options_on_page_aliased[option_name];
        let $option_values_object = $(option).find('.wb-option')
        $option_values_object.remove();
        delete this.option_aliases.all_options_on_page_aliased[option_name];
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


    prepare_query($changed_option, query_object) {
        let option_name = this.get_name_of_changed_option($changed_option);
        let option_name_alias = this.option_aliases.option_alias[option_name];
        let $option_object = $(this.option_aliases.all_options_on_page_aliased[option_name_alias]);
        const $option_values_object = $option_object.find('.form-select');
        const $selected_item = $option_values_object.find(':selected');
        let selected_index = $selected_item.index();
        let value = $selected_item.text();
        if (selected_index > 0 ) {
            // this.query.set(option_name_alias, value);
            query_object.set(option_name_alias, value);
        } else { //user chosen Pick One ...
            // this.query.remove(option_name_alias);
            query_object.remove(option_name_alias);
        }
        query_object.log('Query in prepare query');
        // this.ajax_post(this.query.get_query(), this.query_api_url.query, this.result_parser);
        this.ajax_post(query_object.get_query(), this.query_api_url.query, this.result_parser);
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
            let option_name_alias = this.option_aliases.option_alias[option_name];
            this.query.set(option_name_alias, value);
            this.stages_control(option_name_alias, value);
            this.unravel_stages();
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

    result_parser_initial(query_result, parent) {
        // This one _REMOVES_ all the options that are not compatible with this build
        // so they don't appear later on when filtering hubs parameters.
        let all_options_on_page_aliased = parent.option_aliases.all_options_on_page_aliased;
        if (JSON.stringify(query_result) !== JSON.stringify({})) {
            for (let option_name_alias in parent.stage_one_options_on_page.options) {
                //remove options
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
                            $(this).remove();}

                    });
                    // if only one option is available, autoselect it
                    parent.autoselect(option, query_result[option_name_alias])
                }
            }
        }
    }

}



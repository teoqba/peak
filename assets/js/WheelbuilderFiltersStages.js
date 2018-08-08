import WheelbuilderQuery from './WheelbuilderQuery';
import WheelbuilderOptionAliases from './WheelbuilderOptionAliases';
import WheelbuilderStageOptions from './WheelbuilderStageOptions.js';
import WheelbuilderConfig from './WheelbuilderConfig.js';
import WheelbuilderFrontRearBuildSelection from "./WheelbuilderFrontRearBuildSelection";
import WheelbuilderStepLabel from "./WheelbuilderStepLabel";
import WheelbuilderSpecialOptions from "./WheelbuilderSpecialOptions";
import WheelbuilderHubSpokeConnector from "./WheelbuilderHubSpokeConnector";

import utils from "@bigcommerce/stencil-utils/src/main";

export default class WheelbuilderFiltersStages {
    constructor($parent_page) {
        console.log('WB init');
        this.$parent_page = $parent_page;
        this.all_options_on_page = null;
        this.all_other_options_on_page = null;
        this.initial_filter_done = false;
        this.all_known_rim_options = []; // not used here really, only in general wizard
        this.all_known_hub_options = []; // not used here really, only in general wizard
        this.all_known_options = [];
        this.all_spoke_options = [];
        this.common_options_roots = [];
        this.page_in_rim_choice_mode = true; // used to switch between query for rim or hubs

        // Buttons
        this.$reset_button = this.$parent_page.find('.wb-reset-button');
        this.$back_button = this.$parent_page.find('.wb-back-button');
        this.$next_button = this.$parent_page.find('.wb-next-button');
        this.add_to_cart_button = $('.add-to-cart');
        // Step label
        this.step_label = new WheelbuilderStepLabel(this.$parent_page);
        // to remove it from regular product page, hide stuff until enable_filtering === true to
        this.step_label.init();
        this.$reset_button.hide();
        this.step_label.hide();

        this.enable_filtering = false; // is set to false filtering will not start

        this.wb_config = new WheelbuilderConfig();
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
        this.stage_one_first_pass = true; //fires hub query after all selection in Stage 1 is done
        this.stage_two_first_pass = true; // enables that on each option choice, the code does not try to reveal stage3 options

        this.saved_stage_one_choice = {};
        this.saved_wheelbuild_type = null;
        // this.query_api_url = {"option_names_roots": "http://localhost:8000/options_names_roots",
        //                       "query": "http://localhost:8000/wbdb_query"};
        this.query_api_url = {"option_names_roots": "http://13.56.207.152:8000/options_names_roots",
            "query": "http://13.56.207.152:8000/wbdb_query"};
        // handle the loading spinner
        this.loader = $('#wb-load-spinner');
    }

    init() {
        this.add_to_cart_button.hide();
        this.loader.show();
        this.all_options_on_page = this.get_all_options_on_page();
        this.all_other_options_on_page = this.get_all_other_options_on_page();
        this.hide_all_options_on_page();
        this.ajax_get(this.query_api_url.option_names_roots).then(this.finish_init.bind(this), this.errorHandler)
    }

    buttons_event_handler() {
        var self = this; //https://stackoverflow.com/questions/3365005/calling-class-methods-within-jquery-function
        this.$reset_button.on("click", function() {self.resetSelection()});
        this.$back_button.on("click", function() {self.back_to_stage_one()});
        this.$next_button.on("click", function() {self.forward_to_stage_two_three()});

    }

    errorHandler(e){
        console.log("Error in Promise", e);
    }

    finish_init(query_result) {
        this.scroll_to_top_of_page();
        // this is callback function called after ajax_get to fetch known set of options
        this.all_known_rim_options = query_result['rims_roots'];
        this.all_known_hub_options = query_result['hubs_roots'];
        this.all_known_spokes_options = query_result['spokes_roots'];
        this.all_known_options = query_result['rims_hubs_spokes_roots'];
        this.all_options_on_page = this.get_all_options_on_page(); // keep it here despite they are in init()
        this.all_other_options_on_page = this.get_all_other_options_on_page(); // keep it here despite they are in init()

        // check if there is at least on option on the page that belongs
        // to all_known_options. If not, dont event start filtering
        for (let i=0; i< this.all_known_options.length; i++ ) {
            let option_name = this.all_known_options[i];
            if (Object.keys(this.all_options_on_page).includes(option_name)) {
                this.enable_filtering = true;
            }
        }

        this.show_all_options_on_page();

        if (this.enable_filtering) {
            console.log("FINISHING INIT");

            this.common_options_roots = query_result['common_roots'];
            // Find aliases of the option names on page
            this.option_aliases = new WheelbuilderOptionAliases(this.all_options_on_page, this.all_known_options);
            this.special_options = new WheelbuilderSpecialOptions(this.option_aliases);
            this.special_options.init();

            this.wb_front_rear_selection = new WheelbuilderFrontRearBuildSelection(this.option_aliases, this.all_other_options_on_page);
            this.is_front_rear_selection_active = this.wb_front_rear_selection.init();

            this.init_stage_one_two_options();
            // Define Query that will be used throughout the page
            this.hub_query = new WheelbuilderQuery('Hubs', this.all_known_options, this.common_options_roots);
            this.rim_query = new WheelbuilderQuery('Rims', this.stage_one_options_on_page.get_attributes(), this.common_options_roots);
            this.spoke_query = new WheelbuilderQuery('Spokes', this.all_known_spokes_options, this.common_options_roots);

            //Set initial values of selected options
            for (let i in this.wb_config.find_initial_subset_of_rim_options) {
                let option_name = this.wb_config.find_initial_subset_of_rim_options[i];
                let values = this.find_options_values(option_name);
                this.rim_query.set_initial_option_values(option_name, values);
            }

            for (let i in this.wb_config.find_initial_subset_of_hub_options) {
                let option_name = this.wb_config.find_initial_subset_of_hub_options[i];
                let values = this.find_options_values(option_name);
                this.hub_query.set_initial_option_values(option_name, values);
            }

            this.hub_spoke_connector = new WheelbuilderHubSpokeConnector();
            // this.hub_spoke_connector.init();
            this.hide_stage_two_stage_three_options();
            this.hide_non_filter_options();
            this.initial_filter();
            this.analyze_disc_brake_options();

            this.$reset_button.show();
            this.step_label.show();
            // handle buttons events
            this.buttons_event_handler();

            this.initial_filter_done = true; //this is not completely right, should be called in results_parser for initial query
        }

        this.loader.hide();
    }

    analyze_disc_brake_options(){
        // Analyze which options are on the page and try to guess defaults for options that are not included
        // If Brake Type is not given, and Front/Rear Disc Brake type is given, set Brake_Type: Disc
        if ((!this.option_aliases.all_options_on_page_aliased.hasOwnProperty('Brake_Type')) &&
            ((this.option_aliases.all_options_on_page_aliased.hasOwnProperty('Front_Disc_Brake_Interface')) ||
            (this.option_aliases.all_options_on_page_aliased.hasOwnProperty('Rear_Disc_Brake_Interface')))){

            this.rim_query.set('Brake_Type', 'Disc Brake');
            this.hub_query.set('Front_Disc_Brake_Interface', {'$ne':'Rim Brake'});
            this.hub_query.set('Rear_Disc_Brake_Interface', {'$ne':'Rim Brake'});
        // if Brake Type is not given and Front/Rear Disc Brake  are _NOT_ given, assume Brake_Type: Disc
        } else if ((!this.option_aliases.all_options_on_page_aliased.hasOwnProperty('Brake_Type')) &&
                  ((!this.option_aliases.all_options_on_page_aliased.hasOwnProperty('Front_Disc_Brake_Interface')) ||
                  (!this.option_aliases.all_options_on_page_aliased.hasOwnProperty('Rear_Disc_Brake_Interface')))) {
            this.rim_query.set('Brake_Type', 'Rim Brake');
            this.hub_query.set('Front_Disc_Brake_Interface', 'Rim Brake');
            this.hub_query.set('Rear_Disc_Brake_Interface', 'Rim Brake');
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
        if (this.enable_filtering) {
            if (this.initial_filter_done) {
                if (this.get_name_of_changed_option($changedOption) !== this.wb_config.build_type_option_name) {
                    this.divide_into_stages_and_query($changedOption);
                }
            }
        }
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
        // if ((this.stage_one_finished && !this.stage_one_first_pass) || (this.stage_two_finished && !this.page_in_rim_choice_mode)) {
        if (this.stage_one_finished && !this.stage_one_first_pass && !this.page_in_rim_choice_mode) {
            if (this.is_option_hub($changedOption)) {
                this.prepare_query($changedOption, this.hub_query);
            } else {
                this.prepare_query($changedOption, this.spoke_query);
            }
        }

        if ((!this.stage_one_finished) || (this.stage_one_finished && this.page_in_rim_choice_mode)) {
            this.prepare_query($changedOption, this.rim_query);
        }
        // decide if its time to show new stage
        this.unravel_stages();
    }

    stages_control(option_name_alias, value) {
        // sets variables that controls stages visibility
        // TODO: if option is Pick One, unselect options
        if (this.stage_one_options_on_page.have_member(option_name_alias)) this.stage_one_options_on_page.set(option_name_alias, value) ;
        if (this.stage_two_options_on_page.have_member(option_name_alias)) this.stage_two_options_on_page.set(option_name_alias, value) ;

        if (this.stage_one_options_on_page.all_options_selected()) this.stage_one_finished = true;
        if (this.stage_two_options_on_page.all_options_selected()) this.stage_two_finished = true;
    }

    back_to_stage_one(){
        // before showing user stage one again, save all the choices he has done previously
        // we will monitor what changes he had made
        // do js copy (not a deep copy but its ok since its only dictionary)
        this.saved_stage_one_choice = Object.assign({}, this.stage_one_options_on_page.get_current_selection());
        this.saved_wheelbuild_type = this.wb_front_rear_selection.get_wheel_build_type();
        this.hide_stage_two_stage_three_options();
        this.hide_non_filter_options();
        this.show_stage_one_options();
        this.step_label.set_to_step_one();
        this.$back_button.hide();
        this.$next_button.show();
        this.scroll_to_top_of_page();
    }

    forward_to_stage_two_three(){
        if (!this.stage_one_options_on_page.all_options_selected()) {
            alert('Please select all the options.');
            return;
        }
        let current_stage_one_selection = this.stage_one_options_on_page.get_current_selection();
        // if user changes the options when going back from rim selection to hub selection
        // reset all he had in hub selection, as it is not guaranteed that what he had previously chosen
        // is compatible with the build
        let current_wheel_build_type = this.wb_front_rear_selection.get_wheel_build_type();
        if ((JSON.stringify(current_stage_one_selection) !== JSON.stringify(this.saved_stage_one_choice)) ||
            (this.saved_wheelbuild_type !== current_wheel_build_type)){
            this.reset_choices_on_forward_button();
        }

        this.hide_stage_one_options();
        if (this.stage_two_finished) {
            this.show_stage_two_options();
            this.show_remaining_options();
        } else {
            this.show_stage_two_options();
        }
        this.step_label.set_to_step_two();
        this.$next_button.hide();
        this.$back_button.show();
        this.scroll_to_top_of_page();

    }

    reset_choices_on_forward_button() {
        // reset hub_query
        this.hub_query = new WheelbuilderQuery('Hubs', this.all_known_options, this.common_options_roots);
        // this.hub_query.set('inventory_type', 'Hubs');
        this.analyze_disc_brake_options();

        // reset option sets
        for (let option_name in this.all_options_on_page) {
            if (!this.stage_one_options_on_page.have_member(option_name)) {
                let option = this.option_aliases.all_options_on_page_aliased[option_name];
                this.zeroth_option_alternative_to_default_name($(option));
                let $option_values_object = $(option).find('.wb-empty-option');
                $option_values_object.prop('selected', true)
            }
        }
        // show all options values that were hidden before by the filters
        for (let option_name in this.all_options_on_page) {
            if (!this.stage_one_options_on_page.have_member(option_name)) {
                let option = this.option_aliases.all_options_on_page_aliased[option_name];
                let $option_values_object = $(option).find('.wb-option');
                $option_values_object.each(function () {
                    $(this).show();
                });
            }
        }
        // analyze what is current Front/Rear/Wheelset choice and show hide appropriate options
        // TODO this is copy from from init_stage_one_two_options and
        for(let key in this.option_aliases.all_options_on_page_aliased) {
            if (this.all_known_stage_two_options.indexOf(key) > -1) {
                this.stage_two_options_on_page.set(key, null);
            }
        }
        // this is copy from unravel stages
        if (this.is_front_rear_selection_active) {
            let to_hide = this.wb_front_rear_selection.get_front_rear_options_to_hide(this.stage_one_finished);
            for (let i=0; i < to_hide.length; i++) {
                let option_name = to_hide[i];
                // this.remove_option_from_page(option_name);
                this.stage_two_options_on_page.remove_option(option_name);
            }

        }

        this.stage_two_finished = false;
        this.stage_two_first_pass = true;
        // reset selection in stage two options
        this.stage_two_options_on_page.reset();
        this.hide_remaining_options();
        this.filter_after_stage_one_is_done();

    }

    unravel_stages() {
        // decides if it is time to show new stage
        // Stage 1: filter only after all choice is done
        if (this.stage_one_finished && this.stage_one_first_pass) {
            this.filter_after_stage_one_is_done();
            if (this.is_front_rear_selection_active) {
                let to_hide = this.wb_front_rear_selection.get_front_rear_options_to_hide(this.stage_one_finished);
                for (let i=0; i < to_hide.length; i++) {
                    let option_name = to_hide[i];
                    // this.remove_option_from_page(option_name);
                    this.stage_two_options_on_page.remove_option(option_name);
                }

            }
            this.hide_stage_one_options();
            this.show_stage_two_options();
            this.scroll_to_top_of_page();
            this.stage_one_first_pass = false;
        }

        // Stage 2:
        if (this.stage_two_finished && this.stage_two_first_pass) {
            // this.filter_after_stage_two_done();
            this.show_remaining_options();
            this.stage_two_first_pass = false;
            this.add_to_cart_button.show();
        }
    }

    hide_stage_one_options() {
        for (let option_name in this.option_aliases.all_options_on_page_aliased) {
            if (this.stage_one_options_on_page.have_member(option_name)) {
                let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
                option_object.hide();
            }
        }
        this.wb_front_rear_selection.hide_selections_buttons();
    }

    show_stage_one_options() {
        this.page_in_rim_choice_mode = true;
        for (let option_name in this.option_aliases.all_options_on_page_aliased) {
            if (this.stage_one_options_on_page.have_member(option_name)) {
                let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
                option_object.show();
            }
        }
        this.wb_front_rear_selection.show_selections_buttons();
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
        this.step_label.set_to_step_two();
        this.page_in_rim_choice_mode = false;
        this.$back_button.show();
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

    show_remaining_options() {
        for (let option_name in this.option_aliases.all_options_on_page_aliased) {
            let is_hidden_front_rear = this.wb_front_rear_selection.get_front_rear_options_to_hide(this.stage_one_finished).indexOf(option_name);
            let is_special_option_hidden = this.special_options.is_special_option_hidden(option_name);
            if ((!this.stage_one_options_on_page.have_member(option_name)) &&
                (!this.stage_two_options_on_page.have_member(option_name)) &&
                (is_hidden_front_rear < 0) &&
                (!is_special_option_hidden)) {
                let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
                option_object.show();
            }
        // show all the options that might be included in options set but does not belong to any filtering
        this.show_non_filter_options();
        }
    }

    hide_remaining_options() {
        for (let option_name in this.option_aliases.all_options_on_page_aliased) {
            if ((!this.stage_one_options_on_page.have_member(option_name)) &&
                (!this.stage_two_options_on_page.have_member(option_name))) {
                let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
                option_object.hide();
            }
        }
        // hide all the options that might be included in options set but does not belong to any filtering
        this.hide_non_filter_options();
    }

    hide_non_filter_options() {
        for (let option_name in this.all_other_options_on_page) {
            if (option_name !== this.wb_config.build_type_option_name) {
                let $option_object = this.all_other_options_on_page[option_name];
                $option_object.hide();
            }
        }
    }

    show_non_filter_options() {
        for (let option_name in this.all_other_options_on_page) {
            if (option_name !== this.wb_config.build_type_option_name) {
                let $option_object = this.all_other_options_on_page[option_name];
                $option_object.show();
            }
        }
    }

    reset_non_filter_options() {
        for (let option_name in this.all_other_options_on_page) {
            if (option_name !== this.wb_config.build_type_option_name) {
                let $option_object = this.all_other_options_on_page[option_name];
                let $option_values_object = $($option_object).find('.wb-empty-option');
                $option_values_object.prop('selected', true);
            }
        }
    }

    hide_all_options_on_page() {
        for (let option_name in this.all_options_on_page) {
                let $option_object = this.all_options_on_page[option_name];
                $option_object.hide();
        }
        for (let option_name in this.all_other_options_on_page) {
                let $option_object = this.all_other_options_on_page[option_name];
                $option_object.hide();
        }
        // console.log('Body,', $('body'));
        // $('body').scrollTop(0);
    }

    show_all_options_on_page() {
        for (let option_name in this.all_options_on_page) {
                let $option_object = this.all_options_on_page[option_name];
                $option_object.show();
        }
        for (let option_name in this.all_other_options_on_page) {
                let $option_object = this.all_other_options_on_page[option_name];
                $option_object.show();
        }
    }

    scroll_to_top_of_page(){
        let scroll_duration = 500;
        $('html,body').animate({scrollTop:0},scroll_duration);
    }

    find_options_values(option_name) {
        // For given option name, returns list with values associated wit this option
        let option_values_array = [];
        let option_name_alias = this.option_aliases.option_alias[option_name];

        if (option_name_alias != undefined) {
            let $option_object = $(this.option_aliases.all_options_on_page_aliased[option_name_alias]);
            let $option_values_object = $option_object.find('.wb-option');
            $option_values_object.each(function () {
                let option_value = $(this).text();
                option_values_array.push(option_value);
            });
        }
        return option_values_array;
    }

    initial_filter() {
        // Used at class initialization.
        // Filters options in Stage 1, to avoid incompatible builds
        // Filter all the options based on the results find for Rim-Choice
        let initial_query = new WheelbuilderQuery('Rims', this.all_known_options, this.common_options_roots);
        let option_values_array = [];
        for (let option_name in this.all_options_on_page) {
            let option_name_alias = this.option_aliases.option_alias[option_name];
            if ((option_name_alias === 'Rim_Choice') || (option_name_alias === 'Rim_Model') ) {
                option_values_array = this.find_options_values(option_name_alias);
                initial_query.set(option_name_alias, option_values_array);
                // initial_query.set('inventory_type', 'Rims');
                initial_query.log("INITIAL QUERY");
            }
        }
        if (option_values_array.length !== 0) {
            this.ajax_post(initial_query.get_query(), this.query_api_url.query, this.result_parser_initial);
        }

    }

    filter_after_stage_one_is_done() {
        for(let option_name in this.stage_one_options_on_page.options) {
            this.hub_query.set(option_name, this.stage_one_options_on_page.get(option_name));
        }
        // TODO: to be tested
        // Try to mess with brake type options
        if (this.stage_one_options_on_page.have_member('Brake_Type')) {
            let brake_type = this.stage_one_options_on_page.get('Brake_Type');
            if (brake_type === 'Rim Brake') {
                this.hub_query.set('Front_Disc_Brake_Interface', 'Rim Brake');
                this.hub_query.set('Rear_Disc_Brake_Interface', 'Rim Brake');
                this.remove_option_from_page('Front_Disc_Brake_Interface');
                this.remove_option_from_page('Rear_Disc_Brake_Interface');
                this.stage_two_options_on_page.remove_option('Front_Disc_Brake_Interface');
                this.stage_two_options_on_page.remove_option('Rear_Disc_Brake_Interface');
            }else {
                this.hub_query.set('Front_Disc_Brake_Interface', {'$ne':'Rim Brake'});
                this.hub_query.set('Rear_Disc_Brake_Interface', {'$ne':'Rim Brake'});
            }
        }
        this.hub_query.set('Hole_Count', this.rim_query.get('Hole_Count'));
        console.log("Query after stage one is done");
        this.ajax_post(this.hub_query.get_query(),this.query_api_url.query, this.result_parser);
    }

    remove_option_from_page(option_name) {
        let option = this.option_aliases.all_options_on_page_aliased[option_name];
        let $option_values_object = $(option).find('.wb-option')
        // $option_values_object.remove(); // TODO: remove it or set it to Pick One...?
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

    get_all_other_options_on_page() {
        // finds other options on page of type:
        // - rectangle (used Wheelset/Front/Rear choice)
        // - set select
        // - swatch

        //look for set-rectangle options
        let all_options = {};
        let $all_field_rectangle_options = this.$parent_page.find('.form-field-rectangle');
        $all_field_rectangle_options.each(function () {
            // find name of option
            let option_name = $(this).find('.wb-option-display-name').text();
            option_name = option_name.split(' ').join('_');
            all_options[option_name] = $(this);
        });
        // look for other set-select options
        let $all_set_select_options = this.$parent_page.find('.form-field-select');
        var parent = this;
        $all_set_select_options.each(function () {
            // find name of option
            let option_name = $(this).find('.wb-option-display-name').text();
            option_name = option_name.split(' ').join('_');
            if (parent.all_known_options.indexOf(option_name) < 0) {
                all_options[option_name] = $(this);
            }
        });
        // swatch
        let $all_swatch_options = this.$parent_page.find('.form-field-swatch');
        $all_swatch_options.each(function () {
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

    is_option_hub($changedOption) {
        let option_name = this.get_name_of_changed_option($changedOption)
        if (this.all_known_hub_options.indexOf(option_name) > -1) {
            return true;
        }
        return false;
    }

    ajax_post(query, url, parser) {
        let _this = this;
        this.loader.show();
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

    zeroth_option_to_alternative_name($option_values_object) {
        // changes Pick one... options to Reset selections ...
        let empty_option = $option_values_object.find(".wb-empty-option");
        $(empty_option).text(this.wb_config.zeroth_option_alternative_name);
    }

    zeroth_option_alternative_to_default_name($option_values_object) {
        // Reverts back Reset selections... to Pick one...
        let empty_option = $option_values_object.find(".wb-empty-option");
        $(empty_option).text(this.wb_config.zeroth_option_default_name);
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
            // this.hub_query.set(option_name_alias, value);
            //set name Pick One -> Reset
            this.zeroth_option_to_alternative_name($option_values_object);
            query_object.set(option_name_alias, value);
        } else { //user chosen Pick One ...
            //revert name to Pick One...
            this.zeroth_option_alternative_to_default_name($option_values_object);
            // Remove selection from query
            query_object.remove(option_name_alias);
            // If the option that was reset was Disc Brake interface, make sure its not
            // pointing to Rim Brake as one of the alternatives
            if((option_name_alias === 'Front_Disc_Brake_Interface') ||
                (option_name_alias === 'Rear_Disc_Brake_Interface')) {
                this.analyze_disc_brake_options();
            }

        }
        // this.ajax_post(this.hub_query.get_query(), this.query_api_url.query, this.result_parser);
        // console.log("Query", query_object.log());
        //TODO here is query is spoke: make duble query and post to diffent url
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
            this.hub_query.set(option_name_alias, value);
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
        // parent.check_if_build_is_invalid(query_result);
        console.log('Query result', query_result);

        let inventory_type = query_result['inventory_type'];

        // Filter appropriate options based on inventory type
        let all_known_options = null; //aliases
        if (inventory_type === 'Hubs') {
            all_known_options = parent.all_known_hub_options;
        } else if (inventory_type === 'Rims'){
            all_known_options = parent.all_known_rim_options;
        } else if (inventory_type === 'Spokes') {
            all_known_options = parent.all_known_spokes_options;
        } else {
            all_known_options = parent.all_known_options;
        }

        // let all_known_options = parent.all_known_options; //aliases
        let all_options_on_page_aliased = parent.option_aliases.all_options_on_page_aliased;
        let special_options = parent.special_options;
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
                        // if (name === 'Pick one...') $(this).hide();
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
        special_options.show_hide(query_result);

        if (inventory_type === 'Hubs') {
            if ((parent.hub_spoke_connector.front_hub_style_changed(query_result)) ||
                (parent.hub_spoke_connector.rear_hub_style_changed(query_result))){
                console.log('Will fly spoke query');
                parent.spoke_query.set('Spokes_Style', parent.hub_spoke_connector.last_spoke_style);
                parent.spoke_query.log('SPOKE QUERY');
                parent.ajax_post(parent.spoke_query.get_query(),parent.query_api_url.query, parent.result_parser);
            }
         } else if (inventory_type === 'Spokes') {
            if (parent.hub_spoke_connector.spoke_style_changed(query_result)) {
                console.log('Will fly hub query');
            }
        }

        parent.loader.hide();
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
                        // if (name === 'Pick one...') $(this).hide();
                        if (result.indexOf(name) < 0) {
                            $(this).remove();}

                    });
                    // if only one option is available, autoselect it
                    // parent.autoselect(option, query_result[option_name_alias])
                }
            }
        }
    }

    resetSelection() {
        // Implementation for reset button
        for (let option_name in this.all_options_on_page) {
            let option = this.option_aliases.all_options_on_page_aliased[option_name];
            this.zeroth_option_alternative_to_default_name($(option));
            let $option_values_object = $(option).find('.wb-empty-option');
            $option_values_object.prop('selected', true)
        }
        // show all options values that were hidden before by the filters
        for (let option_name in this.all_options_on_page) {
            let option = this.option_aliases.all_options_on_page_aliased[option_name];
            let $option_values_object = $(option).find('.wb-option');
            $option_values_object.each(function(){
                $(this).show();
            });
        }
        this.wb_front_rear_selection.reset_selection();
        this.reset_non_filter_options();
        this.show_stage_one_options();
        // Set stages variables to initial values
        this.initial_filter_done = false;
        this.stage_one_first_pass = true;
        this.stage_two_first_pass = true;
        this.stage_one_finished = false;
        this.stage_two_finished = false;
        this.page_in_rim_choice_mode = true;

        this.step_label.set_to_step_one();
        this.$next_button.hide();
        this.$back_button.hide();

        // Emit product-change so prices get updated back to start value
        utils.hooks.emit('product-option-change');
        // Start from scratch
        this.init();
    }

}



import WheelbuilderQuery from './WheelbuilderQuery';
import WheelbuilderOptionAliases from './WheelbuilderOptionAliases';
import WheelbuilderStageOptions from './WheelbuilderStageOptions.js';
import WheelbuilderConfig from './WheelbuilderConfig.js';
import WheelbuilderFrontRearBuildSelection from "./WheelbuilderFrontRearBuildSelection";
import WheelbuilderStepLabel from "./WheelbuilderStepLabel";
import WheelbuilderSpecialOptions from "./WheelbuilderSpecialOptions";
import WheelbuilderHubSpokeConnector from "./WheelbuilderHubSpokeConnector";
import WheelbuilderOptionResetButtons from "./WheelbuilderOptionResetButtons"

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
        this.$start_over_button = this.$parent_page.find('.wb-start-over-button');
        this.$back_button = this.$parent_page.find('.wb-back-button');
        this.$next_button = this.$parent_page.find('.wb-next-button');
        this.$reset_buttons = this.$parent_page.find('.wb-reset-button');

        // handle buttons events
        this.buttons_event_handler();

        this.add_to_cart_button = $('.add-to-cart');
        // Step label
        this.step_label = new WheelbuilderStepLabel(this.$parent_page);
        // to remove it from regular product page, hide stuff until enable_filtering === true to
        this.step_label.init();
        this.$start_over_button.hide();
        this.step_label.hide();

        this.enable_filtering = false; // is set to false filtering will not start

        this.wb_config = new WheelbuilderConfig();
        this.debug_query = this.wb_config.debug_query;
        //TODO: put those to WB_DB too
        this.all_known_stage_one_options = ['Front_Rim_Choice', 'Rear_Rim_Choice', 'Rim_Size', 'Front_Hole_Count',
                                            'Rear_Hole_Count', 'Brake_Type', 'Front_Rim_Model', 'Rear_Rim_Model',
                                            'Intended_Application'];
        this.all_known_stage_two_options = ['Front_Disc_Brake_Interface', 'Rear_Disc_Brake_Interface',
                                            'Front_Axle_Type', 'Rear_Axle_Type'];

        this.minumum_no_of_options_for_filtering = this.wb_config.minumum_no_of_options_for_filtering;
        // These two are used to decide if one of the stages is done.
        // Those are json with structure {option_name:null,..}
        // If all the null values are changed to option_values, given stage is considered done
        this.stage_one_options_on_page = new WheelbuilderStageOptions();
        this.stage_two_options_on_page = new WheelbuilderStageOptions();
        // These variables control hide/show options in Stage 1 upon pressing Front/Rear/Wheelset buttons
        this.stage_one_front_wheel_options_on_page = [];
        this.stage_one_rear_wheel_options_on_page = [];

        this.stage_one_finished = false;
        this.stage_two_finished = false;
        this.never_was_in_stage_two = true;
        this.stage_one_first_pass = true; // fires hub query after all selection in Stage 1 is done
        this.stage_two_first_pass = true; // enables that on each option choice, the code does not try to reveal stage3 options

        this.saved_stage_one_choice = {};
        this.saved_wheelbuild_type = null;
        this.query_api_url = this.wb_config.database_urls;
        // handle the loading spinner
        this.loader = $('#wb-load-spinner');

    }

    init() {

        // Attach function fixing showing and hiding of Option elements in Safari and IE
        $.fn.showDropdownOption = function(canShowOption) {
            // Adopted from
            // https://stackoverflow.com/questions/8373735/jquery-hide-option-doesnt-work-in-ie-and-safari

            $(this).map(function () {
                return $(this).parent('span').length === 0 ? this : null;
            }).wrap('<span>').hide();

            if (canShowOption)
                $(this).unwrap().show();
            else
                $(this).hide();
        };

        // Very nice functional implementation from
        // https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
        String.prototype.replaceAll = function(search, replacement) {
            var target = this;
            return target.split(search).join(replacement);
        };

        this.add_to_cart_button.hide();
        this.loader.show();
        this.all_options_on_page = this.get_all_options_on_page();
        // this.all_other_options_on_page = this.get_all_other_options_on_page();
        this.hide_all_options_on_page();
        this.ajax_get(this.query_api_url.option_names_roots).then(this.finish_init.bind(this), this.errorHandler)
    }

    buttons_event_handler() {
        var self = this; //https://stackoverflow.com/questions/3365005/calling-class-methods-within-jquery-function
        this.$start_over_button.on("click", function() {self.startOver()});
        this.$back_button.on("click", function() {self.back_to_stage_one()});
        this.$next_button.on("click", function() {self.forward_to_stage_two_three()});
        this.$reset_buttons.on("click", function() {self.option_reset_button_clicked(this.id)});

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
        // this.all_other_options_on_page = this.get_all_other_options_on_page(); // keep it here despite they are in init()

        // check if there is at least on option on the page that belongs
        // to all_known_options. If not, dont event start filtering
        let option_counter = 0;
        for (let i=0; i< this.all_known_options.length; i++ ) {
            let option_name = this.all_known_options[i];
            if (Object.keys(this.all_options_on_page).includes(option_name)) {
                option_counter += 1;
                if (option_counter > this.minumum_no_of_options_for_filtering) {

                    this.enable_filtering = true;
                }
            }
        }

        this.show_all_options_on_page();

        if (this.enable_filtering) {
            // console.log("FINISHING INIT");
            this.common_options_roots = query_result['common_roots'];
            this.common_options_roots = this.common_options_roots.concat(this.wb_config.hardcoded_common_option_roots);
            // Find aliases of the option names on page
            this.option_aliases = new WheelbuilderOptionAliases(this.all_options_on_page, this.all_known_options);
            this.special_options = new WheelbuilderSpecialOptions(this.option_aliases);
            this.special_options.init();

            this.all_other_options_on_page = this.get_all_other_options_on_page(); // keep it here despite they are in init()

            this.wb_front_rear_selection = new WheelbuilderFrontRearBuildSelection(this.option_aliases, this.all_other_options_on_page);
            this.is_front_rear_selection_active = this.wb_front_rear_selection.init();
            this.is_previous_option_wheelset = false;

            this.init_stage_one_two_options();
            this.init_stage_one_front_rear_options_on_page();
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

            this.$start_over_button.show();
            this.step_label.show();

            this.initial_filter_done = true; //this is not completely right, should be called in results_parser for initial query
            this.reset_to_options_default_selection();
        } else { // when filtering is disabled
            this.add_to_cart_button.show();
        }
        this.option_reset_buttons = new WheelbuilderOptionResetButtons(this);
        this.option_reset_buttons.init();
        this.loader.hide();
    }

    analyze_disc_brake_options(){
        // Analyze which options are on the page and try to guess defaults for options that are not included
        // If Brake Type is not given, and Front/Rear Disc Brake type is given, set Brake_Type: Disc
        if ((!this.option_aliases.all_options_on_page_aliased.hasOwnProperty('Brake_Type')) &&
            ((this.option_aliases.all_options_on_page_aliased.hasOwnProperty('Front_Disc_Brake_Interface')) ||
            (this.option_aliases.all_options_on_page_aliased.hasOwnProperty('Rear_Disc_Brake_Interface')))){
            this.rim_query.set('Brake_Type', 'Disc Brake');
            //only set $ne: Rim Brake if no selection has been made or selection has been reset
            if (this.hub_query.get('Front_Disc_Brake_Interface') == undefined) {
                this.hub_query.set('Front_Disc_Brake_Interface', {'$ne': 'Rim Brake'});
            }
            if (this.hub_query.get('Rear_Disc_Brake_Interface') == undefined) {
                this.hub_query.set('Rear_Disc_Brake_Interface', {'$ne': 'Rim Brake'});
            }
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

    init_stage_one_front_rear_options_on_page(){
        // analyzes which "hiddable" Front/Rear wheel options in Stage 1 are on page
        for(let key in this.option_aliases.all_options_on_page_aliased) {
            if ((this.all_known_stage_one_options.indexOf(key) > -1) &&
                (this.wb_config.front_wheel_options_stage_one.indexOf(key) > -1)) {
                this.stage_one_front_wheel_options_on_page.push(key);
            } else if ((this.all_known_stage_one_options.indexOf(key) > -1) &&
                (this.wb_config.rear_wheel_options_stage_one.indexOf(key) > -1)){
                this.stage_one_rear_wheel_options_on_page.push(key);
            }

        }
    }

    filter_options($changedOption) {
        // Main call. This is called from ProductUtils page.
        if (this.enable_filtering) {
            if (this.initial_filter_done) {
                if (this.get_name_of_changed_option($changedOption) !== this.wb_config.build_type_option_name) {
                    // user clicked one of the dropdown options
                    this.divide_into_stages_and_query($changedOption);
                } else if (this.get_name_of_changed_option($changedOption) === this.wb_config.build_type_option_name){
                    this.stage_one_front_rear_options_control();
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
        this.never_was_in_stage_two = false;
        this.stage_one_first_pass = false;
    }

    reset_choices_on_forward_button() {
        // reset hub_query
        this.hub_query = new WheelbuilderQuery('Hubs', this.all_known_options, this.common_options_roots);
        // this.hub_query.set('inventory_type', 'Hubs');
        this.analyze_disc_brake_options();

        // reset option sets
        for (let option_name in this.all_options_on_page) {
            let option_name_alias = this.option_aliases.option_alias[option_name];
            if (!this.stage_one_options_on_page.have_member(option_name_alias)) {
                let option = this.option_aliases.all_options_on_page_aliased[option_name_alias];
                this.zeroth_option_alternative_to_default_name($(option));
                let $option_values_object = $(option).find('.wb-empty-option');
                $option_values_object.prop('selected', true)
            }
        }
        // show all options values that were hidden before by the filters
        for (let option_name in this.all_options_on_page) {
            let option_name_alias = this.option_aliases.option_alias[option_name];
            if (!this.stage_one_options_on_page.have_member(option_name_alias)) {
                let option = this.option_aliases.all_options_on_page_aliased[option_name_alias];
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
            this.never_was_in_stage_two = false;
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
                (this.wb_config.front_wheel_options_stage_one.indexOf(option_name) < 0 ) && // checks if option does not belong to hiddable stage 1 options
                (this.wb_config.rear_wheel_options_stage_one.indexOf(option_name) < 0 ) && // checks if option does not belong to hiddable stage 1 options
                (!is_special_option_hidden)) {
                    let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
                    option_object.show();
            }
        // show all the options that might be included in options set but does not belong to any filtering
        }
        this.show_non_filter_options();
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

    stage_one_front_rear_options_control(){
        // controls hiding/showing Front/Rear wheel related options in Stage 1
        // depending on Wheel Build Type Selection (Front/Rear/Wheelset)
        let to_hide = this.wb_front_rear_selection.get_stage_one_front_rear_options_to_hide(this.stage_one_finished);
        if (to_hide === 'rear') {
            this.hide_stage_one_rear_wheel_options(this.is_previous_option_wheelset);
            this.is_previous_option_wheelset = false;
        } else if (to_hide === 'front'){
            this.hide_stage_one_front_wheel_options(this.is_previous_option_wheelset);
            this.is_previous_option_wheelset = false;
        } else { //wheelset
            this.show_stage_one_front_rear_options();
            this.is_previous_option_wheelset = true;
        }
        // console.log('stage one options on page ', this.stage_one_options_on_page)
    }

    show_hide_forward_to_stage_two_button(){
        if (this.stage_one_options_on_page.all_options_selected()) {
            this.stage_one_finished = true;
            this.$next_button.show();
        } else {
            this.stage_one_finished = false;
            this.$next_button.hide();
        }
    }

    hide_stage_one_front_wheel_options() {
        for (let i=0; i < this.stage_one_front_wheel_options_on_page.length; i++) {
            let option_name = this.stage_one_front_wheel_options_on_page[i];
            this.stage_one_options_on_page.remove_option(option_name);
            this.reset_option_selection(option_name);
            // clear query
            this.rim_query.remove(option_name);
            let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
            option_object.hide();
        }

        for (let i=0; i < this.stage_one_rear_wheel_options_on_page.length; i++) {
            let option_name = this.stage_one_rear_wheel_options_on_page[i];
            let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
            if (this.is_previous_option_wheelset === false) { //transition wheelset -> rear wheel
                this.stage_one_options_on_page.set(option_name, null);
                //show all the possible selections in the option box
                let $option_values_object = $(option_object).find('.wb-option');
                $option_values_object.each(function () {
                    $(this).show();
                });
            }
            option_object.show();
        }
        if (this.never_was_in_stage_two === true) { //show/hide this button ONLY if we have never been in stage two before
            this.show_hide_forward_to_stage_two_button();
        }
        this.ajax_post(this.rim_query.get_query(), this.query_api_url.query, this.result_parser);

    }

    hide_stage_one_rear_wheel_options() {
        for (let i = 0; i < this.stage_one_rear_wheel_options_on_page.length; i++) {
            let option_name = this.stage_one_rear_wheel_options_on_page[i];
            this.stage_one_options_on_page.remove_option(option_name);
            this.reset_option_selection(option_name);
            // clear query
            this.rim_query.remove(option_name);
            let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
            option_object.hide();
        }

        for (let i = 0; i < this.stage_one_front_wheel_options_on_page.length; i++) {
            let option_name = this.stage_one_front_wheel_options_on_page[i];
            let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
            if (this.is_previous_option_wheelset === false) { //transition wheelset -> front wheel
                this.stage_one_options_on_page.set(option_name, null);
                //show all the possible selections in the option box
                let $option_values_object = $(option_object).find('.wb-option');
                $option_values_object.each(function () {
                    $(this).show();
                });
            }
            option_object.show();
        }
        if (this.never_was_in_stage_two === true) { //show/hide this button ONLY if we have never been in stage two before
            this.show_hide_forward_to_stage_two_button();
        }
        this.ajax_post(this.rim_query.get_query(), this.query_api_url.query, this.result_parser);
    }

    show_stage_one_front_rear_options() {
        for (let i = 0; i < this.stage_one_rear_wheel_options_on_page.length; i++) {
            let option_name = this.stage_one_rear_wheel_options_on_page[i];
            if (this.stage_one_options_on_page.have_member(option_name) === false) {
                this.stage_one_options_on_page.set(option_name, null);
            }
            let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
            option_object.show();
        }

        for (let i = 0; i < this.stage_one_front_wheel_options_on_page.length; i++) {
            let option_name = this.stage_one_front_wheel_options_on_page[i];
            // this.remove_option_from_page(option_name);
            if (this.stage_one_options_on_page.have_member(option_name) === false) {
                this.stage_one_options_on_page.set(option_name, null);
            }
            let option_object = this.option_aliases.all_options_on_page_aliased[option_name];
            option_object.show();
        }
        if (this.never_was_in_stage_two === true) { //show/hide this button ONLY if we have never been in stage two before
            this.show_hide_forward_to_stage_two_button();
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

        if (option_name_alias != undefined) { //use '!= undefined' not '!== undefined'
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
            if ((option_name_alias === 'Front_Rim_Choice') || (option_name_alias === 'Front_Rim_Model') ||
                (option_name_alias === 'Rear_Rim_Choice') || (option_name_alias === 'Rear_Rim_Model')) {
                option_values_array = this.find_options_values(option_name_alias);
                initial_query.set(option_name_alias, option_values_array);
                // initial_query.set('inventory_type', 'Rims');
                // initial_query.log("INITIAL QUERY");
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
        if (this.rim_query.has_option('Front_Hole_Count')) {
            this.hub_query.set('Front_Hole_Count', this.rim_query.get('Front_Hole_Count'));
        }
        if (this.rim_query.has_option('Rear_Hole_Count')) {
            this.hub_query.set('Rear_Hole_Count', this.rim_query.get('Rear_Hole_Count'));
        }
        this.hub_query.log('HUb query in after stage 1 filters');
        this.ajax_post(this.hub_query.get_query(),this.query_api_url.query, this.result_parser);
    }

    remove_option_from_page(option_name) {
        let option = this.option_aliases.all_options_on_page_aliased[option_name];
        let $option_values_object = $(option).find('.wb-option');
        // $option_values_object.remove();
        // TODO: remove it or set it to Pick One...?
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

        let $all_swatch_options = this.$parent_page.find('.form-field-swatch');
        $all_swatch_options.each(function () {
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
            // if (parent.all_known_options.indexOf(option_name) < 0) {
            if (!parent.option_aliases.option_alias.hasOwnProperty(option_name)) {
                all_options[option_name] = $(this);
            }
        });
        // swatch
        let $all_swatch_options = this.$parent_page.find('.form-field-swatch');
        $all_swatch_options.each(function () {
            // find name of option
            let option_name = $(this).find('.wb-option-display-name').text();
            option_name = option_name.split(' ').join('_');
            if (!parent.option_aliases.option_alias.hasOwnProperty(option_name)) {
                all_options[option_name] = $(this);
            }

        });
        // textfield
        let $all_text_options = this.$parent_page.find('.form-field-text');
        $all_text_options.each(function () {
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
        let option_name = this.get_name_of_changed_option($changedOption);
        let option_name_alias = this.option_aliases.option_alias[option_name];
        if (this.all_known_hub_options.indexOf(option_name_alias) > -1) {
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

    reset_to_options_default_selection() {
        // on startup of the page or on Reset sets options to their default selections.
        // For instance Intended Application::All
        for (let option_name in this.wb_config.option_default_selection) {
            let option_name_alias = this.option_aliases.option_alias[option_name];
            let $option_object = $(this.option_aliases.all_options_on_page_aliased[option_name_alias]);
            let value_to_select = this.wb_config.option_default_selection[option_name];
            let data_label = 'data-wb-label="' + value_to_select +'"';
            // let data_label = 'data-wb-label="All"';
            let $one_option = $option_object.find('.form-select option['+ data_label + ']');
            $one_option.prop('selected', true);

            this.zeroth_option_to_alternative_name($option_object);

            if (this.stage_one_options_on_page.options.hasOwnProperty(option_name)) {
                this.rim_query.set(option_name, value_to_select);
                this.stage_one_options_on_page.set(option_name, value_to_select);
            } //TODO set for RIM

        }
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


    on_option_change_additional_action($changed_option) {
        // called in prepare_query. Additionaly modifies querey depending on what option is changed
        // for instance resets PEO every time Rear Hub selection is changed
        let option_name = this.get_name_of_changed_option($changed_option);
        let option_name_alias = this.option_aliases.option_alias[option_name];

        if ((option_name_alias === 'Front_Hub') &&
            (!this.special_options.is_special_option_hidden(this.wb_config.front_bearing_upgrade))) {
            this.hub_query.remove(this.wb_config.front_bearing_upgrade);
        }

        if ((option_name_alias === 'Rear_Hub') &&
                   (!this.special_options.is_special_option_hidden(this.wb_config.poe_option_name))) {
            this.hub_query.remove(this.wb_config.poe_option_name);
        }

        if ((option_name_alias === 'Rear_Hub') &&
            (!this.special_options.is_special_option_hidden(this.wb_config.rear_bearing_upgrade))) {
            this.hub_query.remove(this.wb_config.rear_bearing_upgrade);
        }

    }

    reset_query_on_common_to_front_rear_change($changed_option){
        //reset query when the option affecting both front and rear changes
        // Intended_Application
        // Rim_Size
        // Brake_Type

        let wheel_build_type = this.wb_front_rear_selection.get_wheel_build_type();
        // If option that was reset is Intended_Application, and option was reset (selected_index=0)
        // or 'All' was selected (selected_index=1), reset all Stage One options on page

        let option_name = this.get_name_of_changed_option($changed_option);
        let option_name_alias = this.option_aliases.option_alias[option_name];
        let $option_object = $(this.option_aliases.all_options_on_page_aliased[option_name_alias]);
        const $option_values_object = $option_object.find('.form-select');
        const $selected_item = $option_values_object.find(':selected');
        let selected_index = $selected_item.index();

        if ((option_name_alias === 'Intended_Application') && (selected_index <1)) {
            for (let stage_one_option_name in this.stage_one_options_on_page.options) {
                // TODO: this can be solved by unselect option
                this.rim_query.remove(stage_one_option_name);
                this.stage_one_options_on_page.set(stage_one_option_name, null);
                this.reset_option_selection(stage_one_option_name);
                // let real_option_name = this.option_aliases.alias_to_real_name(stage_one_option_name);
                // this.option_reset_buttons.hide(real_option_name);
            }
            this.reset_to_options_default_selection();
        } else if ((option_name_alias === 'Intended_Application') && (selected_index > 1)) {
            // to avoid incompatybile builds, when changing discipline, make sure we have clean rim query
            this.rim_query.remove('Front_Rim_Model');
            this.rim_query.remove('Rear_Rim_Model');
            this.rim_query.remove('Front_Hole_Count');
            this.rim_query.remove('Rear_Hole_Count');
            if (!this.stage_one_options_on_page.all_options_selected()) {
                this.reset_option_selection('Front_Hole_Count');
                this.reset_option_selection('Rear_Hole_Count');
            }
            // this.stage_one_finished = false;
            // } else if ((option_name === 'Rim_Size') && (selected_index > 0) && (wheel_build_type === 'Wheelset')) {
        } else if ((option_name_alias === 'Rim_Size') && (selected_index > 0)) {
            // to avoid incompatybile builds, when changing discipline, make sure we have clean rim query
            this.rim_query.remove('Front_Rim_Model');
            this.rim_query.remove('Rear_Rim_Model');
            this.rim_query.remove('Front_Hole_Count');
            this.rim_query.remove('Rear_Hole_Count');
            if (!this.stage_one_options_on_page.all_options_selected()) {
                this.reset_option_selection('Front_Hole_Count');
                this.reset_option_selection('Rear_Hole_Count');
            }
            // this.stage_one_finished = false;
            // } else if ((option_name === 'Brake_Type') && (selected_index > 0) && (wheel_build_type === 'Wheelset')) {
        } else if ((option_name_alias === 'Brake_Type') && (selected_index > 0) ) {
            // to avoid incompatybile builds, when changing discipline, make sure we have clean rim query
            this.rim_query.remove('Front_Rim_Model');
            this.rim_query.remove('Rear_Rim_Model');
            this.rim_query.remove('Front_Hole_Count');
            this.rim_query.remove('Rear_Hole_Count');
            if (!this.stage_one_options_on_page.all_options_selected()) {
                this.reset_option_selection('Front_Hole_Count');
                this.reset_option_selection('Rear_Hole_Count');
            }
            // this.stage_one_finished = false;
        }
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
            this.option_reset_buttons.show(option_name);
        } else { //user chosen Pick One ...
            //revert name to Pick One...
            this.zeroth_option_alternative_to_default_name($option_values_object);
            // Remove selection from query
            query_object.remove(option_name_alias);
            this.option_reset_buttons.hide(option_name);
            // If the option that was reset was Disc Brake interface, make sure its not
            // pointing to Rim Brake as one of the alternatives
            if((option_name_alias === 'Front_Disc_Brake_Interface') ||
                (option_name_alias === 'Rear_Disc_Brake_Interface')) {
                this.analyze_disc_brake_options();
            }
        }
        this.reset_query_on_common_to_front_rear_change($changed_option);
        this.on_option_change_additional_action($changed_option);

        // this.ajax_post(this.hub_query.get_query(), this.query_api_url.query, this.result_parser);
        if (this.debug_query) {
            query_object.log('Query');
        }
        //TODO here is query is spoke: make double query and post to different url
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

    unselect_query_result_empty_option(option_name) {
        // reset current options to Pick One... and removes its from query and stage options
        // this is called to perform reset of an option when other one is selected ?
        this.reset_option_selection(option_name);
        if (this.stage_one_options_on_page.options.hasOwnProperty(option_name)) {
            this.stage_one_options_on_page.set(option_name, null);
            this.rim_query.remove(option_name);
            // back to stage one? if stage one is true -> back to stage one
        } else if (this.stage_two_options_on_page.options.hasOwnProperty(option_name)) {
            this.stage_two_options_on_page.set(option_name, null);
            this.hub_query.remove(option_name);
            // If Brake Type options were reset, set defaults again
            if ((option_name === 'Front_Disc_Brake_Interface') ||
                (option_name === 'Rear_Disc_Brake_Interface')) {
                this.analyze_disc_brake_options();
            }
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

        }
    }

    find_currently_selected_text_in_option($option_object) {
        // finds label of currently selected value in given option
        const $option_values_object = $option_object.find('.form-select');
        const $selected_item = $option_values_object.find(':selected');
        let value = $selected_item.text();
        return value;
    }

    result_parser(query_result, parent) {
        // parent.check_if_build_is_invalid(query_result);
        if (parent.debug_query) {
            console.log('Query result', query_result);
        }

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
                if (((all_options_on_page_aliased.hasOwnProperty(option_name_alias)))
                    && (query_result.hasOwnProperty(option_name_alias))) {
                    let option = all_options_on_page_aliased[option_name_alias];

                    let option_selector = '.wb-option';
                    let color_swatch_option = false;
                    if ((option_name_alias === 'Front_Rim_Decal' ) || (option_name_alias === 'Rear_Rim_Decal')) {
                        option_selector = '.swatch-wrap';
                        color_swatch_option = true;
                    }

                    let $option_values_object = $(option).find(option_selector);
                    let $empty_option = $(option).find('.wb-empty-option');
                    // $empty_option.hide();
                    let result = query_result[option_name_alias];
                    let selected_name = parent.find_currently_selected_text_in_option($(option));
                    if (result.indexOf(selected_name) < 0) {
                        parent.unselect_query_result_empty_option(option_name_alias);
                        // if empty option ooccured on transtion from stage 1 to stage 2, move back to stage 1
                        if ((parent.stage_one_finished === true) &&
                            (parent.stage_one_options_on_page.options.hasOwnProperty(option_name_alias))) {
                            parent.stage_one_finished = false;
                            parent.back_to_stage_one();
                        }
                    }
                    $option_values_object.each(function () {
                        let name = $(this).text();
                        if (color_swatch_option) {
                            name = $(this).attr('data-swatch-value'); // for string colors eg. Enve Black, Enve Green...
                            // name = $(this).attr('data-wb-swatch-color'); // for hex colors
                        }

                        if (result.indexOf(name) < 0) {
                            // $(this).hide(); // hiding options does not work in Safari in IE
                            if (color_swatch_option) {
                                $(this).hide();
                            } else {
                                $(this).showDropdownOption(false);
                            }
                        } else {
                            // $(this).show(); // showing options does not work in Safari and IE
                            if (color_swatch_option) {
                                $(this).show();
                            } else {
                                $(this).showDropdownOption(true);
                            }
                        }
                    });

                    // if only one option is available, autoselect it
                    // parent.autoselect(option, query_result[option_name_alias])
                }
            }
        }
        if (query_result['inventory_type'] === 'Rims') {
            let build_type = parent.wb_front_rear_selection.get_wheel_build_type();
            special_options.delegate_rim_options_show_hide_to_stage_two(query_result, build_type);
        }
        // see of one need to show special options such as POE etc
        if (parent.stage_two_finished && parent.stage_one_finished) {
            special_options.show_hide(query_result);
        }

        let run_spoke_query = false;
        if (inventory_type === 'Hubs') {
            if (parent.hub_spoke_connector.front_hub_style_changed(query_result)) { //returns true only on change from null to HubStyle
                let hub_style = query_result['Front_Hub_Style'];
                parent.hub_spoke_connector.set_front_hub_style(hub_style);
                run_spoke_query = true;
            }

            if (parent.hub_spoke_connector.rear_hub_style_changed(query_result)) { //returns true only on change from null to HubStyle
                let hub_style = query_result['Rear_Hub_Style'];
                parent.hub_spoke_connector.set_rear_hub_style(hub_style);
                run_spoke_query = true;
            }

            if (run_spoke_query) {
                parent.spoke_query.set('Spoke_Style', parent.hub_spoke_connector.last_spoke_style);
                parent.ajax_post(parent.spoke_query.get_query(), parent.query_api_url.query, parent.result_parser);
            }
        }

         if (inventory_type === 'Spokes') {
            if (parent.hub_spoke_connector.spoke_style_changed(query_result)) {
                let spoke_style = query_result['Spoke_Style'];
                parent.hub_spoke_connector.set_front_hub_style(spoke_style);
                parent.hub_spoke_connector.set_rear_hub_style(spoke_style);
                parent.hub_spoke_connector.set_spoke_style(spoke_style);
                parent.hub_query.set('Rear_Hub_Style', parent.hub_spoke_connector.last_rear_hub_style);
                parent.hub_query.set('Front_Hub_Style', parent.hub_spoke_connector.last_front_hub_style);
                // parent.hub_query.log('Hub query in spokes');
                parent.ajax_post(parent.hub_query.get_query(), parent.query_api_url.query, parent.result_parser);
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
        parent.stage_one_front_rear_options_control();
    }

    reset_option_selection(option_name) {
        // resets current selection in given option
        let option_name_alias = this.option_aliases.option_alias[option_name];
        if (option_name_alias == undefined) {
            option_name_alias = option_name;
        }
        if (this.wb_config.swatch_options.indexOf(option_name_alias) > -1) {
            this.reset_swatch_selection(option_name_alias);
        } else {
            let option = this.option_aliases.all_options_on_page_aliased[option_name_alias];
            this.zeroth_option_alternative_to_default_name($(option));
            let $option_values_object = $(option).find('.wb-empty-option');
            $option_values_object.prop('selected', true);
            this.option_reset_buttons.hide(option_name);
        }
    }

    reset_swatch_selection(option_name) {
        let option = this.option_aliases.all_options_on_page_aliased[option_name];
        let $swatch_object = $(option).find('.swatch-wrap');
        let swatch_values = $swatch_object.find('.swatch-radio');
        $(swatch_values).each(function () {
            // iterate over every swatch input at see if it is checked. If yes, make a reset
            let is_checked = $(this).prop('checked');
            if (is_checked) {
                $(this).prop('checked', false);
            }
        })

    }


    startOver() {
        // Implementation for Start Over button
        for (let option_name in this.all_options_on_page) {
            this.reset_option_selection(option_name);
        }
        // show all options values that were hidden before by the filters
        for (let option_name in this.all_options_on_page) {
            let option_name_alias = this.option_aliases.option_alias[option_name];
            let option = this.option_aliases.all_options_on_page_aliased[option_name_alias];
            let $option_values_object = $(option).find('.wb-option');
            $option_values_object.each(function(){
                // $(this).show(); // for option values does not work in IE and Safari
                $(this).showDropdownOption(true);
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
        this.never_was_in_stage_two = true;
        this.page_in_rim_choice_mode = true;

        this.step_label.set_to_step_one();
        this.$next_button.hide();
        this.$back_button.hide();

        // Emit product-change so prices get updated back to start value
        utils.hooks.emit('product-option-change');
        // Start from scratch
        this.init();
    }

    option_reset_button_clicked(button_id) {
        // resets currently selected option,
        // removes it from query and stages control
        // calls new query
        let button_prefix = 'wb-reset-button-';
        let option_name = button_id.substring(button_prefix.length, button_id.length);
        option_name = option_name.replaceAll(' ', '_');
        let option_name_alias = this.option_aliases.option_alias[option_name];
        let $changed_option = $(this.option_aliases.all_options_on_page_aliased[option_name_alias]);
        this.reset_option_selection(option_name);
        if (this.stage_one_options_on_page.have_member(option_name_alias)) {
            this.stage_one_options_on_page.set(option_name_alias, null);
            this.rim_query.remove(option_name_alias)
        } else if (this.stage_two_options_on_page.have_member(option_name_alias)) {
            this.stage_two_options_on_page.set(option_name_alias, null);
            if (this.hub_query.has_option(option_name_alias)) {
                this.hub_query.remove(option_name_alias);
            } else if (this.spoke_query.has_option(option_name_alias)) {
                this.spoke_query.remove(option_name_alias);
            }
        }

        // option objectsd stored in option_aliases are top-level to $changedOption object that comes from
        // BigCommerce engine when option is changed. Find the proper child option object, to we can
        // use the regular filtering engine.
        let $changedOption = $changed_option.find('.form-select');
        utils.hooks.emit('product-option-change', event, $changedOption);
        this.divide_into_stages_and_query($changedOption);
    }

}




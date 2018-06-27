export default class WheelbuilderQuery {
    constructor(rim_options, hub_options, all_known_options, common_options_roots) {
        this.all_known_rim_options = rim_options;
        this.all_known_hub_options = hub_options;
        this.all_known_options = all_known_options;

        //holds the default value of all the common parameters, defined during initial query
        this.rim_hub_common_defaults = {};
        this.init_rim_hub_common_defaults(common_options_roots);
        this.query = {};
    }

    init_rim_hub_common_defaults(common_options) {
        // Sets format of common options to: {'common_option_1':{}, 'common_option_2': {}}
        for (let i=0; i< common_options.length; i++) {
            this.rim_hub_common_defaults[common_options[i]] = [];
        }
    }

    log(message) {
       if ((typeof message === 'undefined')) {
           message = 'Query ';
       }
       let mongo_query = this.get_query();
       console.log(message, mongo_query);
    }

    is_option_rim(option_name) {
        // check if option has  {prefix}-rim* extension
        // TODO: this should be variable
        let extension = /Rim_Choice/g; //matches {prefix}-rim* expression
        let test = option_name.match(extension);
        return (test) ? (true) : (false);
    }

    is_option_common(option_name) {
        return this.rim_hub_common_defaults.hasOwnProperty(option_name);

    }


    set_common_options_defaults(option_name, value) {
        this.rim_hub_common_defaults[option_name] = value;
    }

    get_common_options_defaults(option_name) {
        return this.rim_hub_common_defaults[option_name];
    }

    revert_common_attributes_values_to_defaults(option_name){
        // Sets values of common_options in query to defaults.
        // If 'option_name' is given sets only chosen option.
        // If 'option_name' is not given, sets to defaults all common_options in queyry
        if (typeof option_name === "undefined") {
            for (let key in this.rim_hub_common_defaults) {
                this.set(key, this.get_common_options_defaults(key));
            }
        } else { // set only specified option
            this.set(option_name, this.get_common_options_defaults(option_name));
        }
    }

    set(option_name, value) {
        if (value.constructor === Array) {
            value = {'$in': value};
        }
        this.query[option_name] = value;
    }
    get(option_name) {
        return this.query[option_name]
    }

    get_query() {
        let mongo_query = {};
        mongo_query['attributes'] = this.all_known_options;
        mongo_query['common_attributes'] = this.rim_hub_common_defaults;
        mongo_query['$and'] = [];
        for (let option_name in this.query){
            if (this.is_option_common(option_name)) {
                mongo_query[option_name] = this.query[option_name];
            } else if (option_name === 'inventory_type'){
                mongo_query[option_name] = this.query[option_name];
            } else {
                let or_1 = {};
                let or_2 = {};
                or_1[option_name] = this.query[option_name];
                or_2[option_name] = {'$exists': false};
                mongo_query['$and'].push({'$or':[or_1, or_2]});
            }

        }
        if (mongo_query['$and'].length === 0) {
            delete mongo_query['$and'];
        }
        return mongo_query;
    }

    remove(option_name) {
        delete this.query[option_name];
        // if (this.is_option_common(option_name)) {
        //     this.revert_common_attributes_values_to_defaults(option_name);
        // }
    }
}
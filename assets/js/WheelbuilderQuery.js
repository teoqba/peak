export default class WheelbuilderQuery {
    constructor(rim_options, hub_options) {
        this.all_known_rim_options = rim_options;
        this.all_known_hub_options = hub_options;
        // TODO this needs to be set
        this.all_known_options = this.all_known_rim_options.concat(this.all_known_hub_options);

        this.rim_hub_common_attribute_values = {};
        this.init_rim_hub_common_attribute_values();
        // defaults hold the default selection of common attributes for given product
        this.rim_hub_common_defaults = JSON.parse(JSON.stringify(this.rim_hub_common_attribute_values));
        this.query = {};
    }

    init_rim_hub_common_attribute_values() {
        // Sets format of common options to: {'common_option_1':{}, 'common_option_2': {}}
        let _this = this;
        let intersection = this.all_known_rim_options.filter(function(n) {
            return _this.all_known_hub_options.indexOf(n) !== -1;
        });
        for (let i=0; i< intersection.length; i++) {
            this.rim_hub_common_attribute_values[intersection[i]] = [];
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
        let extension = /Rims/g; //matches {prefix}-rim* expression
        let test = option_name.match(extension);
        return (test) ? (true) : (false);
    }

    is_option_common(option_name) {
        return this.rim_hub_common_defaults.hasOwnProperty(option_name);

    }

    set_common_attributes_values(option_name, value) {
        this.rim_hub_common_attribute_values[option_name] = value;
    }

    set_common_options_defaults(option_name, value) {
        this.rim_hub_common_defaults[option_name] = value;
    }

    get_common_options_defaults(option_name) {
        return this.rim_hub_common_defaults[option_name];
    }


    revert_common_attributes_values_to_defaults(){
        // Sets values of common_options in query to defaults.
        // If 'option_name' is given sets only chosen option.
        // If 'option_name' is not given, sets to defaults all common_options in queyr
        if (typeof option_name === "undefined") {
            for (let key in this.rim_hub_common_defaults) {
                this.set(key, this.get_common_options_defaults(key));
            }
        } else { // set only specified option
            this.set(option_name, this.get_common_options_defaults(option_name));
        }
        this.rim_hub_common_attribute_values = JSON.parse(JSON.stringify(this.rim_hub_common_defaults));
    }

    set(option_name, value) {
        if (value.constructor === Array) {
            value = {'$in': value};
        }
        this.query[option_name] = value;
    }

    get_query() {
        let mongo_query = {};
        mongo_query['attributes'] = this.all_known_options;
        mongo_query['common_attributes'] = this.rim_hub_common_attribute_values;
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
        if (this.is_option_common(option_name)) {
            this.set_query_common_options_to_defaults(option_name);
        }
    }
}
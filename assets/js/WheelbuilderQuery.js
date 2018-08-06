export default class WheelbuilderQuery {
    constructor(inventory_type, product_attributes_on_page, common_options_roots) {
        this.product_attributes_on_page = product_attributes_on_page;
        this.common_options = common_options_roots;
        this.initial_option_values = {}; // format {option_name: [], option_name1: []}
        this.query = {};
        this.set('inventory_type', inventory_type)
    }

    log(message) {
       if ((typeof message === 'undefined')) {
           message = 'Query ';
       }
       let mongo_query = this.get_query();
       console.log(message, mongo_query);
    }

    set_initial_option_values(option_name, values_list) {
        // for selected option_name sets values to values_list
        // if this option_names will be reset by user, its value will be reverted to values list (see this.remove)
        if (values_list.length > 0) {
            this.initial_option_values[option_name] = values_list;
            // if query does not have given option name set, set it.
            if (!this.query.hasOwnProperty(option_name)) {
                this.set(option_name, values_list);
            }
        }
    }

    is_option_rim(option_name) {
        // check if option has  {prefix}-rim* extension
        // TODO: this should be variable
        let extension = /Rim_Choice/g; //matches {prefix}-rim* expression
        let test = option_name.match(extension);
        return (test) ? (true) : (false);
    }

    is_option_common(option_name) {
        return (this.common_options.indexOf(option_name) > - 1);
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
        mongo_query['attributes'] = this.product_attributes_on_page;
        mongo_query['$and'] = [];
        // if Option is inventory or common options (eg. Hole Count) don't set it as mongo experssion, but make it direct
        for (let option_name in this.query){
            // TODO to implement spokes, put spokes options here
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
        // if option_name has associated initial values, revert this option to these values
        if (this.initial_option_values.hasOwnProperty(option_name)) {
            this.set(option_name, this.initial_option_values[option_name])
        }
    }
}

import WheelbuilderConfig from './WheelbuilderConfig.js';
export default class WheelbuilderWeightQuery {
    constructor() {
        this.front_rim_query = {};
        this.rear_rim_query = {};
        this.front_hub_query = {};
        this.rear_hub_query = {};
        this.allowed_option_names = ['Front_Rim_Model', 'Rear_Rim_Model', 'Front_Hub', 'Rear_Hub'];
        this.rim_optional = ['Rim_Size'];
        this.hub_optional = [];
        this.wb_config = new WheelbuilderConfig();
        this.last_query = [];
        this.query_ready = false;


        this.set('use_sandbox_db', this.wb_config.use_sandbox_db); //use test database environment if True

    }

    set(option_name, value) {


        if (option_name === 'Front_Rim_Model') {
            this.front_rim_query[option_name] = value;
            this.enable_last_query([this.front_rim_query, this.rear_rim_query]);
        } else if (option_name === 'Rear_Rim_Model') {
            this.rear_rim_query[option_name] = value;
            this.enable_last_query([this.front_rim_query,this.rear_rim_query]);
        } else if (option_name === 'Front_Hub') {
            this.front_hub_query[option_name] = value;
            this.enable_last_query([this.front_hub_query, this.rear_hub_query]);
        } else if (option_name === 'Rear_Hub') {
            this.rear_hub_query[option_name] = value;
            this.enable_last_query([this.rear_hub_query, this.rear_hub_query]);
        }

        if (this.rim_optional.indexOf(option_name) > -1) {
            let optional_query = this.make_optional_query(option_name, value);
            this.front_rim_query['$or'] = optional_query;
            this.rear_rim_query['$or'] = optional_query;
            this.enable_last_query([this.front_rim_query, this.rear_rim_query]);
        }

        if (this.hub_optional.indexOf(option_name) > -1) {
            let optional_query = this.make_optional_query(option_name, value);
            this.front_hub_query['$or'] = optional_query;
            this.rear_hub_query['$or'] = optional_query;
            this.enable_last_query([this.rear_hub_query, this.rear_hub_query]);
        }

        if (option_name === 'use_sandbox_db') {
            this.front_rim_query[option_name] = value;
            this.rear_rim_query[option_name] = value;
            this.front_hub_query[option_name] = value;
            this.rear_hub_query[option_name] = value;
        }
    }

    make_optional_query(option_name, value) {
        let or1 = {};
        let or2 = {};
        or1[option_name] = {"$exists": false};
        or2[option_name] = value;
        return [or1, or2]
    }

    enable_last_query(query) {
        this.last_query = query;
        this.query_ready = true;
    }

    is_query_ready() {
        return this.query_ready;
    }

    get_query() {
        this.query_ready = false;
        return this.last_query;
    }


    //
    // log(message) {
    //     if ((typeof message === 'undefined')) {
    //         message = 'Query ';
    //     }
    //     let mongo_query = this.get_query();
    //     console.log(message, mongo_query);
    // }
    //
    // set(option_name, value) {
    //     if (this.allowed_option_names.indexOf(option_name) > -1) {
    //         this.query[option_name] = value;
    //     }
    // }
    //
    // get(option_name) {
    //     return this.query[option_name]
    // }
    //
    // has_option(option_name) {
    //     if (this.query.hasOwnProperty(option_name)) {
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }
    //
    // get_query() {
    //     return this.query;
    // }
    //
    // remove(option_name) {
    //     delete this.query[option_name];
    // }
}

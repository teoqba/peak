import WheelbuilderConfig from './WheelbuilderConfig.js';
export default class WheelbuilderWeightQuery {
    constructor() {
        this.front_rim_query = {'Front_Rim_Model': {"$exists": true}, 'query_type':'Front_Rim_Model'};
        this.rear_rim_query = {'Rear_Rim_Model': {"$exists": true}, 'query_type':'Rear_Rim_Model'};
        this.front_hub_query = {'Front_Hub': {"$exists": true}, 'query_type':'Front_Hub'};
        this.rear_hub_query = {'Rear_Hub': {"$exists": true}, 'query_type':'Rear_Hub'};
        this.spoke_query = {'Spoke_Type': {"$exists": true}, 'query_type':'Spoke_Type'};
        this.nipple_query = {'Nipple_Type': {"$exists": true}, 'query_type':'Nipple_Type'};
        this.rim_optional = ['Rim_Size'];
        this.hub_optional = ['Drivetrain_Type'];
        this.spoke_optional = ['Spoke_Color'];
        this.wb_config = new WheelbuilderConfig();
        this.last_query = [];
        this.query_ready = false;


        this.set('use_sandbox_db', this.wb_config.use_sandbox_db); //use test database environment if True

    }

    set(option_name, value) {

        if (option_name === 'use_sandbox_db') {
            this.front_rim_query[option_name] = value;
            this.rear_rim_query[option_name] = value;
            this.front_hub_query[option_name] = value;
            this.rear_hub_query[option_name] = value;
            this.spoke_query[option_name] = value;
            this.nipple_query[option_name] = value;
        }
        // check if Pick One.../ Reset selection/Option Reset button were pressed

        if ((value === this.wb_config.zeroth_option_alternative_name) || (value === this.wb_config.zeroth_option_default_name)) {
            value = {"$exists": true}
        }

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
            this.enable_last_query([this.front_hub_query, this.rear_hub_query]);
        } else if (option_name === 'Spoke_Type') {
            this.spoke_query[option_name] = value;
            this.enable_last_query([this.spoke_query]);
        } else if (option_name === 'Nipple_Type') {
            this.nipple_query[option_name] = this.get_nipple_type(value);
            this.enable_last_query([this.nipple_query]);
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
            this.enable_last_query([this.front_hub_query, this.rear_hub_query]);
        }

        if (this.spoke_optional.indexOf(option_name) > -1) {
            let optional_query = this.make_optional_query(option_name, value);
            this.spoke_query['$or'] = optional_query;
            this.enable_last_query([this.spoke_query]);
        }

    }

    reset_query_on_build_change(type) {
        // Called when the build type change between Front Rim/ Rear Rim/ Wheelset
        if ((type === 'front_rim') && (this.front_rim_query.hasOwnProperty('Front_Rim_Model'))){
            this.front_rim_query['Front_Rim_Model'] =  {"$exists": true};
        } else if ((type == 'rear_rim') && (this.rear_rim_query.hasOwnProperty('Rear_Rim_Model'))) {
            this.rear_rim_query['Rear_Rim_Model'] =  {"$exists": true};
        }
    }

    reset(option_name) {
        if ((this.front_rim_query.hasOwnProperty(option_name)) && (option_name === "Front_Rim_Model")) {
            this.front_rim_query[option_name] = {"$exists": true}
        }

        if (this.front_rim_query.hasOwnProperty('$or')) {
            if (this.front_rim_query['$or'][0].hasOwnProperty(option_name)) {
                delete this.front_rim_query['$or'];
            }
        }


        if ((this.rear_rim_query.hasOwnProperty(option_name)) && (option_name === "Rear_Rim_Model")) {
            this.rear_rim_query[option_name] = {"$exists": true}
        }

        if (this.rear_rim_query.hasOwnProperty('$or')) {
            if (this.rear_rim_query['$or'][0].hasOwnProperty(option_name)) {
                delete this.rear_rim_query['$or'];
            }
        }


        if ((this.front_hub_query.hasOwnProperty(option_name)) && (option_name === "Front_Hub")) {
                this.front_hub_query[option_name] = {"$exists": true}
        }

        if (this.front_hub_query.hasOwnProperty('$or')) {
            if (this.front_hub_query['$or'][0].hasOwnProperty(option_name)) {
                delete this.front_hub_query['$or'];
            }
        }

       if ((this.rear_hub_query.hasOwnProperty(option_name)) && (option_name === "Rear_Hub")) {
                this.rear_hub_query[option_name] = {"$exists": true};
        }

        if (this.rear_hub_query.hasOwnProperty('$or')) {
            if (this.rear_hub_query['$or'][0].hasOwnProperty(option_name)) {
                delete this.rear_hub_query['$or'];
            }
        }

        if ((this.spoke_query.hasOwnProperty(option_name)) && (option_name === "Spoke_Type")) {
            this.spoke_query[option_name] = {"$exists": true};
        }

        if (this.spoke_query.hasOwnProperty('$or')) {
            if (this.spoke_query['$or'][0].hasOwnProperty(option_name)) {
                delete this.spoke_query['$or'];
            }
        }

        if ((this.nipple_query.hasOwnProperty(option_name)) && (option_name === "Nipple_Type")) {
            this.nipple_query[option_name] = {"$exists": true}
        }


        this.enable_last_query([this.front_rim_query, this.rear_rim_query, this.rear_hub_query, this.front_hub_query,
            this.spoke_query, this.nipple_query]);
    }

    make_optional_query(option_name, value) {
        let or1 = {};
        let or2 = {};
        or1[option_name] = {"$exists": false};
        or2[option_name] = value;
        return [or1, or2]
    }

    make_optional_reset(option_name) {
        let or1 = {};
        let or2 = {};
        or1[option_name] = {"$exists": false};
        or2[option_name] = {"$exists": true};
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

    get_nipple_type(selected_nipple) {
        // In database nipples are stored as Alloy or Brass without color.
        // This method strips color from the selected name
        if (typeof selected_nipple === 'object') {
            return selected_nipple;
        }

        if (selected_nipple.includes("Alloy")) {
            return "Alloy"
        } else if (selected_nipple.includes("Brass")) {
            return "Brass"
        } else {
            return selected_nipple
        }
    }
}

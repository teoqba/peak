export default class WheelbuilderQuery {
    constructor() {
        this.all_known_rim_options = ['Hole_Count', 'Rims', 'Material', 'Style', 'Rim_Compatibility', 'Dimensions'];
        this.all_known_hub_options = ['Hubs', 'Hole_Count', 'Color', 'Type', 'Compatibility', 'Axle'];
        this.all_known_options = this.all_known_rim_options.concat(this.all_known_hub_options);
        this.rim_hub_common_options = {};
        this.init_rim_hub_common_option();

        this.query = {}
        this.query['Rims'] = {};
        this.query['Hubs'] = {};
        this.query['rim_attributes'] = this.all_known_rim_options;
        this.query['hub_attributes'] = this.all_known_hub_options;
        this.query['common_attributes'] = this.rim_hub_common_options;
    }

    init_rim_hub_common_option() {
        // returns JSON {'common_option_1':{}, 'common_option_2': {}}
        let _this = this;
        let intersection = this.all_known_rim_options.filter(function(n) {
            return _this.all_known_hub_options.indexOf(n) !== -1;
        });
        for (let i=0; i< intersection.length; i++) {
            this.rim_hub_common_options[intersection[i]] = {}
        }
    }

    log(message) {
       if ((typeof message === 'undefined')) {
           message = 'Query ';
       }
       console.log(message, this.query);
    }

    option_is_rim(option_name) {
        // check if option has  {prefix}-rim* extension
        let extension = /Rims/g; //matches {prefix}-rim* expression
        let test = option_name.match(extension);
        return (test) ? (true) : (false);
    }

    get_option_type(option_name) {
        // returns 'common', 'Rims' or 'Hubs'
        if (this.option_is_rim(option_name)) return 'Rims';
        if ((this.all_known_rim_options.indexOf(option_name) > -1) &&
            (this.all_known_hub_options.indexOf(option_name) > -1)) {
            return 'common';
        } else if (this.all_known_rim_options.indexOf(option_name) > -1) {
            return 'Rims';
        } else if (this.all_known_hub_options.indexOf(option_name) > -1) {
            return 'Hubs';
        } else {
            return null;
        }
    }

    set_defaults(option_name, value) {
        this.rim_hub_common_options[option_name] = value;
    }

    set(option_name, value) {
        if (value.constructor === Array) {
            value = {'$in':value};
        }
        let option_type = this.get_option_type(option_name);
        if (option_type === null) {
            console.log('Unrecognized option');
            return;
        }
        if (option_type === 'common') {
            this.query['Rims'][option_name] = value;
            this.query['Hubs'][option_name] = value;
        } else {
            this.query[option_type][option_name] = value;
        }
    }

    get_common_options_defaults(option_name) {
        return this.rim_hub_common_options[option_name];
    }

    set_common_options_defaults(option_name) {
        let defaults = this.get_common_options_defaults(option_name)
        this.set(option_name, defaults);
    }

    remove(option_name) {
        let option_type = this.get_option_type(option_name);
        if (option_type === null) {
            console.log('Unrecognized option');
            return;
        }
        if (option_type === 'common') {
            // set defaults?
            delete this.query['Rims'][option_name];
            delete this.query['Hubs'][option_name];
            this.set_common_options_defaults(option_name);

        } else {
            delete this.query[option_type][option_name];
        }
    }
}
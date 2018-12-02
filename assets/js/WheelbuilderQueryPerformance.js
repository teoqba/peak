
export default class WheelbuilderQueryPerformance {
    constructor() {
        this.n_queries = 0;
        this.total_time = 0; // im ms
        this.average_time = 0; // in ms
        this.t_s = 0; // in ms
        this.lonqest_request = 0; //in ms
    }

    start() {
        this.t_s = performance.now();
    }

    stop() {
        if (this.t_s !== 0) {
            this.n_queries += 1;
            let now = performance.now();
            this.total_time += (now - this.t_s);
            this.lonqest_request = Math.max(now - this.t_s, this.lonqest_request);
            this.average_time = this.total_time / this.n_queries;
            this.t_s = 0;
            console.log('Average query time: ',this.average_time/1000., 'Longest query', this.lonqest_request/1000.)
        } else{
            console.log('Performance measure was not started');
        }

    }
    reset() {
        this.constructor();
    }

}

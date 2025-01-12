const _ = require("lodash");
const path = require('path')
const RepeaterBook = require("./RepeaterBook");
const { sortedUniq, readFile, writeFile, jsonify, debug } = require("./Utils");

class RepeaterExtractor {

  constructor(config) {
    this.config = config
    this.rb = new RepeaterBook(config.repeater_book);;
  }

  async getRepeaterResultSet({props}) {
    
    const {
      states,
    } = props; 

    const repeaterResultSet = [];
    let result;
    
    for (const state of states) {
      if (this.config.use_cache) {
        const file = path.resolve(__dirname, "../", "cache",`state.${state}.json`);
        debug(1)(`Checking cache file: ${file} for state: ${state}`);
        try {
          result = await readFile(file);
        } catch(err) {
          result = await this.rb.getRepeatersByState({
            state,
          });
          await writeFile(file, jsonify(result));
        }
      } else {
        result = await this.rb.getRepeatersByState({
          state,
        });
      }
      console.log(this.rb.getUniq(result.results));
      repeaterResultSet.push(result.results);
    }

    return repeaterResultSet;
  }

  async extract({props}) {
   
    const {
      filters,
    } = props; 
    
  //      {counties: ["Bonner","Kootenai"]},
  //      {cities: ["Sandpoint"]},//subsequent filters are recursively reduced
  //      {cities: ["Sandpoint","Kalispell"], counties: ["Kootenai"]},//same level filters join the data
   
    let rsResult = await this.getRepeaterResultSet({props});

    console.log(props, rsResult);

    for (const filter of filters) {
      const { repeatersMerged, count } = this.rb.getRepeaters(rsResult, filter);
      debug(1)(`Got ${count} from filter: ${jsonify(filter)}`);
      rsResult = [repeatersMerged];
    }

    rsResult = rsResult[0];

    console.log(_.map(rsResult, this.rb.getRepeaterString));

    console.log(rsResult.length);

  }
}

module.exports = RepeaterExtractor;

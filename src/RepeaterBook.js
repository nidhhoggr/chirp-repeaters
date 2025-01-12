const https = require('https');
const { sortedUniq, debug } = require("./Utils");
const states = require("./states");
const hash = require('object-hash');
const _ = require("lodash");

class RepeaterBook {

  static states = _.invert(states);

  static fields = {
    city: "Nearest City",
    county: "County",
    frequency: "Frequency"
  };

  static bandRanges = {
    "10m": ["28","29.7"],
    "6m": ["50","54"],
    "2m": ["144","148"],
    "1.25m": ["222","225"],
    "70cm": ["420","450"],
    "33cm": ["902","928"],
    "23cm": ["1240","1300"],
  };

  constructor(config) {
    this.config = config;
  }

  getRepeatersByState(props) {
    return this.getResponse(this.getRequestPath(props));
  }

  getRequestPath(props) {

    let path = "";

    if (props.state && RepeaterBook.states[props.state]) {
      path = path + "state_id=" + RepeaterBook.states[props.state];
    }

    return path;
  }

  getResponse(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "www.repeaterbook.com",
        path: "/api/export.php?" + path,
        headers: {
          "User-Agent": this.config.userAgent,
        }
      }
      console.log(options);
      https.get(options, (res) => {
        let data = '';

        // Collect response data
        res.on('data', (chunk) => {
          data += chunk;
        });

        // Parse JSON once the response is complete
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (error) {
            console.error('Error parsing JSON:', error);
            reject(error);
          }
        }).on('error', (error) => {
          console.error('Request error:', error);
          reject(error);
        });
      });
    });
  }

  getUniq(repeaterResult) {

    const frequencies = sortedUniq(repeaterResult, RepeaterBook.fields.frequency);

    const bandFreqMappings = {};

    for (const band in RepeaterBook.bandRanges) {
      const bandRange = RepeaterBook.bandRanges[band];
      for (const freq of frequencies) {
        if (parseFloat(freq) >= parseFloat(bandRange[0]) && parseFloat(freq) <= parseFloat(bandRange[1])) {
          if (!bandFreqMappings[band]) {
            bandFreqMappings[band] = 1;
          } else {
            bandFreqMappings[band]++;
          }
        }
      }
    }

    return {
      county: sortedUniq(repeaterResult, RepeaterBook.fields.county),
      city: sortedUniq(repeaterResult, RepeaterBook.fields.city),
      bands: _.keys(bandFreqMappings),
      bandsCount: bandFreqMappings,
    }
  }


  /**
   * Loop through the result set
   * then loop through each repeater to check if it's in
   * the band(s) filter
   * the cit(y/ies) filter
   */
  getRepeaters(repeaterResultSet, filter) {

    const repeaterMappings = {};
    const repeatersMerged = [];
    const repeaterHashes = {};

    const collectIntoMerged = (repeater) => {
      const repeaterHash = hash(repeater);
      if (!repeaterHashes[repeaterHash]) {
        repeaterHashes[repeaterHash] = 1;
        repeatersMerged.push(repeater);
      }
    };

    for (const results of repeaterResultSet) {

      if (_.get(filter, "bands.length", 0) > 0) {
        for (const band of filter.bands) {
          const bandRange = RepeaterBook.bandRanges[band]; 
          for (const repeater of results) {
            const freq = repeater.Frequency;
            if (parseFloat(freq) >= parseFloat(bandRange[0]) && parseFloat(freq) <= parseFloat(bandRange[1])) {
              
              repeater.band = band;
              
              //we have to do this because 1.25m will result in a nested object delimited by the period
              const bandKey = _.replace(band,'.','_');
              if (!_.get(repeaterMappings, `bands.${bandKey}`)) {
                _.set(repeaterMappings, `bands.${bandKey}`, [repeater]);
              } 
              else {
                repeaterMappings.bands[bandKey].push(repeater);
              }
              
              collectIntoMerged(repeater);
            }
          }
        }        
      }
 
      if (_.get(filter, "counties.length", 0) > 0) {
        for (const repeater of results) {
          for (const county of filter.counties) {
            const rCounty = _.toLower(repeater[RepeaterBook.fields.county]);
            if (rCounty == _.toLower(county)) {
              if (!_.get(repeaterMappings, `counties.${rCounty}`)) {
                _.set(repeaterMappings, `counties.${rCounty}`, [repeater]);
              } 
              else {
                repeaterMappings.counties[rCounty].push(repeater);
              }
              
              collectIntoMerged(repeater);
            }
          }
        }        
      }
   
      if (_.get(filter, "cities.length", 0) > 0) {
        for (const repeater of results) {
          for (const city of filter.cities) {
            const nCity = _.toLower(repeater[RepeaterBook.fields.city]);
            if (nCity == _.toLower(city)) {
              if (!_.get(repeaterMappings, `cities.${nCity}`)) {
                _.set(repeaterMappings, `cities.${nCity}`, [repeater]);
              } 
              else {
                repeaterMappings.cities[nCity].push(repeater);
              }
              
              collectIntoMerged(repeater);
            }
          }
        }        
      }

    }

    return {
      repeaterMappings,
      repeatersMerged,
      count: repeatersMerged.length,
    };
  }

  getRepeaterString(repeater) {
    return `${repeater.Callsign} ${repeater[RepeaterBook.fields.city]} ${repeater[RepeaterBook.fields.county]} ${repeater.State} ${repeater[RepeaterBook.fields.frequency]} (${repeater.band})`;
  }

}

module.exports = RepeaterBook;

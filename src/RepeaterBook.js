const https = require('https');
const { sortedUniq } = require("./Utils");
const states = require("./states");
const _ = require("lodash");

class RepeaterBook {

  static states = _.invert(states);

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

  getByStateAndBand(props) {
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

    const { results } = repeaterResult;

    const frequencies = sortedUniq(results, "Frequency");

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
      county: sortedUniq(results, "County"),
      city: sortedUniq(results, "Nearest City"),
      bands: _.keys(bandFreqMappings),
      bandsCount: bandFreqMappings,
    }
  }
}

module.exports = RepeaterBook;

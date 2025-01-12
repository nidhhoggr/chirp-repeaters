const _ = require("lodash");
const { debug } = require("./Utils");

class ChirpTransformer {

  rows = [];

  transform(repeaters) {
    this.rows = [];
    for (const i in repeaters) {
      const repeater = repeaters[i];
      let offset = "0.000000";
      let duplex = "off";
      if (repeater["Input Freq"] && repeater["Frequency"]) {
        offset = _.round(repeater["Input Freq"] - repeater["Frequency"], 2);
        duplex = (offset >= 0) ? "+" : "-";
      }
      this.rows.push({
        "Location": parseInt(i) + 1,
        "Name": repeater["Callsign"],
        "Frequency": repeater["Frequency"],
        "Duplex": duplex,
        "Offset": Math.abs(offset),
        "Tone": "Tone",
        "rToneFreq": _.get(repeater, "PL", "0.0"),
        "cToneFreq": _.get(repeater, "TSQ", "0.0"),
        "DtcsCode": "023",
        "DtcsPolarity": "NN",
        "RxDtcsCode": "023",
        "CrossMode": "Tone->Tone",
        "Mode": repeater["FM Analog"] == "Yes" ? "FM" : "NFM",
        "TStep": "5.0",
        "Power": "8.0W",
      });
    }
    return this;
  }

  toCsv() {
    const csvContentArray = [_.join(_.keys(this.rows[0]), ",")];
    for (const row of this.rows) {
      csvContentArray.push(_.join(_.values(row), ","));
    }
    return _.join(csvContentArray, "\n");
  }
}

module.exports = ChirpTransformer;

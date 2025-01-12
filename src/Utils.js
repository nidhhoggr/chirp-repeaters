const fsPromise = require('fs/promises');
const _ = require('lodash');
const util = require('util');

function readFile(file) {
	return fsPromise.readFile(file)
		.then(data => JSON.parse(data))
}

function writeFile(file, contents) {
	return fsPromise.writeFile(file, contents);
}

function jsonify(object) {
  return JSON.stringify(object, null, 4);
}

function sortedUniq(collection, property) {
  return _.sortedUniq(_.map(_.sortBy(collection, property), property));
}

function parseArgCSVRequired(position, argName) {
  const requiredArg = process.argv[position];
  const parsed = _.split(requiredArg,",");
  if (parsed.length == 1 && !parsed[0]) {
    debug(0)(`Must provide a ${argName}`);
    process.exit(1);
  }
  return parsed;
}

let debugLevel = 1;
if (process.env.DEBUG) {
  debugLevel = parseInt(process.env.DEBUG);
}

const debug = (level) => {
  if (level <= debugLevel) {
    return function() {
      console.log("\n", ...arguments);
    }
  } else {
    return () => {}
  }
}

console.nested = function(object) {
  console.log(util.inspect(object, { depth: null }));
}

module.exports = {
	readFile,
	writeFile,
  jsonify,
  sortedUniq,
  debug,
  parseArgCSVRequired,
}

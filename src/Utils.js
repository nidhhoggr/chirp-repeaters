const fsPromise = require('fs/promises');
const _ = require('lodash');

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

module.exports = {
	readFile,
	writeFile,
  jsonify,
  sortedUniq
}

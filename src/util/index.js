const fs = require("fs");
const { promisify } = require("util");

const readDir = promisify(fs.readdir);

function flatten(arr) {
  return arr.reduce(function(flat, toFlatten) {
    return flat.concat(
      Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten
    );
  }, []);
}

function listFiles(dir) {
  return readDir(dir);
}

function arrayDiff(destinationArray = [], oldArray = []) {
  const added = destinationArray.filter(el => !oldArray.includes(el));
  const removed = oldArray.filter(el => !destinationArray.includes(el));
  return { added, removed };
}

module.exports = { flatten, listFiles, arrayDiff };

const parser = require('fast-xml-parser');

const request = require('request-promise-native');
const crypto = require('crypto');

const { ampacheApi: { url: baseUrl } } = require('../config');

function sha256(str = '') {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function xmlRequest(url = '', ...rest) {
  const res = await request(`${baseUrl}${url}`, ...rest);
  return parser.parse(res, { ignoreAttributes : false });
}

module.exports = { sha256, xmlRequest };
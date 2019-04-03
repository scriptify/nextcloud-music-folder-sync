const { sha256, xmlRequest } = require('./util');

const { ampacheApi: { username: usernameConfig, password: passwordConfig } } = require('../config');

async function handshake({ username = usernameConfig, password = passwordConfig } = {}) {
  const now = Math.round(Date.now() / 1000);
  const passphrase = sha256(`${now}${sha256(password)}`);
  const { root: { auth } } = await xmlRequest(`?action=handshake&auth=${passphrase}&timestamp=${now}&version=350001&user=${username}`);
  return auth;
}

async function getAllSongs({ authKey = '' }) {
  const { root: { song } } = await xmlRequest(`?action=search_songs&auth=${authKey}&limit=none`);
  return song;
}

async function createPlaylist({ authKey = '', name = '' }) {
  const res = await xmlRequest(`?action=playlist_create&auth=${authKey}&limit=none&name=${name}`);
  return res;
}

async function listPlaylists({ authKey }) {
  const { root: { playlist } } = await xmlRequest(`?action=playlists&auth=${authKey}&limit=none`);
  return playlist;
}

module.exports = { getAllSongs, handshake, createPlaylist, listPlaylists };
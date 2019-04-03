const request = require("request-promise-native");
const stringSimilarity = require("string-similarity");
const path = require("path");

const { flatten, listFiles, arrayDiff } = require("../util");

const {
  musicServer: { url },
  nextCloud: { username, password },
  musicFolder
} = require("../config");

function headers() {
  const basicAuth =
    "Basic " + Buffer.from(username + ":" + password).toString("base64");
  const headers = {
    authorization: basicAuth,
    "OCS-APIREQUEST": true,
    Accept: "application/json"
  };
  return headers;
}

function createPlaylist({ name = "" }) {
  const reqUrl = `${url}/playlists`;
  return request(reqUrl, {
    method: "POST",
    json: true,
    headers: headers(),
    body: { name }
  });
}

function listPlaylists() {
  const reqUrl = `${url}/playlists`;
  return request(reqUrl, {
    headers: headers(),
    json: true
  });
}

async function getAllTracks() {
  const { hash } = await request(`${url}/prepare_collection`, {
    method: "POST",
    headers: headers(),
    json: true,
    body: []
  });
  const collection = await request(`${url}/collection?hash=${hash}`, {
    headers: headers(),
    json: true
  });

  const inCorrectForm = collection.map(({ albums }) => {
    return albums.map(({ tracks }) => tracks);
  });
  return flatten(inCorrectForm);
}

async function removePlaylist({ id = 0 }) {
  return request(`${url}/playlists/${id}`, {
    method: "DELETE",
    headers: headers(),
    json: true,
    body: { id }
  });
}

async function addToPlaylist({ songId = 0, playlistId }) {
  return request(`${url}/playlists/${playlistId}/add`, {
    method: "POST",
    headers: headers(),
    json: true,
    body: { trackIds: songId }
  });
}

async function removeFromPlaylist({ songIndice, playlistId }) {
  return request(`${url}/playlists/${playlistId}/remove`, {
    method: "POST",
    headers: headers(),
    json: true,
    body: { indices: songIndice }
  });
}

async function syncPlaylistsWithMusicFolder() {
  // Sync playlist structure
  const genreFolders = await listFiles(musicFolder);
  const playlists = await listPlaylists();
  const playlistNames = playlists.map(p => p.name);
  const { added: playlistsToAdd, removed: playlistsToRemove } = arrayDiff(
    genreFolders,
    playlistNames
  );
  const removePromises = playlistsToRemove.map(toRemoveName => {
    const { id } = playlists.find(p => p.name === toRemoveName);
    return removePlaylist({ id });
  });
  await Promise.all(removePromises);
  const addPromises = playlistsToAdd.map(toAddName => {
    return createPlaylist({ name: toAddName });
  });
  await Promise.all(addPromises);

  // Add songs to playlists
  const allTracksOnline = await getAllTracks();
  const allTracksOnlineNames = allTracksOnline.map(t => t.title);

  let songsToAdd = [];
  for (const folder of genreFolders) {
    const genreFolderPath = path.join(musicFolder, folder);
    const genreTracks = await listFiles(genreFolderPath);

    const trackIds = genreTracks.map(trackName => {
      if (!trackName) return null;
      const { bestMatchIndex } = stringSimilarity.findBestMatch(
        trackName,
        allTracksOnlineNames
      );
      const bestMatchTrack = allTracksOnline[bestMatchIndex];
      return {
        ...bestMatchTrack,
        addTo: folder
      };
    });
    songsToAdd.push(trackIds);
  }

  songsToAdd = flatten(songsToAdd);

  // Request newly because it may have changed
  const songsSyncRes = [];
  const currentOnlinePlaylists = await listPlaylists();
  for (const playlist of currentOnlinePlaylists) {
    const { trackIds: oldList } = playlist;
    const newList = songsToAdd
      .filter(s => s.addTo === playlist.name)
      .map(t => t.id);
    const { added: addSongs, removed: removeSongs } = arrayDiff(
      newList,
      oldList
    );

    const indicesToRemove = removeSongs.map(idToFind =>
      oldList.findIndex(id => id === idToFind)
    );
    for (const index of indicesToRemove) {
      await removeFromPlaylist({ songIndice: index, playlistId: playlist.id });
    }
    for (const songId of addSongs) {
      await addToPlaylist({ songId, playlistId: playlist.id });
    }

    songsSyncRes.push({
      removed: indicesToRemove.length,
      added: addSongs.length
    });
  }
  console.log(
    `Removed ${songsSyncRes.reduce(
      (acc, el) => acc + el.removed,
      0
    )} Track(s) from different Playlists`
  );
  console.log(
    `Added ${songsSyncRes.reduce(
      (acc, el) => acc + el.added,
      0
    )} Track(s) to different Playlists`
  );

  console.log(`Removed ${removePromises.length} Playlist(s)`);
  console.log(`Added ${addPromises.length} Playlist(s)`);
}

module.exports = {
  createPlaylist,
  listPlaylists,
  getAllTracks,
  syncPlaylistsWithMusicFolder,
  removePlaylist,
  addToPlaylist,
  removeFromPlaylist
};

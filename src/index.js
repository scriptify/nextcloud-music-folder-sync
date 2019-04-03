const { syncPlaylistsWithMusicFolder } = require("./music-server-api");

async function main() {
  // const res = await createPlaylist({ name: "NodeJS!" });
  // console.log(res);
  // const playlists = await listPlaylists();
  // console.log(playlists);
  // const allTracks = await getAllTracks();
  // console.log(allTracks);
  // const allFiles = await listFiles(musicFolder);
  // console.log(allFiles);
  syncPlaylistsWithMusicFolder();
  setInterval(() => {
    syncPlaylistsWithMusicFolder();
  }, 1000 * 60 * 2);
}

main();

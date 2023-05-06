const mapDBToModel = ({
  id,
  playlist_id,
  user_id,
}) => ({
  id,
  playlistId: playlist_id,
  userId: user_id,
});

module.exports = { mapDBToModel };

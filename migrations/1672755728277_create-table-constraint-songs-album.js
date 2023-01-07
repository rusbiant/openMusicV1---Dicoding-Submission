/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addConstraint('songs', 'fk_songs_albums', 'FOREIGN KEY("albumId") REFERENCES albums(id) ON DELETE CASCADE');
};

exports.down = pgm => {
  pgm.dropConstraint('songs', 'fk_songs_albums');
};

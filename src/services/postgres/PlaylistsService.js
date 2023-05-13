const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlist VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };
    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('playlist gagal  ditambahkann');
    }
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlist.id, playlist.name, users.username FROM playlist
      LEFT JOIN users ON users.id = playlist.owner
      LEFT JOIN collaborations ON collaborations.playlist_id = playlist.id
      WHERE playlist.owner = $1 OR collaborations.user_id = $1`,
      values: [owner],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getPlaylistById(playlistId) {
    const query = {
      text: 'SELECT * FROM playlist WHERE id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows[0];
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlist WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('playlist gagal dihapus. id tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlistId, songId) {
    const id = `songplaylist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('lagu gagal ditambahkan ke dalam playlist');
    }
    return result.rows[0].id;
  }

  async getSongFromPlaylist(playlistId) {
    const queryPlaylist = {
      text: 'SELECT * FROM playlist WHERE id = $1',
      values: [playlistId],
    };

    const queryUser = {
      text: `SELECT users.username FROM users 
      LEFT JOIN playlist ON users.id = playlist.owner
      WHERE playlist.id = $1 `,
      values: [playlistId],
    };
    const querySongs = {
      text: `SELECT songs.id, songs.title, songs.performer FROM songs 
      LEFT JOIN playlist_songs ON songs.id = playlist_songs.song_id 
      WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };

    const resultPlaylist = await this._pool.query(queryPlaylist);
    const resultUser = await this._pool.query(queryUser);
    const resultSongs = await this._pool.query(querySongs);

    if (!resultPlaylist.rows.length) {
      throw new NotFoundError('playlist tidak ditemukan');
    }
    return {
      id: resultPlaylist.rows[0].id,
      name: resultPlaylist.rows[0].name,
      username: resultUser.rows[0].username,
      songs: resultSongs.rows,
    };
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 returning id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('lagu gagal di hapus');
    }
  }

  async verifySongInPlaylist(songId) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [songId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu belum terdaftar');
    }
    return result.rows[0];
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlist WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('anda tidak berhak mengkases resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }

  async addPlaylistActivities(playlistId, songId, userId, action) {
    const id = `activity-${nanoid(16)}`;
    const timestamp = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, timestamp],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menyimpan aktivitas playlist');
    }
    return result.rows;
  }

  async getPlaylistActivities(playlistId) {
    const query = {
      text: `SELECT users.username, songs.title, playlist_song_activities.action, playlist_song_activities.time
      FROM playlist_song_activities LEFT JOIN playlist
      ON playlist_song_activities.playlist_id = playlist.id
      LEFT JOIN songs ON playlist_song_activities.song_id = songs.id
      LEFT JOIN users ON playlist_song_activities.user_id = users.id
      WHERE playlist.id =$1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('playlist tidak ditemukan');
    }
    return result.rows;
  }
}

module.exports = PlaylistsService;

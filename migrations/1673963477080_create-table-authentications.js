/* eslint-disable camelcase */

const { addTypeAttribute } = require("node-pg-migrate/dist/operations/types");

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('authentications', {
    token: {
      type: "TEXT",
      notNull: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('authentications');
};


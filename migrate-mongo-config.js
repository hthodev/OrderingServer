const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  mongodb: {
    url: process.env.MONGODB_URI,            // đã có sẵn dbname trong URI
    options: { serverSelectionTimeoutMS: 10000 },
  },
  migrationsDir: path.resolve(__dirname, 'migrations'), // <-- THƯ MỤC CHỈ CHỨA MIGRATIONS
  changelogCollectionName: 'migrations_changelog',
  migrationFileExtension: '.js',
  moduleSystem: 'commonjs',
};

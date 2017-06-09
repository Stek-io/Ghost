var KnexMigrator = require('knex-migrator'),
    config = require('../../config'),
    errors = require('../../errors'),
    models = require('../../models');

module.exports.check = function healthCheck() {
    var knexMigrator = new KnexMigrator({
        knexMigratorFilePath: config.get('paths:appRoot')
    });

    return knexMigrator.isDatabaseOK()
        .catch(function (outerErr) {
            if (outerErr.code === 'DB_NOT_INITIALISED') {
                throw outerErr;
            }

            // CASE: migration table does not exist, figure out if database is compatible
            return models.Settings.findOne({key: 'databaseVersion', context: {internal: true}})
                .then(function (response) {
                    // CASE: no db version key, database is compatible
                    if (!response) {
                        throw outerErr;
                    }

                    throw new errors.DatabaseVersionError({
                        message: 'Your database version is not compatible with Ghost 1.0.0 Beta (master branch)',
                        context: 'Want to keep your DB? Use Ghost < 1.0.0 or the "stable" branch. Otherwise please delete your DB and restart Ghost.',
                        help: 'More information on the Ghost 1.0.0 Alpha at https://docs.ghost.org/v1.0.0/docs/alpha-and-beta-versions'
                    });
                })
                .catch(function (err) {
                    // CASE: settings table does not exist
                    if (err.errno === 1 || err.errno === 1146) {
                        throw outerErr;
                    }

                    throw err;
                });
        });
};

/**
 * DAE Access Hook: what the delegated admin may do on a user.
 *
 * - Read (open the user, devices, logs): the users of the admin's
 *   organizations (the Filter Hook only hides the others from the list).
 * - Change (edit, delete, block, password…): only in the organizations where
 *   the admin holds the organization role "admin"; where they are "member",
 *   read-only. Memberships and roles read live from Auth0, never from the
 *   app_metadata cache.
 * - "Delegated Admin - Auditor": read-only everywhere.
 *
 * Template: `npm run config` writes the version to paste, with the Management
 * API credentials, to dae-hooks/generated/ (git-ignored).
 */
function (ctx, callback) {
  var request = require('request');
  var DOMAIN = '__MANAGEMENT_DOMAIN__';
  var CLIENT_ID = '__CLIENT_ID__';
  var CLIENT_SECRET = '__CLIENT_SECRET__';
  // Organization role giving the right to manage the organization's users
  var MANAGER_ORG_ROLE = 'admin';
  var READ_ACTIONS = ['read:user', 'read:devices', 'read:logs'];

  var token;

  function call(options) {
    return new Promise(function (resolve, reject) {
      request(options, function (err, res, body) {
        if (err) return reject(err);
        if (res.statusCode >= 400) {
          return reject(new Error((body && body.message) || 'Auth0 error ' + res.statusCode));
        }
        resolve(body);
      });
    });
  }

  function api(path) {
    return call({
      method: 'GET',
      url: 'https://' + DOMAIN + '/api/v2' + path,
      headers: { Authorization: 'Bearer ' + token },
      json: true
    });
  }

  function getToken() {
    return call({
      method: 'POST',
      url: 'https://' + DOMAIN + '/oauth/token',
      json: {
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        audience: 'https://' + DOMAIN + '/api/v2/'
      }
    }).then(function (body) { token = body.access_token; });
  }

  // Organizations of a user (live): [{ id, name }]
  function organizationsOf(userId) {
    return api('/users/' + encodeURIComponent(userId) + '/organizations?per_page=100');
  }

  // Names of the organizations where the user holds MANAGER_ORG_ROLE (live)
  function managedOrganizations(userId) {
    var id = encodeURIComponent(userId);
    return organizationsOf(userId).then(function (orgs) {
      return Promise.all(orgs.map(function (org) {
        return api('/organizations/' + org.id + '/members/' + id + '/roles?per_page=100').then(function (roles) {
          return roles.some(function (role) { return role.name === MANAGER_ORG_ROLE; }) ? org.name : null;
        });
      }));
    }).then(function (names) { return names.filter(Boolean); });
  }

  var admin = ctx.request.user || {};
  var meta = admin.app_metadata || {};
  var adminOrganizations = Array.isArray(meta.organizations) ? meta.organizations : [];
  var targetUser = ctx.payload.user || {};
  var target = targetUser.app_metadata || {};
  var targetOrganizations = Array.isArray(target.organizations) ? target.organizations : [];

  var shared = targetOrganizations.some(function (name) {
    return adminOrganizations.indexOf(name) !== -1;
  });
  if (!shared) {
    return callback(new Error('You can only manage the users of your organizations.'));
  }

  if (READ_ACTIONS.indexOf(ctx.payload.action) !== -1) {
    return callback();
  }
  if (meta.dae_role === 'Delegated Admin - Auditor') {
    return callback(new Error('Auditors have read-only access.'));
  }

  // A change: an organization of the user that the admin manages
  getToken()
    .then(function () {
      return Promise.all([managedOrganizations(admin.user_id || admin.sub), organizationsOf(targetUser.user_id)]);
    })
    .then(function (results) {
      var managed = results[0];
      var allowed = results[1].some(function (org) { return managed.indexOf(org.name) !== -1; });
      if (!allowed) {
        return callback(new Error('Read-only: you are not an admin of this user\'s organizations.'));
      }
      callback();
    })
    .catch(function (err) { callback(err); });
}

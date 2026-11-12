/**
 * DAE Memberships Query Hook: the organizations offered when creating a user.
 *
 * The organizations where the admin holds the organization role "admin" (read
 * live from Auth0): the "Memberships" field of the Create User dialog,
 * renamed "Organization" by the Settings Query Hook; hidden when there is a
 * single one. Where the admin is "member", they cannot create users.
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

  // Names of the organizations where the user holds MANAGER_ORG_ROLE (live)
  function managedOrganizations(userId) {
    var id = encodeURIComponent(userId);
    return api('/users/' + id + '/organizations?per_page=100').then(function (orgs) {
      return Promise.all(orgs.map(function (org) {
        return api('/organizations/' + org.id + '/members/' + id + '/roles?per_page=100').then(function (roles) {
          return roles.some(function (role) { return role.name === MANAGER_ORG_ROLE; }) ? org.name : null;
        });
      }));
    }).then(function (names) { return names.filter(Boolean); });
  }

  var admin = ctx.payload.user || {};
  getToken()
    .then(function () { return managedOrganizations(admin.user_id || admin.sub); })
    .then(function (managed) { callback(null, { createMemberships: false, memberships: managed }); })
    .catch(function (err) { callback(err); });
}

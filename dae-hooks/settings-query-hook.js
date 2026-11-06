/**
 * DAE Settings Query Hook: the dashboard and the user forms of the delegated
 * admin.
 *
 * - Users are created in the tenant's users database only.
 * - Create form: organization (Memberships Query Hook), organization role
 *   (member, admin), application role (the roles of the admin's applications,
 *   read from Auth0), DAE role (never above the admin's own).
 * - Edit form ("Change Profile"): application role and DAE role.
 * - List: organizations and application roles of each user (app_metadata
 *   cache kept by the Admin UI, Terraform and the Write Hook).
 *
 * Template: `npm run config` writes the version to paste, with the Management
 * API credentials, to dae-hooks/generated/ (git-ignored).
 */
function (ctx, callback) {
  var request = require('request');
  var DOMAIN = '__MANAGEMENT_DOMAIN__';
  var CLIENT_ID = '__CLIENT_ID__';
  var CLIENT_SECRET = '__CLIENT_SECRET__';
  var USERS_CONNECTION = '__USERS_CONNECTION__';

  // DAE roles from the least to the most powerful
  var DAE_ROLES = [
    'Delegated Admin - Auditor',
    'Delegated Admin - User',
    'Delegated Admin - Operator',
    'Delegated Admin - Administrator'
  ];

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
    }).then(function (body) { return body.access_token; });
  }

  var admin = ctx.request.user || {};
  var meta = admin.app_metadata || {};
  var organizations = Array.isArray(meta.organizations) ? meta.organizations : [];
  var applications = Array.isArray(meta.apps) ? meta.apps : [];
  var adminLevel = DAE_ROLES.indexOf(meta.dae_role);

  var daeRoleOptions = [{ value: '', label: 'No DAE role' }].concat(
    DAE_ROLES.filter(function (role, level) { return level <= adminLevel; })
      .map(function (role) { return { value: role, label: role }; })
  );
  var orgRoleOptions = [
    { value: 'member', label: 'Member (reads the organization)' },
    { value: 'admin', label: 'Admin (also manages the organization)' }
  ];

  // Shown in the users list (stringified: they run in the browser)
  var showRoles = (function (user) {
    var roles = (user.app_metadata && user.app_metadata.roles) || {};
    var names = [];
    Object.keys(roles).forEach(function (app) {
      Object.keys(roles[app]).forEach(function (scope) {
        (roles[app][scope] || []).forEach(function (role) { names.push(role.name); });
      });
    });
    return names.join(', ');
  }).toString();
  var showOrganizations = (function (user) {
    var organizations = user.app_metadata && user.app_metadata.organizations;
    return Array.isArray(organizations) ? organizations.join(', ') : '';
  }).toString();

  getToken()
    .then(function (token) {
      return call({
        method: 'GET',
        url: 'https://' + DOMAIN + '/api/v2/roles?per_page=100',
        headers: { Authorization: 'Bearer ' + token },
        json: true
      });
    })
    .then(function (roles) {
      // Application roles: "<application>:<role>", for the admin's applications
      var appRoleOptions = [{ value: '', label: 'No application role' }].concat(
        roles
          .map(function (role) { return role.name; })
          .filter(function (name) {
            return applications.some(function (app) { return name.indexOf(app + ':') === 0; });
          })
          .sort()
          .map(function (name) { return { value: name, label: name }; })
      );

      callback(null, {
        connections: [USERS_CONNECTION],
        // No title: the extension's own ("DAE Demo")
        dict: {
          memberships: 'Organization',
          menuName: admin.name
        },
        canCreateUser: organizations.length > 0 && meta.dae_role !== 'Delegated Admin - Auditor',
        userFields: [
          {
            property: 'app_metadata.organizations',
            label: 'Organizations',
            display: showOrganizations,
            search: { display: showOrganizations, listOrder: 2, listSize: '20%' },
            edit: false,
            create: false
          },
          {
            property: 'app_metadata.roles',
            label: 'Application roles',
            display: showRoles,
            search: { display: showRoles, listOrder: 3, listSize: '25%' },
            edit: false,
            create: false
          },
          // One InputSelectCombo only: its options load through react-select's
          // Async cache, shared by every InputSelectCombo of the form (a second
          // one would show the first one's options). The others: InputCombo
          {
            property: 'app_metadata.org_role',
            label: 'Organization role',
            display: false,
            create: { type: 'select', component: 'InputCombo', options: orgRoleOptions, required: true },
            edit: false
          },
          {
            property: 'app_metadata.app_role',
            label: 'Application role',
            display: false,
            create: { type: 'select', component: 'InputSelectCombo', options: appRoleOptions, required: false },
            edit: { type: 'select', component: 'InputSelectCombo', options: appRoleOptions, required: false }
          },
          {
            property: 'app_metadata.dae_role',
            label: 'DAE role',
            create: { type: 'select', component: 'InputCombo', options: daeRoleOptions, required: false },
            edit: { type: 'select', component: 'InputCombo', options: daeRoleOptions, required: false }
          }
        ]
      });
    })
    .catch(function (err) { callback(err); });
}

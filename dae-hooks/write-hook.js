/**
 * DAE Write Hook: user creation and profile changes by the delegated admin,
 * with the demo's access model (same result as the Admin UI).
 *
 * CREATE: the hook creates the account itself through the Management API, in
 * the users database: membership of the chosen organization with its
 * organization role (member, admin), the application role and the DAE role
 * held directly, then the app_metadata role cache. The DAE runs this hook
 * before creating the user, so it cannot add a membership to a user it has
 * not created yet: the hook ends with a message (shown as an error by the
 * DAE) instead of letting the DAE create a second account.
 *
 * UPDATE ("Change Profile"): replaces the application role and the DAE role,
 * then rebuilds the app_metadata role cache.
 *
 * The admin only creates users in their own organizations, and never gives a
 * DAE role above their own. Role and organization IDs are looked up by name:
 * no customer-specific value, the same hook serves every customer.
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
  var ORG_ROLES = ['member', 'admin'];

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

  function api(method, path, body) {
    return call({
      method: method,
      url: 'https://' + DOMAIN + '/api/v2' + path,
      headers: { Authorization: 'Bearer ' + token },
      json: body === undefined ? true : body
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

  // Select fields may come as { value, label }
  function valueOf(field) {
    return field && typeof field === 'object' ? field.value : field || '';
  }

  function findRole(name) {
    return api('GET', '/roles?per_page=100&name_filter=' + encodeURIComponent(name)).then(function (roles) {
      var role = roles.filter(function (r) { return r.name === name; })[0];
      if (!role) throw new Error('Unknown role: ' + name);
      return role;
    });
  }

  // app_metadata cache of the role assignments, rebuilt from Auth0 like the
  // Admin UI does: roles[app][organization | "_direct"], apps, organizations
  function syncRoleMetadata(userId) {
    var id = encodeURIComponent(userId);
    var roles = {};
    function add(scope, role) {
      var parts = role.name.split(':');
      if (parts.length < 2) return; // organization and DAE roles: no application
      var app = parts[0];
      roles[app] = roles[app] || {};
      roles[app][scope] = roles[app][scope] || [];
      roles[app][scope].push({ name: role.name, permission: role.description || '' });
    }
    return Promise.all([
      api('GET', '/users/' + id + '/roles?per_page=100'),
      api('GET', '/users/' + id + '/organizations?per_page=100')
    ]).then(function (results) {
      results[0].forEach(function (role) { add('_direct', role); });
      var orgs = results[1];
      return Promise.all(orgs.map(function (org) {
        return api('GET', '/organizations/' + org.id + '/members/' + id + '/roles?per_page=100')
          .then(function (orgRoles) { orgRoles.forEach(function (role) { add(org.name, role); }); });
      })).then(function () {
        return api('PATCH', '/users/' + id, {
          app_metadata: {
            roles: roles,
            apps: Object.keys(roles),
            organizations: orgs.map(function (org) { return org.name; })
          }
        });
      });
    });
  }

  // Replaces the user's direct roles whose name matches `isManaged` by `name`
  function replaceDirectRole(userId, isManaged, name) {
    var id = encodeURIComponent(userId);
    return api('GET', '/users/' + id + '/roles?per_page=100').then(function (current) {
      var remove = current.filter(function (role) { return isManaged(role.name); })
        .map(function (role) { return role.id; });
      var removing = remove.length ? api('DELETE', '/users/' + id + '/roles', { roles: remove }) : Promise.resolve();
      return removing.then(function () {
        if (!name) return;
        return findRole(name).then(function (role) {
          return api('POST', '/users/' + id + '/roles', { roles: [role.id] });
        });
      });
    });
  }

  var admin = ctx.request.user || {};
  var adminMeta = admin.app_metadata || {};
  var adminOrganizations = Array.isArray(adminMeta.organizations) ? adminMeta.organizations : [];
  var adminApps = Array.isArray(adminMeta.apps) ? adminMeta.apps : [];
  var adminLevel = DAE_ROLES.indexOf(adminMeta.dae_role);

  var fields = ctx.payload.app_metadata || {};
  var appRole = valueOf(fields.app_role);
  var daeRole = valueOf(fields.dae_role);
  var orgRole = valueOf(fields.org_role) || 'member';

  if (appRole && !adminApps.some(function (app) { return appRole.indexOf(app + ':') === 0; })) {
    return callback(new Error('You cannot give a role of this application.'));
  }
  if (daeRole && DAE_ROLES.indexOf(daeRole) > adminLevel) {
    return callback(new Error('You cannot give a DAE role above your own.'));
  }
  var isAppRole = function (name) {
    return adminApps.some(function (app) { return name.indexOf(app + ':') === 0; });
  };
  var isDaeRole = function (name) { return DAE_ROLES.indexOf(name) !== -1; };

  if (ctx.method === 'create') {
    // Errors shown as they are (no prefix: see the Settings Query Hook)
    var fail = function (message) {
      return callback(new Error('\u274C Could not create the user: ' + message));
    };
    var organization = (ctx.payload.memberships && ctx.payload.memberships[0]) || adminOrganizations[0];
    if (adminOrganizations.indexOf(organization) === -1) {
      return fail('you can only create users in your organizations.');
    }
    if (ORG_ROLES.indexOf(orgRole) === -1) {
      return fail('unknown organization role ' + orgRole + '.');
    }

    var userId;
    return getToken()
      .then(function () {
        return api('POST', '/users', {
          connection: USERS_CONNECTION,
          email: ctx.payload.email,
          password: ctx.payload.password,
          user_metadata: ctx.payload.user_metadata || {},
          app_metadata: daeRole ? { dae_role: daeRole } : {}
        });
      })
      .then(function (user) {
        userId = user.user_id;
        return Promise.all([
          api('GET', '/organizations/name/' + encodeURIComponent(organization)),
          findRole(orgRole)
        ]);
      })
      .then(function (results) {
        var org = results[0];
        var role = results[1];
        return api('POST', '/organizations/' + org.id + '/members', { members: [userId] }).then(function () {
          return api('POST', '/organizations/' + org.id + '/members/' + encodeURIComponent(userId) + '/roles', { roles: [role.id] });
        });
      })
      .then(function () {
        var direct = [appRole, daeRole].filter(Boolean);
        return Promise.all(direct.map(findRole)).then(function (roles) {
          if (!roles.length) return;
          return api('POST', '/users/' + encodeURIComponent(userId) + '/roles', {
            roles: roles.map(function (role) { return role.id; })
          });
        });
      })
      .then(function () { return syncRoleMetadata(userId); })
      .then(function () {
        // Not an error: stops the DAE from creating a second account
        callback(new Error(
          '\u2705 User created: ' + ctx.payload.email + ', ' + orgRole + ' of ' + organization +
          (appRole ? ', ' + appRole : ', no application access') + '. Close this window and refresh the list.'
        ));
      })
      .catch(function (err) { fail(err.message); });
  }

  if (ctx.method === 'update') {
    var original = ctx.request.originalUser || {};
    var originalOrganizations = (original.app_metadata && original.app_metadata.organizations) || [];
    var shared = originalOrganizations.some(function (name) {
      return adminOrganizations.indexOf(name) !== -1;
    });
    if (!original.user_id || !shared) {
      return callback(new Error('You can only manage the users of your organizations.'));
    }

    return getToken()
      .then(function () { return replaceDirectRole(original.user_id, isAppRole, appRole); })
      .then(function () { return replaceDirectRole(original.user_id, isDaeRole, daeRole); })
      .then(function () { return syncRoleMetadata(original.user_id); })
      .then(function () {
        // Applied by the DAE: the profile fields and the DAE role mirror
        // (app_role is a form field only, the roles are the source of truth)
        callback(null, {
          user_metadata: ctx.payload.user_metadata,
          app_metadata: { dae_role: daeRole || null }
        });
      })
      .catch(function (err) { callback(err); });
  }

  return callback(new Error('Unsupported operation: ' + ctx.method));
}

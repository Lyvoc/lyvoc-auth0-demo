/**
 * DAE Access Hook: what the delegated admin may do on a user.
 *
 * Only the users of the admin's own organizations (the Filter Hook only hides
 * the others from the list). The "Delegated Admin - Auditor" role is read-only.
 */
function (ctx, callback) {
  var meta = (ctx.request.user && ctx.request.user.app_metadata) || {};
  var adminOrganizations = Array.isArray(meta.organizations) ? meta.organizations : [];
  var target = (ctx.payload.user && ctx.payload.user.app_metadata) || {};
  var targetOrganizations = Array.isArray(target.organizations) ? target.organizations : [];

  var shared = targetOrganizations.some(function (name) {
    return adminOrganizations.indexOf(name) !== -1;
  });
  if (!shared) {
    return callback(new Error('You can only manage the users of your organizations.'));
  }

  var readOnly = ['read:user', 'read:devices', 'read:logs'];
  if (meta.dae_role === 'Delegated Admin - Auditor' && readOnly.indexOf(ctx.payload.action) === -1) {
    return callback(new Error('Auditors have read-only access.'));
  }

  return callback();
}

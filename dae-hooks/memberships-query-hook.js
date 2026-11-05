/**
 * DAE Memberships Query Hook: the organizations offered when creating a user.
 *
 * The admin's own organizations (the "Memberships" field of the Create User
 * dialog, renamed "Organization" by the Settings Query Hook; hidden when the
 * admin has a single organization).
 */
function (ctx, callback) {
  var meta = (ctx.payload.user && ctx.payload.user.app_metadata) || {};
  var organizations = Array.isArray(meta.organizations) ? meta.organizations : [];
  return callback(null, { createMemberships: false, memberships: organizations });
}

/**
 * DAE Filter Hook: the users the delegated admin sees.
 *
 * The users of the admin's own organizations (app_metadata.organizations, the
 * cache kept by the Admin UI and Terraform). No customer-specific value: the
 * same hook serves every customer of the tenant.
 */
function (ctx, callback) {
  var meta = (ctx.request.user && ctx.request.user.app_metadata) || {};
  var organizations = Array.isArray(meta.organizations) ? meta.organizations : [];

  if (organizations.length === 0) {
    return callback(new Error('You are not a member of any organization.'));
  }

  var query = organizations
    .map(function (name) { return 'app_metadata.organizations:"' + name + '"'; })
    .join(' OR ');
  return callback(null, '(' + query + ')');
}

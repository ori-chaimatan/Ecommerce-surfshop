interface Context {
  params: { id: string };
  request: { body?: Record<string, unknown> };
  badRequest: (message: string) => unknown;
}

interface UsersPermissionsPlugin {
  controllers: {
    contentmanageruser: {
      update: (ctx: Context) => Promise<unknown>;
    };
  };
}

const GUARDED_FIELDS = ['username', 'email', 'provider', 'firstName', 'lastName', 'resetPasswordToken'];

module.exports = (plugin: UsersPermissionsPlugin) => {
  const originalUpdate = plugin.controllers.contentmanageruser.update;

  plugin.controllers.contentmanageruser.update = async (ctx: Context) => {
    const body = ctx.request.body ?? {};
    const password = body.password;

    if (password != null && password !== '') {
      return ctx.badRequest(
        'Password changes are not allowed from the Admin panel. Use the self-service reset-password flow.'
      );
    }

    const current = await strapi
      .db.query('plugin::users-permissions.user')
      .findOne({ where: { documentId: ctx.params.id } });
      
    strapi.log.info(
      `[admin lockdown] ctx.params.id=${ctx.params.id} current=${current ? `found (documentId=${current.documentId})` : 'NOT FOUND'}`
    );

    if (!current) {
      return ctx.badRequest('Unable to verify the current user record — update rejected.');
    }

    const changedField = GUARDED_FIELDS.find(
      (field) => field in body && body[field] !== current[field]
    );

    if (changedField) {
      strapi.log.info(
        `[admin lockdown] rejected on "${changedField}": submitted=${JSON.stringify(body[changedField])} current=${JSON.stringify(current[changedField])}`
      );
      return ctx.badRequest(
        `Only the role can be changed from the Admin panel. "${changedField}" cannot be changed here.`
      );
    }

    return originalUpdate(ctx);
  };

  return plugin;
};

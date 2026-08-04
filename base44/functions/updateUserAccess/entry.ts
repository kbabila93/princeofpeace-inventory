import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();
    if (!currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (currentUser.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const { userId, permissions, role } = body;

    if (!userId) return Response.json({ error: 'userId is required' }, { status: 400 });

    const updateData = {};
    if (Array.isArray(permissions)) updateData.permissions = permissions;
    if (role === 'admin' || role === 'user') updateData.role = role;

    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.User.update(userId, updateData);
    return Response.json({ success: true, user: { id: updated.id, permissions: updated.permissions, role: updated.role } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
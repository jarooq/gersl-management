import { DeviceRegistration } from '../models/index.js';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError
} from '../middleware/error.middleware.js';

// ============================================
// REGISTER / REFRESH a device for the current user
// Body: { deviceId, platform, pushToken?, appVersion? }
// ============================================
export const registerDevice = asyncHandler(async (req, res) => {
  const { deviceId, platform, pushToken, appVersion } = req.body || {};
  if (!deviceId) throw new BadRequestError('deviceId is required');

  const [row, created] = await DeviceRegistration.findOrCreate({
    where: { userId: req.user.id, deviceId },
    defaults: {
      userId: req.user.id,
      deviceId,
      platform: platform || null,
      pushToken: pushToken || null,
      appVersion: appVersion || null,
      lastSeen: new Date(),
      isActive: true
    }
  });
  if (!created) {
    await row.update({
      platform: platform ?? row.platform,
      pushToken: pushToken ?? row.pushToken,
      appVersion: appVersion ?? row.appVersion,
      lastSeen: new Date(),
      isActive: true
    });
  }
  res.json({ success: true, data: { device: row, created } });
});

export const unregisterDevice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const row = await DeviceRegistration.findByPk(id);
  if (!row) throw new NotFoundError('Device not found');
  if (row.userId !== req.user.id && req.user.role !== 'Admin') {
    throw new BadRequestError('Cannot unregister another user\'s device');
  }
  await row.update({ isActive: false });
  res.json({ success: true });
});

export const listMyDevices = asyncHandler(async (req, res) => {
  const rows = await DeviceRegistration.findAll({
    where: { userId: req.user.id },
    order: [['lastSeen', 'DESC']]
  });
  res.json({ success: true, data: { devices: rows } });
});

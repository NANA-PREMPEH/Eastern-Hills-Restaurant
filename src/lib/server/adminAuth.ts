export class AdminAuthError extends Error {}

const getConfiguredAdminPin = () => {
  return process.env.ADMIN_PIN?.trim() || process.env.VITE_ADMIN_PIN?.trim() || '';
};

export const assertAdminAuthorized = (providedPin: string | undefined) => {
  const configuredPin = getConfiguredAdminPin();

  if (!configuredPin) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
      throw new AdminAuthError(
        'Admin authentication is not configured. Set ADMIN_PIN on the server.'
      );
    }

    return;
  }

  if (!providedPin || providedPin.trim() !== configuredPin) {
    throw new AdminAuthError('The admin PIN is invalid.');
  }
};

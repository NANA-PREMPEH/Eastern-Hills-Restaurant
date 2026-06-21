import React from 'react';
import { LockKeyhole, ShieldCheck, X } from 'lucide-react';

interface StaffAccessModalProps {
  errorMessage: string;
  hasConfiguredPin: boolean;
  isOpen: boolean;
  helperText?: string;
  loginDescription?: string;
  loginTitle?: string;
  pin: string;
  pinConfirmation: string;
  setupDescription?: string;
  setupTitle?: string;
  submitLoginLabel?: string;
  submitSetupLabel?: string;
  usesEnvironmentPin: boolean;
  onClose: () => void;
  onPinChange: (value: string) => void;
  onPinConfirmationChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function StaffAccessModal({
  errorMessage,
  hasConfiguredPin,
  helperText,
  isOpen,
  loginDescription,
  loginTitle,
  pin,
  pinConfirmation,
  setupDescription,
  setupTitle,
  submitLoginLabel,
  submitSetupLabel,
  usesEnvironmentPin,
  onClose,
  onPinChange,
  onPinConfirmationChange,
  onSubmit,
}: StaffAccessModalProps) {
  if (!isOpen) {
    return null;
  }

  const isSetupMode = !hasConfiguredPin;
  const resolvedTitle = isSetupMode ? (setupTitle ?? 'Create Staff PIN') : (loginTitle ?? 'Staff Login');
  const resolvedDescription = isSetupMode
    ? (setupDescription ?? 'Set a private PIN for staff access on this device.')
    : (loginDescription ?? 'Enter the hidden staff PIN to manage dishes and prices.');
  const resolvedHelperText =
    helperText ??
    (usesEnvironmentPin
      ? 'This app is using the staff PIN from VITE_ADMIN_PIN in your environment settings.'
      : 'Staff can open this hidden login by tapping the restaurant name 5 times quickly or pressing Ctrl+Shift+A on desktop.');
  const resolvedSubmitLabel = isSetupMode
    ? (submitSetupLabel ?? 'Save PIN & Open')
    : (submitLoginLabel ?? 'Open Admin');

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center space-x-3">
            <div className="rounded-2xl bg-red-50 p-3 text-red-600">
              {isSetupMode ? <ShieldCheck className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{resolvedTitle}</h3>
              <p className="mt-1 text-sm text-slate-500">{resolvedDescription}</p>
            </div>
          </div>

          <button
            id="btn_staff_access_close"
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close staff login"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label
              htmlFor="input_staff_pin"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              {isSetupMode ? 'Create PIN' : 'Staff PIN'}
            </label>
            <input
              id="input_staff_pin"
              type="password"
              value={pin}
              onChange={(event) => onPinChange(event.target.value)}
              placeholder={isSetupMode ? 'Create a staff PIN' : 'Enter staff PIN'}
              autoComplete={isSetupMode ? 'new-password' : 'current-password'}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            />
          </div>

          {isSetupMode && (
            <div>
              <label
                htmlFor="input_staff_pin_confirm"
                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Confirm PIN
              </label>
              <input
                id="input_staff_pin_confirm"
                type="password"
                value={pinConfirmation}
                onChange={(event) => onPinConfirmationChange(event.target.value)}
                placeholder="Re-enter the PIN"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
              />
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
            {resolvedHelperText}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              id="btn_staff_access_cancel"
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              id="btn_staff_access_submit"
              type="submit"
              className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              {resolvedSubmitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

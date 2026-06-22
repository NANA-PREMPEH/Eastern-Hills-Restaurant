/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  CarFleetApiError,
  CarFleetApiUnavailableError,
  RemoteCarImageUploadPayload,
  uploadRemoteCarImage,
} from '../lib/carFleetApi';
import {
  AlertCircle,
  ArrowLeft,
  Car,
  CheckCircle2,
  Eye,
  EyeOff,
  Edit2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { CarListing } from '../data/carFleet';

interface CarRentalAdminPortalProps {
  adminPin: null | string;
  carFleet: CarListing[];
  onAdd: (car: CarListing) => Promise<void> | void;
  onClose: () => void;
  onDelete: (id: string) => Promise<void> | void;
  onUpdate: (car: CarListing) => Promise<void> | void;
}

type Transmission = CarListing['transmission'];
type VehicleType = CarListing['type'];

const VEHICLE_TYPES: VehicleType[] = ['Saloon', 'SUV', 'Minivan', 'Pickup', 'Executive'];
const TRANSMISSIONS: Transmission[] = ['Automatic', 'Manual'];
const COLOR_OPTIONS = [
  { label: 'Blue', value: 'from-blue-600 to-blue-800' },
  { label: 'Amber', value: 'from-amber-600 to-amber-800' },
  { label: 'Emerald', value: 'from-emerald-600 to-emerald-800' },
  { label: 'Slate', value: 'from-slate-700 to-slate-900' },
  { label: 'Red', value: 'from-red-600 to-red-800' },
  { label: 'Orange', value: 'from-orange-600 to-orange-800' },
];

const isCarEnabled = (car: CarListing) => car.enabled !== false;

const getDefaultDraft = () => ({
  colorClass: COLOR_OPTIONS[0].value,
  dailyRate: '350',
  enabled: true,
  emoji: '🚗',
  featuresText: 'Air Conditioning, Bluetooth',
  image: '',
  name: '',
  seats: '5',
  transmission: 'Automatic' as Transmission,
  type: 'Saloon' as VehicleType,
});

export default function CarRentalAdminPortal({
  adminPin,
  carFleet,
  onAdd,
  onClose,
  onDelete,
  onUpdate,
}: CarRentalAdminPortalProps) {
  const [draft, setDraft] = useState(getDefaultDraft);
  const [draftUpload, setDraftUpload] = useState<null | RemoteCarImageUploadPayload>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<null | { text: string; type: 'error' | 'success' }>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  const activeColorLabel = useMemo(() => {
    return COLOR_OPTIONS.find((option) => option.value === draft.colorClass)?.label ?? 'Custom';
  }, [draft.colorClass]);

  const enabledVehicleCount = useMemo(() => {
    return carFleet.filter(isCarEnabled).length;
  }, [carFleet]);

  const resetForm = () => {
    setDraft(getDefaultDraft());
    setDraftUpload(null);
    setEditingId(null);
  };

  const showFeedback = (text: string, type: 'error' | 'success') => {
    setFeedback({ text, type });
    window.setTimeout(() => {
      setFeedback((current) => (current?.text === text ? null : current));
    }, 3000);
  };

  const handleDraftChange = (field: keyof ReturnType<typeof getDefaultDraft>, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleEdit = (car: CarListing) => {
    setEditingId(car.id);
    setDraft({
      colorClass: car.colorClass,
      dailyRate: String(car.dailyRate),
      enabled: isCarEnabled(car),
      emoji: car.emoji,
      featuresText: car.features.join(', '),
      image: car.image ?? '',
      name: car.name,
      seats: String(car.seats),
      transmission: car.transmission,
      type: car.type,
    });
    setDraftUpload(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showFeedback('Car image must be under 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      setDraft((current) => ({
        ...current,
        image: dataUrl,
      }));
      setDraftUpload({
        contentType: file.type || 'image/jpeg',
        dataUrl,
        fileName: file.name,
      });
      showFeedback('Car image selected. It will upload when you save the vehicle.', 'success');
    };
    reader.onerror = () => {
      showFeedback('Unable to read the car image.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const buildCarPayload = () => {
    const name = draft.name.trim();
    const dailyRate = Number(draft.dailyRate);
    const seats = Number(draft.seats);
    const features = draft.featuresText
      .split(',')
      .map((feature) => feature.trim())
      .filter(Boolean);

    if (!name) {
      throw new Error('Enter the vehicle name.');
    }

    if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
      throw new Error('Enter a valid daily rate.');
    }

    if (!Number.isFinite(seats) || seats <= 0) {
      throw new Error('Enter a valid seat count.');
    }

    if (features.length === 0) {
      throw new Error('Add at least one feature.');
    }

    if (!draft.emoji.trim()) {
      throw new Error('Enter an emoji or a short icon symbol for the vehicle.');
    }

    return {
      colorClass: draft.colorClass,
      dailyRate,
      enabled: draft.enabled,
      emoji: draft.emoji.trim(),
      features,
      id: editingId ?? `car_${Date.now()}`,
      image: draft.image.trim() || undefined,
      name,
      seats,
      transmission: draft.transmission,
      type: draft.type,
    } satisfies CarListing;
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      let finalImage = draft.image.trim() || undefined;

      if (draftUpload) {
        if (!adminPin) {
          showFeedback('Please log in again before saving an uploaded image.', 'error');
          return;
        }

        try {
          finalImage = await uploadRemoteCarImage(draftUpload, adminPin);
        } catch (error) {
          if (error instanceof CarFleetApiUnavailableError) {
            finalImage = draftUpload.dataUrl;
            showFeedback(
              'Backend upload is unavailable, so this vehicle image will only persist locally.',
              'error'
            );
          } else if (error instanceof CarFleetApiError) {
            showFeedback(error.message, 'error');
            return;
          } else {
            showFeedback('Image upload failed. Please try again.', 'error');
            return;
          }
        }
      }

      const payload = {
        ...buildCarPayload(),
        image: finalImage,
      };

      if (editingId) {
        await onUpdate(payload);
        showFeedback(`Updated ${payload.name}.`, 'success');
      } else {
        await onAdd(payload);
        showFeedback(`Added ${payload.name} to the fleet.`, 'success');
      }

      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save this vehicle.';
      showFeedback(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (car: CarListing) => {
    const confirmed = window.confirm(`Remove ${car.name} from the car rental portal?`);
    if (!confirmed) {
      return;
    }

    try {
      await onDelete(car.id);
      if (editingId === car.id) {
        resetForm();
      }
      showFeedback(`Removed ${car.name}.`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to remove this vehicle.';
      showFeedback(message, 'error');
    }
  };

  const handleToggleAvailability = async (car: CarListing) => {
    const nextEnabled = !isCarEnabled(car);

    try {
      await onUpdate({
        ...car,
        enabled: nextEnabled,
      });

      if (editingId === car.id) {
        setDraft((current) => ({ ...current, enabled: nextEnabled }));
      }

      showFeedback(
        `${car.name} ${nextEnabled ? 'is now visible to customers.' : 'has been disabled from the customer view.'}`,
        'success'
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update this vehicle status.';
      showFeedback(message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button
                id="btn_close_car_admin_portal"
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Car Rental
              </button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                  Fleet Admin
                </p>
                <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-slate-900">
                  Car Rental Admin Portal
                </h1>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Save vehicle names, rates, seats, features, pictures, emojis, and display colors from
              here.
            </div>
          </div>
        </header>

        {feedback && (
          <div
            className={`mb-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {feedback.text}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Vehicle Form
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {editingId ? 'Edit vehicle details' : 'Add a vehicle'}
                </h2>
              </div>

              {editingId && (
                <button
                  id="btn_reset_car_admin_form"
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  New Vehicle
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vehicle Name
                  </label>
                  <input
                    id="input_car_admin_name"
                    type="text"
                    value={draft.name}
                    onChange={(event) => handleDraftChange('name', event.target.value)}
                    placeholder="Toyota Corolla"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vehicle Type
                  </label>
                  <select
                    id="select_car_admin_type"
                    value={draft.type}
                    onChange={(event) => handleDraftChange('type', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                  >
                    {VEHICLE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Daily Rate
                  </label>
                  <input
                    id="input_car_admin_rate"
                    type="number"
                    min="1"
                    value={draft.dailyRate}
                    onChange={(event) => handleDraftChange('dailyRate', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Seats
                  </label>
                  <input
                    id="input_car_admin_seats"
                    type="number"
                    min="1"
                    value={draft.seats}
                    onChange={(event) => handleDraftChange('seats', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Transmission
                  </label>
                  <select
                    id="select_car_admin_transmission"
                    value={draft.transmission}
                    onChange={(event) => handleDraftChange('transmission', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                  >
                    {TRANSMISSIONS.map((transmission) => (
                      <option key={transmission} value={transmission}>
                        {transmission}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.4fr_0.6fr]">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vehicle Emoji
                  </label>
                  <input
                    id="input_car_admin_emoji"
                    type="text"
                    value={draft.emoji}
                    onChange={(event) => handleDraftChange('emoji', event.target.value)}
                    placeholder="🚗"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Card Color
                  </label>
                  <select
                    id="select_car_admin_color"
                    value={draft.colorClass}
                    onChange={(event) => handleDraftChange('colorClass', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                  >
                    {COLOR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Car Picture
                  </label>
                  {draft.image && (
                    <button
                      id="btn_clear_car_admin_image"
                      type="button"
                      onClick={() => {
                        handleDraftChange('image', '');
                        setDraftUpload(null);
                      }}
                      className="text-xs font-semibold text-red-600 transition hover:text-red-700"
                    >
                      Remove picture
                    </button>
                  )}
                </div>
                <input
                  id="input_car_admin_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition file:mr-3 file:rounded-xl file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-amber-400"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Upload a car photo to show instead of the emoji on the rental portal.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Features
                </label>
                <textarea
                  id="textarea_car_admin_features"
                  value={draft.featuresText}
                  onChange={(event) => handleDraftChange('featuresText', event.target.value)}
                  rows={4}
                  placeholder="Air Conditioning, Bluetooth, Leather Seats"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Separate features with commas. Current color theme: {activeColorLabel}.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Preview
                </p>
                <div className={`mt-3 rounded-[1.5rem] bg-gradient-to-br ${draft.colorClass} p-5 text-white`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
                        {draft.type}
                      </p>
                      <h3 className="mt-2 text-xl font-black">{draft.name || 'Vehicle Name'}</h3>
                    </div>
                    {draft.image ? (
                      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/15">
                        <img
                          src={draft.image}
                          alt={draft.name || 'Vehicle preview'}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="text-5xl">{draft.emoji || '🚗'}</div>
                    )}
                  </div>
                  <p className="mt-4 text-sm text-white/80">
                    GHS {draft.dailyRate || '0'} per day · {draft.seats || '0'} seats ·{' '}
                    {draft.transmission}
                  </p>
                </div>
              </div>

              <button
                id="btn_save_car_admin"
                type="submit"
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-200"
              >
                {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? 'Save Vehicle Changes' : 'Add Vehicle To Portal'}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Current Fleet
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {carFleet.length} vehicle{carFleet.length === 1 ? '' : 's'}
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {enabledVehicleCount} active, {carFleet.length - enabledVehicleCount} disabled
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Changes are saved locally and sync across browsers when the shared backend is available.
              </div>
            </div>

            <div className="space-y-4">
              {carFleet.map((car) => (
                <article
                  key={car.id}
                  className={`overflow-hidden rounded-[1.5rem] border bg-slate-50 ${
                    isCarEnabled(car) ? 'border-slate-200' : 'border-amber-200 opacity-80'
                  }`}
                >
                  <div className={`bg-gradient-to-br ${car.colorClass} px-5 py-4 text-white`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                            {car.type}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                              isCarEnabled(car)
                                ? 'bg-emerald-400/20 text-emerald-50'
                                : 'bg-black/20 text-amber-100'
                            }`}
                          >
                            {isCarEnabled(car) ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <h3 className="mt-1 text-lg font-black">{car.name}</h3>
                      </div>
                      {car.image ? (
                        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/15">
                          <img
                            src={car.image}
                            alt={car.name}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="text-4xl">{car.emoji}</div>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-slate-900">Rate:</span> GHS{' '}
                        {car.dailyRate.toLocaleString()}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Seats:</span> {car.seats}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Transmission:</span>{' '}
                        {car.transmission}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Features:</span>{' '}
                        {car.features.length}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {car.features.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <button
                        id={`btn_edit_car_${car.id}`}
                        type="button"
                        onClick={() => handleEdit(car)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        id={`btn_toggle_car_${car.id}`}
                        type="button"
                        onClick={() => handleToggleAvailability(car)}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          isCarEnabled(car)
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {isCarEnabled(car) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {isCarEnabled(car) ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        id={`btn_delete_car_${car.id}`}
                        type="button"
                        onClick={() => handleDelete(car)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {carFleet.length === 0 && (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                <Car className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No vehicles in the portal yet.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Use the form to add the first vehicle to your car rental portal.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

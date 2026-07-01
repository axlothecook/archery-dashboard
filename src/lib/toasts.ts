// Toast (transient notification) store + trigger. Any dashboard action can call
// `showToast('success' | 'error', 'message')` to pop a notice at the top-left of
// the content area (below the topbar); it auto-dismisses after DURATION ms. The
// <Toast> component (rendered once in the admin layout) subscribes and renders the
// stack. Modelled on the Create_Resume showToast() hook, adapted to a Svelte store,
// and styled with the sass-library `default-notification-popup` mixin.
import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error';
export type Toast = { id: number; type: ToastType; message: string };

// How long a toast stays before auto-dismissing (matches the library fade duration).
export const TOAST_DURATION = 3100;

export const toasts = writable<Toast[]>([]);

let nextId = 0;

export function showToast(type: ToastType, message: string) {
	const id = ++nextId;
	toasts.update((list) => [...list, { id, type, message }]);
	setTimeout(() => dismissToast(id), TOAST_DURATION);
}

export function dismissToast(id: number) {
	toasts.update((list) => list.filter((t) => t.id !== id));
}

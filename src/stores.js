import { writable, readable } from 'svelte/store';

export const step = writable(0);
export const timer = writable(null)
export const supportedLanguages = readable(['en','es'])


import { writable, type Writable } from 'svelte/store';
import type { User } from '@/shared/types/user';

export const loggedUser: Writable<User | null> = writable(null);
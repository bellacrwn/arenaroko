import { store } from '../db/store.js';

await store.reset();
console.log('REKO backend data reset to the base catalog.');

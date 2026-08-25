import { randomInt, randomUUID } from 'node:crypto';

export const id = () => randomUUID();
export const publicPickupId = () => `RKO-${randomInt(100000, 999999)}`;
export const mockAccountNumber = () => String(randomInt(1000000000, 1999999999));

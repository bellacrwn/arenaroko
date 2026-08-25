import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { createInitialDatabase } from './seed.js';

class JsonStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.queue = Promise.resolve();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await this.#write(createInitialDatabase());
    }
    this.initialized = true;
  }

  async snapshot() {
    await this.queue;
    await this.initialize();
    return this.#read();
  }

  transaction(mutator) {
    const operation = this.queue.then(async () => {
      await this.initialize();
      const database = await this.#read();
      const result = await mutator(database);
      database.meta.updatedAt = new Date().toISOString();
      await this.#write(database);
      return result;
    });
    this.queue = operation.catch(() => undefined);
    return operation;
  }

  async reset() {
    await this.queue;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await this.#write(createInitialDatabase());
    this.initialized = true;
  }

  async #read() {
    const content = await fs.readFile(this.filePath, 'utf8');
    const database = JSON.parse(content);
    if (!database.meta || database.meta.schemaVersion !== 1) {
      throw new Error(`Unsupported database schema in ${this.filePath}.`);
    }
    return database;
  }

  async #write(database) {
    const temporary = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(database, null, 2)}\n`, 'utf8');
    await fs.rename(temporary, this.filePath);
  }
}

export const store = new JsonStore(config.dataFile);

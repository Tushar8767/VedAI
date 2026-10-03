const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class FileCollection {
  constructor(collectionName) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    this.memory = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn(`[FileStore] Error loading ${this.filePath}:`, err.message);
    }
    return [];
  }

  _save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.memory, null, 2), 'utf8');
    } catch (err) {
      console.error(`[FileStore] Error writing ${this.filePath}:`, err.message);
    }
  }

  find(predicate = () => true) {
    return this.memory.filter(predicate);
  }

  findOne(predicate) {
    return this.memory.find(predicate) || null;
  }

  create(doc) {
    const id = doc._id || 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newDoc = {
      ...doc,
      _id: id,
      createdAt: doc.createdAt || new Date(),
      updatedAt: new Date()
    };
    this.memory.unshift(newDoc);
    this._save();
    return newDoc;
  }

  findById(id) {
    return this.findOne(d => String(d._id) === String(id));
  }

  findByIdAndUpdate(id, updates) {
    const idx = this.memory.findIndex(d => String(d._id) === String(id));
    if (idx === -1) return null;
    this.memory[idx] = {
      ...this.memory[idx],
      ...updates,
      updatedAt: new Date()
    };
    this._save();
    return this.memory[idx];
  }

  findByIdAndDelete(id) {
    const idx = this.memory.findIndex(d => String(d._id) === String(id));
    if (idx === -1) return null;
    const removed = this.memory.splice(idx, 1)[0];
    this._save();
    return removed;
  }

  deleteMany(predicate) {
    const initialCount = this.memory.length;
    this.memory = this.memory.filter(d => !predicate(d));
    this._save();
    return { deletedCount: initialCount - this.memory.length };
  }

  countDocuments(predicate = () => true) {
    return this.memory.filter(predicate).length;
  }
}

module.exports = {
  FileCollection
};

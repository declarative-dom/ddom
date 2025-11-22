import indexedDB from 'fake-indexeddb';
globalThis.indexedDB = indexedDB;

console.log('globalThis.indexedDB:', globalThis.indexedDB);
console.log('typeof globalThis.indexedDB:', typeof globalThis.indexedDB);
console.log('globalThis.indexedDB.open:', globalThis.indexedDB.open);

const request = globalThis.indexedDB.open('testdb', 1);
console.log('request:', request);

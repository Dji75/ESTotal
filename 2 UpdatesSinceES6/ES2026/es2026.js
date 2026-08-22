// Map.getOrInsert

const myMap = new Map([[1, 'one'], [2, 'two']]);

console.log('get or insert ?', myMap.getOrInsert(3, 'three'))
console.log('myMap:', myMap);
console.log('insert ?', myMap.getOrInsert(1, 'another one ?'))
console.log('myMap:', myMap);

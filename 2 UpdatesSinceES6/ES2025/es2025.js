// Promise.try
const promise = Promise.try(() => {
  //  do synchronous or asynchronous stuff
  return 1;
});

promise.then((result) => {
  console.log(result);
})

// Set.intersection
const firstList = new Set([1, 2, 3, 4, 5, 6]);
const secondList = new Set([2, 3, 5]);

if (secondList.isSubsetOf(firstList)) {
  console.log('all items from second list all included in first list');
} else {
  console.log('at least on item from second list is NOT included in first list');
}

if (firstList.isSupersetOf(secondList)) {
  console.log('first list contains all elements of second list');
} else {
  console.log('some items from second list are not included in first list');
}

console.log('difference: ', firstList.difference(secondList), ' --- ', secondList.difference(firstList));
console.log('symmetricDifference: ', firstList.symmetricDifference(secondList), ' --- ', secondList.symmetricDifference(firstList));

// JSON import
import jsonFile from '../../package.json' with { type: 'json' };
console.log('JSON content: ', jsonFile);

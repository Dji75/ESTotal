// Object.groupBy()
// Since March 2024, this feature works across the latest devices and browser versions.
// This feature might not work in older devices or browsers.

//The Object.groupBy() method groups elements of an object according to string values returned from a callback function.
// The Object.groupBy() method does not change the original object.

// Create an Array
const fruits = [
  { name: "apples", quantity: 300 },
  { name: "bananas", quantity: 5 },
  { name: "oranges", quantity: 5000 },
  { name: "kiwi", quantity: 10 },
];

// Callback function to Group Elements
function myCallback({ quantity }) {
  return quantity > 200 ? "abundant" : "low";
}

// Group by Quantity
const result = Object.groupBy(fruits, myCallback);
console.log('abundant:', result.abundant);
console.log('low:', result.low);

// Map.groupBy
//The method is primarily useful when grouping elements that are associated with an object,
// and in particular when that object might change over time.
// If the object is invariant, you might instead represent it using a string, and group elements with Object.groupBy().

// Object.groupBy() vs Map.groupBy()
// The difference between Object.groupBy() and Map.groupBy() is:

// Object.groupBy() groups elements into a JavaScript object.

// Map.groupBy() groups elements into a Map object.

// // Temporal
// // Temporal is currently in stage 3 (almost finished) in the 2024 proposal."
// // https://tc39.es/proposal-temporal/tc39.es/proposal-temporal/
//
// /* JavaScript Date is fundamentally specified as the number of milliseconds that have elapsed since the ECMAScript epoch, which is defined as January 1, 1970, UTC. However, there are some problems with the current JavaScript Date implementation.
//
// Problems 😵:
//
// No support for time zones other than the user's local time and UTC.
// Parser behavior so unreliable it is unusable.
// Date object is mutable.
// DST behavior is unpredictable.
// Computation APIs are unwieldy.
// No support for non-Gregorian calendars. */
//
// // Temporal API Data Types
// // PlainDateTime 📆⌚
// // It is an object represents a date and time with no timezone information.
// // It uses the current date and time from the timezone you pass to the method,
// // or your current local timezone if no timezone is passed to the method.
//
// // use this sandbox
// //  to use Temporal: https://stackblitz.com/edit/typescript-acfnhb?file=index.ts
// import { Temporal } from "@js-temporal/polyfill";
//
// const today = Temporal.Now.plainDateTimeISO();
// console.log(today.toString());
//
// const date = new Temporal.PlainDateTime(2022, 1, 1);
// console.log(date.toString());
//
// const date1 = Temporal.PlainDateTime.from("2022-01-01");
// console.log(date1.toString());
//
// const date2 = Temporal.PlainDateTime.from({ year: 2022, month: 1, day: 1 });
// console.log(date2.toString());
//
// // PlainDate 📆
// // A PlainDate object represents just a date with no other information.
// const today2 = Temporal.Now.plainDateISO();
// console.log(today2);
//
// const date12 = Temporal.PlainDate.from("2022-01-01");
// console.log(date12.toString());
//
// const date22 = Temporal.PlainDate.from({ year: 2022, month: 1, day: 1 });
// console.log(date22.toString());
//
// //PlainTime A PlainTime object represents a time that has no timezone and no date.
// const today3 = Temporal.Now.plainTimeISO();
// console.log(today3.toString());
//
// const time31 = Temporal.PlainTime.from("04:03:25");
// console.log(time31.toString());
//
// const time32 = Temporal.PlainTime.from({ hour: 4, minute: 3, second: 25 });
// console.log(time32.toString());
//
// // ZonedDateTime A ZonedDateTime is a datetime that contains all timezone related information.
// const today4 = Temporal.Now.zonedDateTimeISO();
// console.info(today4.toString());
//
// const date41 = Temporal.ZonedDateTime.from("2022-01-01[America/Los_Angeles]");
// console.log(date41.toString());
//
// const date42 = Temporal.ZonedDateTime.from({
//   year: 2022,
//   month: 1,
//   day: 1,
//   timeZone: "America/Los_Angeles",
// });
// console.log(date42.toString());
//
// //Instant Instant is similar to ZonedDateTime but it is always in UTC time and does not take into account any particular calendar
// const today5 = Temporal.Now.instant();
// console.log(today5.toString());
//
// const date5 = Temporal.Instant.from("2022-01-01-06:00");
// console.log(date5.toString());
//
// //PlainMonthDay Just like PlainDate but it does not include any year information.
// const date6 = Temporal.PlainMonthDay.from("01-01");
// console.log(date6.toString());
// // 01-01
// const date62 = Temporal.PlainMonthDay.from({ month: 1, day: 1 });
// console.log(date62.toString());
//
// // Helper Methods 🛠
// // There are a number of helper functions we can use to solve the common use cases
// // such as add or subtract date or date comparison.
//
// //add ➕ / subtract ➖
// // As in Javascript, adding or subtracting is really annoying to do,
// // but with temporal API all the data types have built in add and subtract methods that make it incredibly easy.
// const today7 = Temporal.Now.plainDateISO();
// console.log("Today: " + today7.toString());
// console.log("Result: " + today7.add({ days: 7, months: 1 }).toString());
//
// //equals
// // A simple method to check whether two temporal date objects have the exact same fields.
// const today8 = Temporal.Now.plainDateISO();
// console.log(today7 === today8);
// // false
// console.log(today7.equals(today8));
// // true
//
// // with method takes in an object of fields to overwrite on the current date object
// console.info(today7.toString());
// console.log(today7.with({ year: 2027, month: 3 }).toString());
//
// // compare ⚖
// // As method named, we can use the compare method to compare with temporal date object or ISO 8601 string.
// const todayISO = Temporal.Now.plainDateISO();
// const yesterday = todayISO.subtract({ days: 1 });
// const tomorrow = todayISO.add({ days: 1 });
// console.log([todayISO, yesterday, tomorrow].sort(Temporal.PlainDate.compare));
//
// const date222 = Temporal.PlainDateTime.from({ year: 2022, month: 2, day: 30 });
// console.log(date222.toLocaleString("en"));
// // 2022-01-01T00:00:00

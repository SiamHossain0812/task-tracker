const {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format
} = require('date-fns');

const currentMonth = new Date('2026-02-15'); // Use the user's current date

const monthStart = startOfMonth(currentMonth);
const monthEnd = endOfMonth(monthStart);
const startDate = startOfWeek(monthStart);
const endDate = endOfWeek(monthEnd);

console.log('Month Start:', format(monthStart, 'yyyy-MM-dd'));
console.log('Month End:', format(monthEnd, 'yyyy-MM-dd'));
console.log('Start Date (Grid Start):', format(startDate, 'yyyy-MM-dd'));
console.log('End Date (Grid End):', format(endDate, 'yyyy-MM-dd'));

const allDays = eachDayOfInterval({ start: startDate, end: endDate });
console.log('Total Days:', allDays.length);
allDays.forEach(d => console.log(format(d, 'yyyy-MM-dd')));

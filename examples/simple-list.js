

const sampleUsers = [
  { id: 1, name: 'Alice', department: 'Engineering', age: 30, active: true, salary: 80000 },
  { id: 2, name: 'Bob', department: 'Sales', age: 25, active: true, salary: 60000 },
  { id: 3, name: 'Charlie', department: 'Engineering', age: 35, active: false, salary: 90000 },
  { id: 4, name: 'Diana', department: 'Sales', age: 28, active: true, salary: 65000 },
  { id: 5, name: 'Eve', department: 'Marketing', age: 32, active: true, salary: 70000 },
  { id: 6, name: 'Frank', department: 'Engineering', age: 40, active: false, salary: 95000 },
];

export default {
  $globalUsers: sampleUsers,
  document: {
    body: {
      children: {
        prototype: 'Array',
        items: 'window.$globalUsers', // Property accessor to signal
        map: {
          tagName: 'p', id: 'item.id', textContent: 'item.name'
        },
      },
    },
  }
};

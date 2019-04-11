const chalk = require('chalk');

const log = ['green', 'yellow', 'blue', 'white', 'cyan', 'red', 'gray'].reduce(
  (a, c) => ({
    ...a,
    [c]: (...args) => console.log(chalk[c](args)),
  }),
  {},
);

module.exports = log;

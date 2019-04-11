const { Form } = require('enquirer');
const log = require('./chalk');

const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

(async () => {
  const prompt = new Form({
    name: 'user',
    message: 'Please provide your twitter credentials:',
    choices: [
      {
        name: 'email',
        message: 'Email',
        initial: 'example@gmail.com',
        validate(value) {
          const valid = validateEmail(value);
          if (!valid) {
            this.error = 'Invalid email address';
            return false;
          }
          this.error = void 0;
          return true;
        },
      },
      {
        name: 'password',
        message: 'Password',
        format(input = this.input) {
          if (!this.keypressed) return '';
          const color = this.state.submitted
            ? this.styles.primary
            : this.styles.muted;
          return color(this.symbols.asterisk.repeat(input.length));
        },
      },
    ],
  });

  await prompt
    .run()
    .then(({ email, password }) => {
      if (!validateEmail(email)) {
        log.red('Dude, please enter a valid email address!');
        process.exit(0);
      } else if (password.length === 0) {
        log.red(
          'Dude, you forgot to give your password! Use arrow key to move to password field;',
        );
        process.exit(0);
      }
      log.yellow("Okay, now we're trying to sign in to your account!");
    })
    .catch(log.red);
})();

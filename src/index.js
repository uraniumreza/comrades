const { Form, Input } = require('enquirer');
const log = require('./chalk');
const puppeteer = require('puppeteer');

const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

async function followComrades(page, minNumberOfComrades = 50) {
  log.red("LET's ROLL");
  let buttons = [];
  while (buttons.length < minNumberOfComrades) {
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    buttons = await page.evaluate(() => {
      return [
        ...document.querySelectorAll(
          '.Grid--withGutter .user-actions.btn-group.not-muting.not-following .EdgeButton.EdgeButton--secondary.EdgeButton--small.button-text.follow-text',
        ),
      ];
    });
  }
  log.red(buttons.length);
  for (let i = 0, len = buttons.length; i < len; i++) {
    log.cyan('following', i);
    buttons[i].click();
    await page.waitFor(10000);
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
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
    .then(async ({ email, password }) => {
      if (!validateEmail(email)) {
        log.red('Dude, please enter a valid email address!');
        process.exit(0);
      } else if (password.length === 0) {
        log.red(
          'Dude, you forgot to give your password! Use down arrow-key/tab to move to password field;',
        );
        process.exit(0);
      }
      log.yellow("Okay, we're trying to sign in to your account!");
      await page.goto('https://twitter.com/', { waitUntil: 'load' });
      log.blue(
        `Now we're at ${page.url()}, using your credentials to log in -`,
      );

      await page.type('.js-signin-email', email);
      await page.type('.LoginForm-password > input', password);
      await page.click('.js-submit');
      // TODO: Make this error message bullet-proof
      await page.waitForSelector('.DashboardProfileCard-content').catch(() => {
        log.red('Sorry, your credentials are wrong');
        browser.close();
        process.exit(0);
      });

      log.green('Successfully Logged In!');

      const prompt = new Input({
        name: 'url',
        message: 'What is the twitter handle of the comrade?',
      });

      prompt
        .run()
        .then(async (handle) => {
          log.yellow(`Navigating to: https://twitter.com/${handle}/following`);
          await page.goto(`https://twitter.com/${handle}/following`, {
            waitUntil: 'load',
          });

          await page.waitForSelector('.ProfileAvatar').catch(() => {
            log.red("Sorry, couldn't navigate to comrade's profile-page!");
            browser.close();
            process.exit(0);
          });

          log.blue(`Now we're at ${handle} following page!`);

          await followComrades(page);
        })
        .catch(log.red);

      await setTimeout(() => {
        browser.close();
      }, 30000);
    })
    .catch(log.red);
})();

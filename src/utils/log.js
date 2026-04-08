const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

export const log = {
  info(msg) {
    console.log(`${CYAN}ℹ${RESET} ${msg}`);
  },
  success(msg) {
    console.log(`${GREEN}✔${RESET} ${msg}`);
  },
  warn(msg) {
    console.log(`${YELLOW}⚠${RESET} ${msg}`);
  },
  error(msg) {
    console.error(`${RED}✖${RESET} ${msg}`);
  },
  step(msg) {
    console.log(`${BOLD}${CYAN}→${RESET} ${msg}`);
  },
  dim(msg) {
    console.log(`${DIM}  ${msg}${RESET}`);
  },
  blank() {
    console.log();
  },
  header(msg) {
    console.log();
    console.log(`${BOLD}${msg}${RESET}`);
    console.log(`${DIM}${'─'.repeat(msg.length)}${RESET}`);
  },
};

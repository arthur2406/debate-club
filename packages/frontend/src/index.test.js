const { formatWelcomeMessage } = require('./index');

describe('formatWelcomeMessage', () => {
  it('trims whitespace and formats correctly', () => {
    expect(formatWelcomeMessage('  Alex  ')).toBe(
      'Welcome to the Debate Club, Alex!',
    );
  });
});

const { buildGreeting } = require('./server');

describe('buildGreeting', () => {
  it('normalizes the provided topic', () => {
    expect(buildGreeting('  Ethics ')).toBe('Now debating: ethics');
  });
});

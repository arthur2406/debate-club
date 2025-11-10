function formatWelcomeMessage(name) {
  const trimmed = name.trim();
  return `Welcome to the Debate Club, ${trimmed}!`;
}

module.exports = { formatWelcomeMessage };

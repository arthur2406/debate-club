function buildGreeting(topic) {
  const sanitizedTopic = topic.trim().toLowerCase();
  return `Now debating: ${sanitizedTopic}`;
}

module.exports = { buildGreeting };

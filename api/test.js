export default function handler(req, res) {
  const userAgent = req.headers['user-agent'] || '';
  const isBot = /bot|crawler|spider|scrapy|facebookexternalhit|twitterbot|discordbot|slackbot|whatsapp|telegrambot|linkedinbot|pinterest|redditbot/i.test(userAgent);
  
  res.status(200).json({
    userAgent: userAgent,
    isBot: isBot,
    headers: req.headers,
    query: req.query,
    url: req.url
  });
}

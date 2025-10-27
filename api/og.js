export default async function handler(req, res) {
  // URL'den playlist ID'yi al (query veya path'den)
  const playlistId = req.query.playlist || req.query.list;
  
  if (!playlistId || !playlistId.startsWith('PL')) {
    return res.redirect(302, '/');
  }

  // User-Agent kontrolü
  const userAgent = req.headers['user-agent'] || '';
  const isBot = /bot|crawler|spider|scrapy|facebookexternalhit|twitterbot|discordbot|slackbot|whatsapp|telegrambot|linkedinbot|pinterest|redditbot/i.test(userAgent);
  
  // Normal tarayıcıysa ana sayfaya yönlendir
  if (!isBot) {
    return res.redirect(302, `/#${playlistId}`);
  }

  // Bot ise meta tagları ile HTML döndür
  const API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyDPKFr63Y-zWgEkjdDKD893udw8lqbDFIw';
  
  try {
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${API_KEY}`
    );
    const playlistData = await playlistRes.json();
    
    if (!playlistData.items || playlistData.items.length === 0) {
      return res.redirect(302, '/');
    }

    const playlist = playlistData.items[0];
    const playlistTitle = playlist.snippet.title;
    const playlistChannel = playlist.snippet.channelTitle;
    const itemCount = playlist.contentDetails.itemCount || 0;
    const thumbnail = playlist.snippet.thumbnails?.maxres?.url ||
                     playlist.snippet.thumbnails?.high?.url ||
                     playlist.snippet.thumbnails?.medium?.url ||
                     playlist.snippet.thumbnails?.default?.url;
    
    const description = `🎵 ${itemCount} şarkı içeren playlist\n📝 ${playlistChannel} tarafından oluşturuldu`;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const fullUrl = `${protocol}://${host}/${playlistId}`;

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${playlistTitle} - YouTube Playlist Player</title>
    <meta property="og:type" content="website">
    <meta property="og:url" content="${fullUrl}">
    <meta property="og:title" content="${playlistTitle}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${thumbnail}">
    <meta property="og:image:width" content="1280">
    <meta property="og:image:height" content="720">
    <meta property="og:site_name" content="YouTube Playlist Player">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${playlistTitle}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${thumbnail}">
    <meta name="theme-color" content="#FF0000">
    <meta http-equiv="refresh" content="0;url=/#${playlistId}">
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #121212; color: white;">
    <h1>🎵 ${playlistTitle}</h1>
    <p>${description}</p>
    <p>Yönlendiriliyor...</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Error:', error);
    return res.redirect(302, '/');
  }
}

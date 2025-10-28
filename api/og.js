export default async function handler(req, res) {
  let playlistId = req.query.playlist || req.query.list;
  
  if (playlistId && !playlistId.startsWith('PL')) {
    playlistId = 'PL' + playlistId;
  }
  
  if (!playlistId || playlistId.length < 10) {
    return res.redirect(302, '/');
  }

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
    const publishedAt = new Date(playlist.snippet.publishedAt).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const thumbnail = playlist.snippet.thumbnails?.maxres?.url ||
                     playlist.snippet.thumbnails?.high?.url ||
                     playlist.snippet.thumbnails?.medium?.url ||
                     playlist.snippet.thumbnails?.default?.url;
    
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const shareUrl = `${protocol}://${host}/${playlistId}`;
    const playUrl = `${protocol}://${host}/#${playlistId}`;

    // User agent kontrolü - bot mu değil mi?
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /bot|crawler|spider|facebookexternalhit|twitterbot|discordbot|slackbot|whatsapp|telegrambot|xenforo/i.test(userAgent);

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${playlistTitle}</title>
    
    <!-- Primary Meta Tags -->
    <meta name="title" content="${playlistTitle}">
    <meta name="description" content="${itemCount} video • ${playlistChannel} tarafından oluşturuldu">
    
    <!-- Open Graph / Facebook / Xenforo -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="YouTube Playlist Player">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:title" content="${playlistTitle}">
    <meta property="og:description" content="${itemCount} video • ${playlistChannel} tarafından oluşturuldu">
    <meta property="og:image" content="${thumbnail}">
    <meta property="og:image:secure_url" content="${thumbnail}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1280">
    <meta property="og:image:height" content="720">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${shareUrl}">
    <meta name="twitter:title" content="${playlistTitle}">
    <meta name="twitter:description" content="${itemCount} video • ${playlistChannel} tarafından oluşturuldu">
    <meta name="twitter:image" content="${thumbnail}">
    
    <!-- oEmbed -->
    <link rel="alternate" type="application/json+oembed" href="${protocol}://${host}/api/oembed?url=${encodeURIComponent(shareUrl)}&format=json" title="${playlistTitle}">
    
    ${!isBot ? `<meta http-equiv="refresh" content="0;url=${playUrl}">` : ''}
    ${!isBot ? `<script>window.location.href = '${playUrl}';</script>` : ''}
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
            overflow: hidden;
            animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .thumbnail {
            width: 100%;
            height: 280px;
            object-fit: cover;
            display: block;
        }
        .content { padding: 24px; }
        .spinner-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }
        .spinner {
            border: 3px solid rgba(102, 126, 234, 0.2);
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loading-text {
            color: #667eea;
            font-size: 14px;
            font-weight: 600;
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 16px;
            line-height: 1.3;
        }
        .info-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
        }
        .info-item {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #666;
            font-size: 14px;
        }
        .info-label {
            font-weight: 600;
            color: #333;
            min-width: 60px;
        }
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            transition: transform 0.2s ease;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        @media (max-width: 480px) {
            .card { border-radius: 12px; }
            .thumbnail { height: 200px; }
            .content { padding: 20px; }
            h1 { font-size: 20px; }
        }
    </style>
</head>
<body>
    <div class="card">
        <img src="${thumbnail}" alt="${playlistTitle}" class="thumbnail">
        <div class="content">
            ${!isBot ? `
            <div class="spinner-container">
                <div class="spinner"></div>
                <span class="loading-text">Playlist açılıyor...</span>
            </div>
            ` : ''}
            <h1>${playlistTitle}</h1>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Video:</span>
                    <span>${itemCount} adet</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Oluşturan:</span>
                    <span>${playlistChannel}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Tarih:</span>
                    <span>${publishedAt}</span>
                </div>
            </div>
            <a href="${playUrl}" class="action-button">▶ Playlist'i Oynat</a>
        </div>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return res.redirect(302, '/');
  }
      }

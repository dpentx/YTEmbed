export default async function handler(req, res) {
  const { list } = req.query;
  
  // Eğer playlist ID yoksa ana sayfaya yönlendir
  if (!list) {
    return res.redirect(302, '/');
  }

  const API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyDPKFr63Y-zWgEkjdDKD893udw8lqbDFIw';
  
  try {
    // Playlist bilgilerini al
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${list}&key=${API_KEY}`
    );
    const playlistData = await playlistRes.json();
    
    if (!playlistData.items || playlistData.items.length === 0) {
      return res.redirect(302, '/');
    }

    const playlist = playlistData.items[0];
    const playlistTitle = playlist.snippet.title;
    const playlistChannel = playlist.snippet.channelTitle;
    const itemCount = playlist.contentDetails.itemCount || 0;
    
    // Playlist kapak görseli
    const thumbnail = playlist.snippet.thumbnails?.maxres?.url ||
                     playlist.snippet.thumbnails?.high?.url ||
                     playlist.snippet.thumbnails?.medium?.url ||
                     playlist.snippet.thumbnails?.default?.url;
    
    // Açıklama
    const description = `🎵 ${itemCount} şarkı içeren playlist\n📝 ${playlistChannel} tarafından oluşturuldu`;
    
    // Tam URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const fullUrl = `${protocol}://${host}/p/${list}`;
    const redirectUrl = `${protocol}://${host}/#${list}`;

    // HTML ile meta tagları döndür
    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${playlistTitle} - YouTube Playlist Player</title>
    
    <!-- Open Graph / Facebook / Discord -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${fullUrl}">
    <meta property="og:title" content="${playlistTitle}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${thumbnail}">
    <meta property="og:image:width" content="1280">
    <meta property="og:image:height" content="720">
    <meta property="og:site_name" content="YouTube Playlist Player">
    <meta property="og:locale" content="tr_TR">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${fullUrl}">
    <meta name="twitter:title" content="${playlistTitle}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${thumbnail}">
    
    <!-- Discord Embed Rengi -->
    <meta name="theme-color" content="#FF0000">
    
    <!-- Otomatik yönlendirme -->
    <meta http-equiv="refresh" content="0;url=${redirectUrl}">
    <script>
      window.location.href = '${redirectUrl}';
    </script>
    
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            color: white;
        }
        .loader {
            text-align: center;
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h2 {
            font-weight: 300;
            font-size: 1.5rem;
        }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <h2>Playlist yükleniyor...</h2>
        <p>Yönlendiriliyorsunuz...</p>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return res.redirect(302, '/');
  }
}

export default async function handler(req, res) {
  // URL'den playlist ID'yi al
  let playlistId = req.query.playlist || req.query.list;
  
  // PL prefix'i yoksa ekle
  if (playlistId && !playlistId.startsWith('PL')) {
    playlistId = 'PL' + playlistId;
  }
  
  if (!playlistId || playlistId.length < 10) {
    return res.redirect(302, '/');
  }

  const API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyDPKFr63Y-zWgEkjdDKD893udw8lqbDFIw';
  
  try {
    // Playlist bilgilerini al
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
    
    // Playlist kapak görseli
    const thumbnail = playlist.snippet.thumbnails?.maxres?.url ||
                     playlist.snippet.thumbnails?.high?.url ||
                     playlist.snippet.thumbnails?.medium?.url ||
                     playlist.snippet.thumbnails?.default?.url;
    
    // Açıklama
    const description = `🎵 ${itemCount} video • 📝 ${playlistChannel} • 📅 ${publishedAt}`;
    
    // URL'ler
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const shareUrl = `${protocol}://${host}/${playlistId}`;
    const playUrl = `${protocol}://${host}/#${playlistId}`;

    // HTML ile meta tagları döndür - tıklayınca oynatıcıya git
    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${playlistTitle} - YouTube Playlist Player</title>
    
    <!-- Open Graph / Facebook / Discord -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:title" content="${playlistTitle}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${thumbnail}">
    <meta property="og:image:width" content="1280">
    <meta property="og:image:height" content="720">
    <meta property="og:site_name" content="YouTube Playlist Player">
    <meta property="og:locale" content="tr_TR">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${shareUrl}">
    <meta name="twitter:title" content="${playlistTitle}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${thumbnail}">
    
    <!-- Discord Embed Rengi -->
    <meta name="theme-color" content="#FF0000">
    
    <!-- Otomatik yönlendirme -->
    <meta http-equiv="refresh" content="0;url=${playUrl}">
    <script>
      window.location.href = '${playUrl}';
    </script>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .thumbnail {
            width: 100%;
            height: 280px;
            object-fit: cover;
            display: block;
        }
        
        .content {
            padding: 24px;
        }
        
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
        
        .info-icon {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
        }
        
        .info-label {
            font-weight: 600;
            color: #333;
            min-width: 60px;
        }
        
        .info-value {
            color: #666;
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
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        
        .footer {
            text-align: center;
            padding-top: 16px;
            border-top: 1px solid #eee;
            margin-top: 20px;
        }
        
        .footer-text {
            color: #999;
            font-size: 12px;
        }
        
        @media (max-width: 480px) {
            .card {
                border-radius: 12px;
            }
            
            .thumbnail {
                height: 200px;
            }
            
            .content {
                padding: 20px;
            }
            
            h1 {
                font-size: 20px;
            }
            
            .info-item {
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="card">
        <img src="${thumbnail}" alt="${playlistTitle}" class="thumbnail" onerror="this.style.display='none'">
        
        <div class="content">
            <div class="spinner-container">
                <div class="spinner"></div>
                <span class="loading-text">Playlist açılıyor...</span>
            </div>
            
            <h1>${playlistTitle}</h1>
            
            <div class="info-grid">
                <div class="info-item">
                    <svg class="info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM10 16H8V8H10V16ZM14 16H12V8H14V16ZM18 16H16V8H18V16Z" fill="#667eea"/>
                    </svg>
                    <span class="info-label">Video:</span>
                    <span class="info-value">${itemCount} adet</span>
                </div>
                
                <div class="info-item">
                    <svg class="info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#667eea"/>
                    </svg>
                    <span class="info-label">Oluşturan:</span>
                    <span class="info-value">${playlistChannel}</span>
                </div>
                
                <div class="info-item">
                    <svg class="info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 4H5C3.89 4 3 4.9 3 6V18C3 19.1 3.89 20 5 20H19C20.1 20 21 19.1 21 18V6C21 4.9 20.1 4 19 4ZM19 18H5V8H19V18ZM7 10H17V12H7V10ZM7 14H14V16H7V14Z" fill="#667eea"/>
                    </svg>
                    <span class="info-label">Tarih:</span>
                    <span class="info-value">${publishedAt}</span>
                </div>
            </div>
            
            <a href="${playUrl}" class="action-button">▶ Playlist'i Oynat</a>
            
            <div class="footer">
                <p class="footer-text">YouTube Playlist Player ile dinle</p>
            </div>
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

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
    
    // ÖNCE playlist thumbnail'ını al (en yüksek kalite)
    const playlistThumbnail = playlist.snippet.thumbnails?.maxres?.url ||
                              playlist.snippet.thumbnails?.standard?.url ||
                              playlist.snippet.thumbnails?.high?.url ||
                              playlist.snippet.thumbnails?.medium?.url ||
                              playlist.snippet.thumbnails?.default?.url;
    
    // İlk 10 videoyu al
    const playlistItemsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=10&playlistId=${playlistId}&key=${API_KEY}`
    );
    const playlistItemsData = await playlistItemsRes.json();
    
    // Video ID'lerini topla
    const videoIds = playlistItemsData.items
      ?.filter(item => item.snippet.title !== 'Private video' && item.snippet.title !== 'Deleted video')
      .map(item => item.snippet.resourceId.videoId)
      .join(',') || '';
    
    // Video detaylarını al
    let totalDuration = 0;
    let videos = [];
    let firstVideoThumbnail = playlistThumbnail; // Fallback olarak playlist thumbnail
    
    if (videoIds) {
      const videosRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${API_KEY}`
      );
      const videosData = await videosRes.json();
      
      // İlk videonun high-res thumbnail'ını al
      if (videosData.items && videosData.items.length > 0) {
        firstVideoThumbnail = videosData.items[0].snippet.thumbnails?.maxresdefault?.url ||
                             videosData.items[0].snippet.thumbnails?.standard?.url ||
                             videosData.items[0].snippet.thumbnails?.high?.url ||
                             videosData.items[0].snippet.thumbnails?.medium?.url ||
                             playlistThumbnail;
      }
      
      videos = videosData.items?.map(video => ({
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
        duration: video.contentDetails.duration
      })) || [];
      
      // Toplam süreyi hesapla
      videosData.items?.forEach(video => {
        const duration = video.contentDetails.duration;
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (match) {
          const hours = parseInt(match[1] || 0);
          const minutes = parseInt(match[2] || 0);
          const seconds = parseInt(match[3] || 0);
          totalDuration += hours * 3600 + minutes * 60 + seconds;
        }
      });
    }
    
    // Toplam süreyi formatla
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    let durationText = '';
    if (hours > 0) {
      durationText = `${hours} saat ${minutes} dakika`;
    } else if (minutes > 0) {
      durationText = `${minutes} dakika`;
    } else {
      durationText = `${totalDuration} saniye`;
    }
    
    // En iyi thumbnail'ı seç (playlist veya ilk video)
    const bestThumbnail = firstVideoThumbnail;
    
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const shareUrl = `${protocol}://${host}/${playlistId}`;
    const playUrl = `${protocol}://${host}/#${playlistId}`;

    // User agent kontrolü
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /bot|crawler|spider|facebookexternalhit|twitterbot|discordbot|slackbot|whatsapp|telegrambot|xenforo|linkedin/i.test(userAgent);

    // Meta description
    const metaDescription = `${itemCount} video • ${durationText} • ${playlistChannel}`;

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${playlistTitle}</title>
    
    <!-- Primary Meta Tags -->
    <meta name="title" content="${playlistTitle}">
    <meta name="description" content="${metaDescription}">
    
    <!-- Open Graph / Facebook -->
    <meta property="fb:app_id" content="966242223397117">
    <meta property="og:type" content="video.other">
    <meta property="og:site_name" content="YouTube Playlist Player">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:title" content="${playlistTitle}">
    <meta property="og:description" content="${metaDescription}">
    <meta property="og:image" content="${bestThumbnail}">
    <meta property="og:image:secure_url" content="${bestThumbnail}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1280">
    <meta property="og:image:height" content="720">
    <meta property="og:video" content="${playUrl}">
    <meta property="og:video:secure_url" content="${playUrl}">
    <meta property="og:video:type" content="text/html">
    <meta property="og:video:width" content="1280">
    <meta property="og:video:height" content="720">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="player">
    <meta name="twitter:site" content="@youtube">
    <meta name="twitter:url" content="${shareUrl}">
    <meta name="twitter:title" content="${playlistTitle}">
    <meta name="twitter:description" content="${metaDescription}">
    <meta name="twitter:image" content="${bestThumbnail}">
    <meta name="twitter:player" content="${playUrl}">
    <meta name="twitter:player:width" content="1280">
    <meta name="twitter:player:height" content="720">
    
    <!-- Discord / WhatsApp -->
    <meta name="theme-color" content="#667eea">
    
    <!-- oEmbed Discovery -->
    <link rel="alternate" type="application/json+oembed" 
          href="${protocol}://${host}/api/oembed?url=${encodeURIComponent(shareUrl)}&format=json" 
          title="${playlistTitle.replace(/"/g, '&quot;')}">
    <link rel="alternate" type="text/xml+oembed" 
          href="${protocol}://${host}/api/oembed?url=${encodeURIComponent(shareUrl)}&format=xml" 
          title="${playlistTitle.replace(/"/g, '&quot;')}">
    
    <link rel="canonical" href="${shareUrl}">
    
    ${!isBot ? `<meta http-equiv="refresh" content="0;url=${playUrl}">` : ''}
    ${!isBot ? `<script>window.location.href = '${playUrl}';</script>` : ''}
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
        }
        .cover {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%;
            background: #000;
        }
        .cover img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .play-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.95);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .play-icon {
            width: 0;
            height: 0;
            border-left: 24px solid #667eea;
            border-top: 14px solid transparent;
            border-bottom: 14px solid transparent;
            margin-left: 6px;
        }
        .content {
            padding: 24px;
        }
        .title {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 8px;
            line-height: 1.3;
        }
        .meta {
            display: flex;
            gap: 8px;
            align-items: center;
            color: #666;
            font-size: 14px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }
        .meta span {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .dot {
            width: 3px;
            height: 3px;
            background: #999;
            border-radius: 50%;
        }
        .videos-section {
            margin-top: 20px;
        }
        .section-title {
            font-size: 13px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        .video-list {
            max-height: 240px;
            overflow-y: auto;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
        }
        .video-item {
            display: flex;
            gap: 12px;
            padding: 10px;
            border-bottom: 1px solid #f0f0f0;
            transition: background 0.2s;
        }
        .video-item:last-child {
            border-bottom: none;
        }
        .video-item:hover {
            background: #f9f9f9;
        }
        .video-thumb {
            width: 80px;
            height: 45px;
            border-radius: 4px;
            object-fit: cover;
            flex-shrink: 0;
        }
        .video-info {
            flex: 1;
            min-width: 0;
        }
        .video-title {
            font-size: 13px;
            font-weight: 500;
            color: #1a1a1a;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .video-duration {
            font-size: 12px;
            color: #666;
        }
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            margin-top: 20px;
            width: 100%;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        .loading {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: #f0f7ff;
            border-radius: 8px;
            margin-bottom: 16px;
        }
        .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(102, 126, 234, 0.2);
            border-top: 2px solid #667eea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loading-text {
            font-size: 14px;
            color: #667eea;
            font-weight: 500;
        }
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #999;
        }
        @media (max-width: 480px) {
            .title { font-size: 20px; }
            .meta { font-size: 13px; }
            .video-thumb { width: 60px; height: 34px; }
            .video-title { font-size: 12px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="cover">
            <img src="${bestThumbnail}" alt="${playlistTitle.replace(/"/g, '&quot;')}">
            <div class="play-overlay">
                <div class="play-icon"></div>
            </div>
        </div>
        <div class="content">
            ${!isBot ? `
            <div class="loading">
                <div class="spinner"></div>
                <span class="loading-text">Playlist açılıyor...</span>
            </div>
            ` : ''}
            <h1 class="title">${playlistTitle}</h1>
            <div class="meta">
                <span>📝 ${playlistChannel}</span>
                <span class="dot"></span>
                <span>🎵 ${itemCount} video</span>
                ${durationText ? `<span class="dot"></span><span>⏱️ ${durationText}</span>` : ''}
            </div>
            
            ${videos.length > 0 ? `
            <div class="videos-section">
                <div class="section-title">Playlist İçeriği</div>
                <div class="video-list">
                    ${videos.map(video => `
                    <div class="video-item">
                        <img src="${video.thumbnail}" alt="${video.title.replace(/"/g, '&quot;')}" class="video-thumb">
                        <div class="video-info">
                            <div class="video-title">${video.title}</div>
                        </div>
                    </div>
                    `).join('')}
                    ${itemCount > 10 ? `
                    <div class="video-item" style="justify-content: center; padding: 16px; color: #666; font-size: 13px;">
                        +${itemCount - 10} video daha...
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}
            
            <a href="${playUrl}" class="button">
                ▶️ Playlist'i Oynat
            </a>
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

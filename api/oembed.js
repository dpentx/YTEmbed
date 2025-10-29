export default async function handler(req, res) {
  const { url, format = 'json', maxwidth = 1280, maxheight = 720 } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  try {
    const urlObj = new URL(url);
    const playlistId = urlObj.pathname.replace('/', '');
    
    if (!playlistId || playlistId.length < 10) {
      return res.status(400).json({ error: 'Invalid playlist ID' });
    }

    const API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyDPKFr63Y-zWgEkjdDKD893udw8lqbDFIw';
    
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${API_KEY}`
    );
    const playlistData = await playlistRes.json();
    
    if (!playlistData.items || playlistData.items.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const playlist = playlistData.items[0];
    const playlistTitle = playlist.snippet.title;
    const playlistChannel = playlist.snippet.channelTitle;
    const itemCount = playlist.contentDetails.itemCount || 0;
    
    const thumbnail = playlist.snippet.thumbnails?.maxres?.url ||
                     playlist.snippet.thumbnails?.high?.url ||
                     playlist.snippet.thumbnails?.medium?.url ||
                     playlist.snippet.thumbnails?.default?.url;
    
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    
    // Embed player URL'i
    const embedUrl = `${protocol}://${host}/embed.html#${playlistId}`;
    
    if (format === 'xml') {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<oembed>
  <version>1.0</version>
  <type>rich</type>
  <provider_name>YouTube Playlist Player</provider_name>
  <provider_url>${protocol}://${host}</provider_url>
  <title>${playlistTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
  <author_name>${playlistChannel.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</author_name>
  <width>${maxwidth}</width>
  <height>${maxheight}</height>
  <thumbnail_url>${thumbnail}</thumbnail_url>
  <thumbnail_width>1280</thumbnail_width>
  <thumbnail_height>720</thumbnail_height>
  <html>&lt;iframe src="${embedUrl}" width="${maxwidth}" height="${maxheight}" frameborder="0" allowfullscreen&gt;&lt;/iframe&gt;</html>
</oembed>`;
      
      res.setHeader('Content-Type', 'text/xml; charset=utf-8');
      return res.status(200).send(xml);
    }
    
    const oembedData = {
      version: '1.0',
      type: 'rich',
      provider_name: 'YouTube Playlist Player',
      provider_url: `${protocol}://${host}`,
      title: playlistTitle,
      author_name: playlistChannel,
      width: parseInt(maxwidth),
      height: parseInt(maxheight),
      thumbnail_url: thumbnail,
      thumbnail_width: 1280,
      thumbnail_height: 720,
      html: `<iframe src="${embedUrl}" width="${maxwidth}" height="${maxheight}" frameborder="0" allowfullscreen style="border:none;"></iframe>`
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(oembedData);
    
  } catch (error) {
    console.error('oEmbed error:', error);
    return res.status(500).json({ error: 'Failed to generate oEmbed data' });
  }
}

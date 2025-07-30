// Test script to debug ytdl-core issues
import ytdl from '@distube/ytdl-core';

async function testYtdl() {
  try {
    // Test with a well-known public video
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll
    
    console.log('Testing URL:', testUrl);
    console.log('Validating URL...');
    
    const isValid = ytdl.validateURL(testUrl);
    console.log('URL is valid:', isValid);
    
    if (!isValid) {
      throw new Error('URL is not valid');
    }
    
    console.log('Fetching video info...');
    const info = await ytdl.getInfo(testUrl, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    });
    
    console.log('Success! Video title:', info.videoDetails.title);
    console.log('Video author:', info.videoDetails.author.name);
    console.log('Available formats:', info.formats.length);
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

testYtdl();

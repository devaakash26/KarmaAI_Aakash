import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a JPEG, PNG, or GIF image.' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a unique filename with timestamp to prevent caching issues
    const timestamp = Date.now();
    const fileName = `${session.user.id || 'user'}_${timestamp}`;
    
    console.log(`Starting Cloudinary upload for user ${session.user.id}, file type: ${file.type}`);
    
    // Upload to Cloudinary using buffer upload
    const uploadPromise = new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'profile_images',
          public_id: fileName,
          transformation: [
            { width: 250, height: 250, crop: 'fill', gravity: 'face' }
          ],
          format: 'jpg', // Force jpg format for consistency
          quality: 'auto:good', // Good quality but optimized
          fetch_format: 'auto', // Optimize delivery format
          delivery: 'upload', // Ensure immediate availability
          invalidate: true, // Invalidate CDN cache for this image if it exists
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });
    
    const result = await uploadPromise;
    
    // Validate the result
    if (!result || !result.secure_url) {
      throw new Error('Invalid response from Cloudinary');
    }
    
    // Create properly formatted URLs with cache busting
    const originalUrl = result.secure_url;
    
    // Add a timestamp parameter for cache busting
    const cachedUrl = originalUrl.includes('?') 
      ? `${originalUrl}&t=${timestamp}` 
      : `${originalUrl}?t=${timestamp}`;
    
    // Create a correctly formatted forced version URL
    // Example: from /upload/v1234/path to /upload/v9999/path
    const urlParts = originalUrl.split('/upload/');
    if (urlParts.length !== 2) {
      throw new Error('Unexpected URL format from Cloudinary');
    }
    
    const forcedUrl = `${urlParts[0]}/upload/v${timestamp}/${urlParts[1].split('/').slice(1).join('/')}`;
    
    // Log the result for debugging
    console.log('Cloudinary upload successful:', {
      original_url: originalUrl,
      cache_busted_url: cachedUrl,
      forced_version_url: forcedUrl,
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height
    });
    
    return NextResponse.json({
      url: originalUrl, // Return the original URL without cache busting
      cachedUrl: cachedUrl, // Return URL with cache busting
      forcedUrl: forcedUrl, // Return URL with forced version
      public_id: result.public_id,
      timestamp: timestamp // Include the timestamp for additional cache busting
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file: ' + error.message }, { status: 500 });
  }
} 
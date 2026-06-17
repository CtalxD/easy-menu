// backend/src/controllers/uploadController.ts
import { Request, Response } from 'express';
import cloudinary from '../lib/cloudinary';
import { prisma } from '../lib/prisma';

export const uploadMenuItemImage = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== Upload Request Received ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('File present:', req.file ? 'YES' : 'NO');
    console.log('File details:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    } : 'none');
    console.log('Body keys:', Object.keys(req.body));

    const file = req.file;
    const { itemId } = req.body;
    const userId = (req as any).userId;

    console.log('userId from token:', userId);
    console.log('itemId from body:', itemId);

    if (!file) {
      console.log('ERROR: No file in request');
      res.status(400).json({ message: 'No image file provided. Make sure the field name is "image".' });
      return;
    }

    if (!userId) {
      console.log('ERROR: No userId — token middleware may have failed');
      res.status(401).json({ message: 'Unauthorized — please log in again' });
      return;
    }

    // Verify user exists and has a restaurant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      console.log('ERROR: User or restaurant not found for userId:', userId);
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    // If itemId is provided, verify ownership
    if (itemId && itemId.trim() !== '') {
      const menuItem = await prisma.menuItem.findFirst({
        where: { id: itemId, restaurantId: user.restaurants[0].id },
      });

      if (!menuItem) {
        console.log('ERROR: Menu item not found or not owned by user:', itemId);
        res.status(404).json({ message: 'Menu item not found' });
        return;
      }
    }

    // Convert buffer to base64 for Cloudinary upload
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    console.log('Uploading to Cloudinary...');
    console.log('File size (bytes):', file.size);
    console.log('MIME type:', file.mimetype);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'easymenu-menu-items',
      transformation: [
        { width: 800, height: 800, crop: 'limit', quality: 'auto' },
      ],
    });

    console.log('Cloudinary upload successful!');
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.public_id);

    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error: any) {
    console.error('=== Upload Image Error ===');
    console.error('Error message:', error?.message);
    console.error('Full error:', error);

    // Cloudinary-specific error handling
    if (error?.http_code) {
      res.status(400).json({
        message: `Cloudinary error: ${error.message}`,
        code: error.http_code,
      });
      return;
    }

    res.status(500).json({ message: 'Image upload failed. Please try again.' });
  }
};
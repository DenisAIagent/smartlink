const { v2: cloudinary } = require('cloudinary');

// Configuration Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
} else {
  console.warn('⚠️ CLOUDINARY_URL non configuré - upload images désactivé');
}

const uploadService = {
  /**
   * Upload image vers Cloudinary
   */
  async uploadImage(buffer, options = {}) {
    try {
      if (!process.env.CLOUDINARY_URL) {
        throw new Error('Cloudinary non configuré');
      }

      const uploadOptions = {
        folder: 'mdmc-smartlinks',
        resource_type: 'image',
        quality: 'auto:good',
        format: 'auto',
        transformation: [
          { width: 800, height: 800, crop: 'fill', gravity: 'center' },
          { quality: 'auto:good' }
        ],
        ...options
      };

      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error);
              reject(error);
            } else {
              if (process.env.DEBUG_UPLOAD === 'true') {
                console.log('✅ Image uploaded:', result.secure_url);
              }
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes
              });
            }
          }
        ).end(buffer);
      });

    } catch (error) {
      console.error('❌ Upload service error:', error);
      throw error;
    }
  },

  /**
   * Supprimer image de Cloudinary
   */
  async deleteImage(publicId) {
    try {
      if (!process.env.CLOUDINARY_URL) {
        console.warn('Cloudinary non configuré - impossible de supprimer');
        return;
      }

      const result = await cloudinary.uploader.destroy(publicId);
      if (process.env.DEBUG_UPLOAD === 'true') {
        console.log('🗑️ Image supprimée:', publicId, result);
      }
      return result;

    } catch (error) {
      console.error('❌ Delete image error:', error);
      throw error;
    }
  },

  /**
   * Générer URL avec transformations
   */
  generateUrl(publicId, transformations = {}) {
    try {
      if (!process.env.CLOUDINARY_URL) {
        return null;
      }

      return cloudinary.url(publicId, {
        secure: true,
        ...transformations
      });

    } catch (error) {
      console.error('❌ Generate URL error:', error);
      return null;
    }
  },

  /**
   * Upload audio vers Cloudinary
   */
  async uploadAudio(buffer, options = {}) {
    try {
      if (!process.env.CLOUDINARY_URL) {
        throw new Error('Cloudinary non configuré');
      }

      const uploadOptions = {
        folder: 'mdmc-smartlinks/audio',
        resource_type: 'video', // Cloudinary traite l'audio comme 'video'
        quality: 'auto',
        ...options
      };

      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary audio upload error:', error);
              reject(error);
            } else {
              if (process.env.DEBUG_UPLOAD === 'true') {
                console.log('✅ Audio uploaded:', result.secure_url);
              }
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                duration: result.duration,
                bytes: result.bytes
              });
            }
          }
        ).end(buffer);
      });

    } catch (error) {
      console.error('❌ Audio upload service error:', error);
      throw error;
    }
  },

  /**
   * Valider fichier image
   */
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Format non supporté. Utilisez JPG, PNG ou WebP.');
    }

    if (file.size > maxSize) {
      throw new Error('Fichier trop volumineux. Maximum 10MB.');
    }

    return true;
  },

  /**
   * Valider fichier audio
   */
  validateAudioFile(file) {
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
      'audio/mp4', 'audio/aac', 'audio/m4a', 'audio/webm'
    ];
    const maxSize = 25 * 1024 * 1024; // 25MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Format audio non supporté. Utilisez MP3, WAV, OGG, M4A ou AAC.');
    }

    if (file.size > maxSize) {
      throw new Error('Fichier audio trop volumineux. Maximum 25MB.');
    }

    return true;
  }
};

module.exports = { uploadService };
/**
 * Configuration Cloudinary pour uploads audio
 */

// Configuration (à mettre dans .env en production)
const CLOUDINARY_CONFIG = {
	cloud_name: 'your_cloud_name',
	api_key: 'your_api_key', 
	api_secret: 'your_api_secret'
};

// Initialize only on server-side
let cloudinary = null;

/**
 * Upload un fichier audio vers Cloudinary
 * @param {File} audioFile - Le fichier audio à uploader
 * @returns {Promise<string>} URL du fichier uploadé
 */
export async function uploadAudio(audioFile) {
	// Skip upload on client-side for now
	if (typeof window !== 'undefined') {
		console.warn('Audio upload not available on client-side');
		return null;
	}
	
	try {
		// Initialize cloudinary if not done
		if (!cloudinary) {
			const { v2 } = await import('cloudinary');
			cloudinary = v2;
			cloudinary.config(CLOUDINARY_CONFIG);
		}
		
		// Convertir le fichier en base64 pour l'upload
		const buffer = await audioFile.arrayBuffer();
		const base64 = Buffer.from(buffer).toString('base64');
		const dataURI = `data:${audioFile.type};base64,${base64}`;
		
		// Upload vers Cloudinary
		const result = await cloudinary.uploader.upload(dataURI, {
			resource_type: 'video', // Pour les fichiers audio
			folder: 'smartlink-previews',
			format: 'mp3',
			duration: 30, // Limiter à 30 secondes
			quality: 'auto:low', // Compression pour web
			eager: [
				{
					duration: 30,
					start_offset: 0,
					format: 'mp3',
					quality: 'auto:low'
				}
			],
			public_id: `preview_${Date.now()}` // ID unique
		});
		
		console.log('Audio uploaded successfully:', result.secure_url);
		return result.secure_url;
		
	} catch (error) {
		console.error('Cloudinary upload error:', error);
		throw new Error('Erreur lors de l\'upload audio: ' + error.message);
	}
}

/**
 * Configuration widget Cloudinary pour le front-end
 */
export const CLOUDINARY_WIDGET_CONFIG = {
	cloudName: CLOUDINARY_CONFIG.cloud_name,
	uploadPreset: 'smartlink_audio', // À créer dans Cloudinary dashboard
	sources: ['local', 'url'],
	multiple: false,
	resourceType: 'video', // Pour audio
	clientAllowedFormats: ['mp3', 'wav', 'ogg', 'm4a'],
	maxFileSize: 10000000, // 10MB max
	maxVideoDuration: 30, // 30 secondes max
	cropping: false,
	folder: 'smartlink-previews'
};

/**
 * Version simplifiée pour la démo (sans vraie configuration Cloudinary)
 */
export function uploadAudioDemo(audioFile) {
	return new Promise((resolve) => {
		// Simuler un upload et retourner une URL démo
		setTimeout(() => {
			const demoUrl = `https://res.cloudinary.com/demo/video/upload/v1234567890/smartlink-previews/preview_${Date.now()}.mp3`;
			console.log('Demo audio upload:', demoUrl);
			resolve(demoUrl);
		}, 2000);
	});
}
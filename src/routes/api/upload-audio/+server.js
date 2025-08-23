import { json } from '@sveltejs/kit';

// Mode démo : utilise des URLs factices au lieu de vraiment uploader
const DEMO_MODE = true;

export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const audioFile = formData.get('audio');
		
		if (!audioFile || !audioFile.size) {
			return json({ error: 'Aucun fichier audio fourni' }, { status: 400 });
		}
		
		// Validate file size (10MB max)
		if (audioFile.size > 10 * 1024 * 1024) {
			return json({ error: 'Le fichier ne doit pas dépasser 10MB' }, { status: 400 });
		}
		
		// Validate file type
		if (!audioFile.type.startsWith('audio/')) {
			return json({ error: 'Le fichier doit être un fichier audio' }, { status: 400 });
		}
		
		console.log('Audio file received:', {
			name: audioFile.name,
			type: audioFile.type,
			size: audioFile.size
		});
		
		if (DEMO_MODE) {
			// Mode démo : simuler un upload et retourner une URL démo
			await new Promise(resolve => setTimeout(resolve, 2000)); // Simuler le temps d'upload
			
			const demoUrl = `https://res.cloudinary.com/demo/video/upload/v1234567890/smartlink-previews/preview_${Date.now()}.mp3`;
			
			console.log('Demo audio upload simulated:', demoUrl);
			
			return json({ 
				url: demoUrl,
				duration: 30,
				format: 'mp3'
			});
		} else {
			// Mode production : vraie implémentation Cloudinary
			const { v2: cloudinary } = await import('cloudinary');
			
			// Configuration Cloudinary (utiliser des variables d'environnement en production)
			cloudinary.config({
				cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
				api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
				api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
			});
			
			// Convert file to buffer
			const buffer = await audioFile.arrayBuffer();
			const base64 = Buffer.from(buffer).toString('base64');
			const dataURI = `data:${audioFile.type};base64,${base64}`;
			
			// Upload to Cloudinary
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
			
			return json({ 
				url: result.secure_url,
				duration: result.duration,
				format: result.format
			});
		}
		
	} catch (error) {
		console.error('Audio upload error:', error);
		return json({ 
			error: 'Erreur lors de l\'upload: ' + error.message 
		}, { status: 500 });
	}
}
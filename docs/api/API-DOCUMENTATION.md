# Documentation API - MDMC Admin Interface

## 🔗 Communications Backend

### Configuration Base

```javascript
// Configuration API dynamique
window.MDMC_CONFIG = {
  API_BASE_URL: 'http://localhost:3002',
  ADMIN_VERSION: '1.0.0',
  ENVIRONMENT: 'development',
  FEATURES: {
    AUDIO_UPLOAD: true,
    ANALYTICS: true,
    BULK_OPERATIONS: true
  }
};
```

## 📡 Endpoints API Utilisés

### 1. SmartLinks Management

#### GET `/api/smartlinks`
Récupère la liste de tous les SmartLinks

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {token} (optionnel en dev)
```

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "689e63bf1581bfaa3e224bb9",
      "trackTitle": "Wait and Bleed",
      "slug": "wait-and-bleed-687691",
      "artistId": {
        "_id": "689e63bf1581bfaa3e224b8f",
        "name": "Slipknot",
        "slug": "slipknot"
      },
      "coverImageUrl": "https://i.scdn.co/image/ab67616d0000b273...",
      "description": "Listen to Wait and Bleed by Slipknot...",
      "platformLinks": [
        {
          "platform": "Spotify",
          "url": "https://open.spotify.com/track/..."
        },
        {
          "platform": "YouTube",
          "url": "https://www.youtube.com/watch?v=..."
        }
      ],
      "viewCount": 42,
      "platformClickCount": 15,
      "isPublished": true,
      "createdAt": "2025-08-14T22:28:37.318Z",
      "updatedAt": "2025-08-14T22:28:37.318Z"
    }
  ],
  "total": 55,
  "page": 1,
  "limit": 50
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Database connection failed",
  "code": "DB_ERROR"
}
```

#### POST `/api/proxy/create-smartlink`
Crée un nouveau SmartLink

**Request Body:**
```json
{
  "trackTitle": "Never Gonna Give You Up",
  "artistName": "Rick Astley",
  "slug": "never-gonna-give-you-up-test", // optionnel, généré auto
  "coverImageUrl": "https://i.scdn.co/image/...",
  "description": "Écoutez sur votre plateforme préférée",
  "platformLinks": [
    {
      "platform": "Spotify",
      "url": "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC"
    },
    {
      "platform": "YouTube",
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  ],
  "previewAudioUrl": "https://cloudinary.com/audio/preview.mp3", // optionnel
  "isPublished": true
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "_id": "689e63151581bfaa3e224b92",
    "trackTitle": "Never Gonna Give You Up",
    "slug": "never-gonna-give-you-up-test-517265",
    "artistId": {
      "_id": "689e63151581bfaa3e224b8f",
      "name": "Rick Astley",
      "slug": "rick-astley"
    },
    "coverImageUrl": "https://i.scdn.co/image/...",
    "description": "Écoutez sur votre plateforme préférée",
    "customSubtitle": "Choose music service",
    "platformLinks": [
      {
        "platform": "Spotify",
        "url": "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC"
      }
    ],
    "viewCount": 0,
    "platformClickCount": 0,
    "isPublished": true,
    "createdAt": "2025-08-14T22:28:37.318Z",
    "updatedAt": "2025-08-14T22:28:37.318Z"
  }
}
```

#### DELETE `/api/v1/smartlinks/:id`
Supprime un SmartLink

**Parameters:**
- `id` (string): ID du SmartLink à supprimer

**Response Success (200):**
```json
{
  "success": true,
  "message": "SmartLink supprimé avec succès",
  "deletedId": "689e63151581bfaa3e224b92"
}
```

### 2. Metadata & Odesli Integration

#### GET `/api/proxy/fetch-metadata`
Récupère les métadonnées d'une URL musicale via Odesli

**Query Parameters:**
- `url` (string, required): URL de la musique (Spotify, Apple Music, etc.)

**Example Request:**
```http
GET /api/proxy/fetch-metadata?url=https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "title": "Never Gonna Give You Up",
    "artistName": "Rick Astley",
    "album": "Whenever You Need Somebody",
    "thumbnailUrl": "https://i.scdn.co/image/ab67616d0000b273...",
    "isrc": "GBUM71505078",
    "type": "song",
    "links": {
      "Amazon Music": {
        "url": "https://music.amazon.com/albums/B0F4RQ7X1Q?trackAsin=B0F4RTRVXW",
        "entityUniqueId": "AMAZON_SONG::B0F4RTRVXW"
      },
      "Deezer": {
        "url": "https://www.deezer.com/track/781592622",
        "entityUniqueId": "DEEZER_SONG::781592622"
      },
      "Apple Music": {
        "url": "https://geo.music.apple.com/fr/album/_/1612648318?i=1612648319...",
        "nativeAppUriMobile": "music://itunes.apple.com/fr/album/_/1612648318...",
        "entityUniqueId": "ITUNES_SONG::1612648319"
      },
      "Spotify": {
        "url": "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
        "nativeAppUriDesktop": "spotify:track:4uLU6hMCjMI75M1A2tKUQC",
        "entityUniqueId": "SPOTIFY_SONG::4uLU6hMCjMI75M1A2tKUQC"
      },
      "YouTube": {
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "entityUniqueId": "YOUTUBE_VIDEO::dQw4w9WgXcQ"
      },
      "YouTube Music": {
        "url": "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
        "entityUniqueId": "YOUTUBE_VIDEO::dQw4w9WgXcQ"
      }
    },
    "alternativeArtworks": [
      {
        "url": "https://i.scdn.co/image/ab67616d0000b273...",
        "width": 640,
        "height": 640,
        "source": "spotify"
      }
    ],
    "pageUrl": "https://song.link/s/4uLU6hMCjMI75M1A2tKUQC",
    "entityId": "SPOTIFY_SONG::4uLU6hMCjMI75M1A2tKUQC",
    "apiProvider": "spotify",
    "inputType": "spotify_url",
    "userCountry": "FR",
    "timestamp": "2025-08-14T22:28:12.784Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "URL invalide ou non supportée",
  "details": "L'URL fournie n'est pas reconnue par Odesli"
}
```

### 3. File Upload

#### POST `/api/upload/audio`
Upload un fichier audio pour extrait

**Request:**
```http
Content-Type: multipart/form-data

file: [audio file] (MP3, WAV, M4A)
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/mdmc/audio/upload/v1234567890/preview_abc123.mp3",
    "publicId": "preview_abc123",
    "format": "mp3",
    "duration": 28.5,
    "size": 456789,
    "originalName": "preview.mp3"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Veuillez télécharger un fichier audio.",
  "acceptedFormats": ["mp3", "wav", "m4a"]
}
```

### 4. Health & Status

#### GET `/health`
Vérification santé de l'interface admin

**Response Success (200):**
```json
{
  "status": "OK",
  "service": "MDMC Admin Interface",
  "version": "1.0.0",
  "timestamp": "2025-08-14T22:45:40.582Z",
  "backend": "http://localhost:3002"
}
```

## 🔧 Client API Helper

### Classe MDMCAdmin

```javascript
class MDMCAdmin {
  constructor() {
    this.config = window.MDMC_CONFIG || {
      API_BASE_URL: 'http://localhost:3002',
      ENVIRONMENT: 'development'
    };
  }

  // Méthode générique d'appel API
  async apiCall(endpoint, options = {}) {
    const url = `${this.config.API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Ajout token authentification
    const token = localStorage.getItem('adminToken');
    if (token) {
      defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ API Error:', error);
      this.showNotification('Erreur de communication avec le serveur', 'danger');
      throw error;
    }
  }

  // Upload de fichier spécialisé
  async uploadFile(file, endpoint = '/api/upload') {
    const formData = new FormData();
    formData.append('file', file);

    return await this.apiCall(endpoint, {
      method: 'POST',
      body: formData,
      headers: {} // Supprime Content-Type pour multipart
    });
  }
}
```

### Exemples d'Usage

```javascript
// Instance globale
const admin = new MDMCAdmin();

// 1. Récupérer tous les SmartLinks
async function loadSmartLinks() {
  try {
    const response = await admin.apiCall('/api/smartlinks');
    if (response.success) {
      return response.data;
    }
  } catch (error) {
    console.error('Erreur chargement SmartLinks:', error);
  }
}

// 2. Créer un SmartLink
async function createSmartLink(smartlinkData) {
  try {
    const response = await admin.apiCall('/api/proxy/create-smartlink', {
      method: 'POST',
      body: JSON.stringify(smartlinkData)
    });
    
    if (response.success) {
      return response.data;
    }
  } catch (error) {
    console.error('Erreur création SmartLink:', error);
  }
}

// 3. Fetch métadonnées
async function fetchMetadata(sourceUrl) {
  try {
    const encodedUrl = encodeURIComponent(sourceUrl);
    const response = await admin.apiCall(`/api/proxy/fetch-metadata?url=${encodedUrl}`);
    
    if (response.success) {
      return response.data;
    }
  } catch (error) {
    console.error('Erreur fetch metadata:', error);
  }
}

// 4. Upload audio
async function uploadAudio(audioFile) {
  try {
    const response = await admin.uploadFile(audioFile, '/api/upload/audio');
    
    if (response.success) {
      return response.data.url;
    }
  } catch (error) {
    console.error('Erreur upload audio:', error);
  }
}
```

## 🔒 Authentification & Sécurité

### Token Management

```javascript
// Gestion des tokens
class AuthManager {
  static setToken(token) {
    localStorage.setItem('adminToken', token);
    console.log('Token admin défini');
  }
  
  static getToken() {
    return localStorage.getItem('adminToken') || 'dev-token-bypass';
  }
  
  static clearToken() {
    localStorage.removeItem('adminToken');
    console.log('Token admin supprimé');
  }
  
  static isAuthenticated() {
    return !!this.getToken();
  }
}
```

### Headers de Sécurité

```javascript
// Headers automatiques
const securityHeaders = {
  'X-Requested-With': 'XMLHttpRequest',
  'X-Admin-Interface': 'MDMC-v1.0.0',
  'X-Timestamp': Date.now().toString()
};
```

## ⚡ Optimisations Performance

### Cache et Debouncing

```javascript
// Cache en mémoire pour les métadonnées
const metadataCache = new Map();

async function fetchMetadataWithCache(url) {
  if (metadataCache.has(url)) {
    console.log('Cache hit for:', url);
    return metadataCache.get(url);
  }
  
  const data = await admin.apiCall(`/api/proxy/fetch-metadata?url=${encodeURIComponent(url)}`);
  metadataCache.set(url, data);
  
  // Expiration cache après 1h
  setTimeout(() => metadataCache.delete(url), 3600000);
  
  return data;
}

// Debouncing pour recherche
const debouncedSearch = admin.debounce(async (query) => {
  const results = await admin.apiCall(`/api/smartlinks?search=${encodeURIComponent(query)}`);
  displaySearchResults(results);
}, 300);
```

### Retry Logic

```javascript
// Retry automatique avec backoff
async function apiCallWithRetry(endpoint, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await admin.apiCall(endpoint, options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // Backoff exponentiel
      console.warn(`Retry ${i + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## 🐛 Gestion d'Erreurs

### Types d'Erreurs

```javascript
const ErrorTypes = {
  NETWORK: 'network_error',
  VALIDATION: 'validation_error', 
  AUTHENTICATION: 'auth_error',
  PERMISSION: 'permission_error',
  SERVER: 'server_error',
  UNKNOWN: 'unknown_error'
};

// Classification automatique des erreurs
function classifyError(error) {
  if (error.code === 'ECONNREFUSED') return ErrorTypes.NETWORK;
  if (error.status === 401) return ErrorTypes.AUTHENTICATION;
  if (error.status === 403) return ErrorTypes.PERMISSION;
  if (error.status >= 400 && error.status < 500) return ErrorTypes.VALIDATION;
  if (error.status >= 500) return ErrorTypes.SERVER;
  return ErrorTypes.UNKNOWN;
}
```

### Error Boundary

```javascript
// Gestionnaire global d'erreurs
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  admin.showNotification(
    'Une erreur inattendue est survenue', 
    'danger'
  );
  
  // Log vers service de monitoring
  logError({
    type: 'unhandled_rejection',
    error: event.reason,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });
});
```

Cette documentation API fournit tous les détails nécessaires pour comprendre et utiliser l'interface admin MDMC avec le backend.
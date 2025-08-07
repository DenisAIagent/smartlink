import { fetchOdesliData, createSmartlink } from './api.js';

// --- Auth Check ---
(function() {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '/login.html';
    }
})();

// --- DOM Elements ---
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const fetchBtn = document.getElementById('fetch-btn');
const saveBtn = document.getElementById('save-btn');
const songUrlInput = document.getElementById('song-url');
const artworkPreview = document.getElementById('artwork-preview');
const titleInput = document.getElementById('title');
const artistInput = document.getElementById('artist');
const platformLinksContainer = document.getElementById('platform-links-container');

let fetchedData = {};

// --- Step Navigation ---
function goToStep(stepNumber) {
    step1.classList.remove('active');
    step2.classList.remove('active');
    document.getElementById(`step-${stepNumber}`).classList.add('active');
}

// --- Event Listeners ---
fetchBtn.addEventListener('click', async () => {
    const url = songUrlInput.value;
    if (!url) {
        alert('Please enter a song URL.');
        return;
    }

    fetchBtn.textContent = 'Fetching...';
    fetchBtn.disabled = true;

    try {
        const data = await fetchOdesliData(url);
        fetchedData = data; // Store the full response

        const entity = data.entitiesByUniqueId[data.entityUniqueId];

        // Populate Step 2 form
        artworkPreview.src = entity.thumbnailUrl;
        titleInput.value = entity.title;
        artistInput.value = entity.artistName;

        platformLinksContainer.innerHTML = ''; // Clear previous links
        for (const platform in data.linksByPlatform) {
            const linkData = data.linksByPlatform[platform];
            const platformDiv = document.createElement('div');
            platformDiv.innerHTML = `
                <label for="${platform}">${platform}</label>
                <input type="url" id="${platform}" value="${linkData.url}" readonly>
            `;
            platformLinksContainer.appendChild(platformDiv);
        }

        goToStep(2);

    } catch (error) {
        alert(`Failed to fetch metadata: ${error.message}`);
    } finally {
        fetchBtn.textContent = 'Fetch Metadata';
        fetchBtn.disabled = false;
    }
});

saveBtn.addEventListener('click', async () => {
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    const payload = {
        title: titleInput.value,
        artist_name: artistInput.value,
        artwork_url: artworkPreview.src,
        spotify_url: document.getElementById('spotify')?.value || null,
        apple_music_url: document.getElementById('appleMusic')?.value || null,
        youtube_url: document.getElementById('youtube')?.value || null,
    };

    try {
        await createSmartlink(payload);
        alert('Smartlink created successfully!');
        window.location.href = '/dashboard.html';
    } catch (error) {
        alert(`Failed to save smartlink: ${error.message}`);
    } finally {
        saveBtn.textContent = 'Save Smartlink';
        saveBtn.disabled = false;
    }
});

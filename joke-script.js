// State management
let jokeCounter = 0;
let favorites = [];
let currentJoke = null;

// Load favorites from localStorage on page load
window.addEventListener('DOMContentLoaded', () => {
    loadFavorites();
    getNewJoke();
});

// Get new joke from API
async function getNewJoke() {
    const loading = document.getElementById('loading');
    const jokeContent = document.getElementById('jokeContent');
    const errorMessage = document.getElementById('errorMessage');
    
    // Show loading state
    loading.style.display = 'block';
    jokeContent.style.display = 'none';
    errorMessage.style.display = 'none';
    
    try {
        // Build API URL based on filters
        const category = document.getElementById('jokeCategory').value;
        const type = document.getElementById('jokeType').value;
        
        let apiUrl = 'https://v2.jokeapi.dev/joke/';
        
        if (category) {
            apiUrl += category;
        } else {
            apiUrl += 'Any';
        }
        
        // Add type filter if selected
        if (type) {
            apiUrl += `?type=${type}`;
        }
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch joke');
        }
        
        const data = await response.json();
        
        // Check if joke was found
        if (data.error) {
            throw new Error('No jokes found with these filters');
        }
        
        currentJoke = data;
        displayJoke(data);
        jokeCounter++;
        updateStats();
        
    } catch (error) {
        showError(error.message);
    } finally {
        loading.style.display = 'none';
    }
}

// Display joke on page
function displayJoke(joke) {
    const jokeContent = document.getElementById('jokeContent');
    const errorMessage = document.getElementById('errorMessage');
    const setup = document.getElementById('setup');
    const delivery = document.getElementById('delivery');
    const typeBadge = document.getElementById('typeBadge');
    const jokeNumber = document.getElementById('jokeNumber');
    const copyBtn = document.getElementById('copyBtn');
    const shareBtn = document.getElementById('shareBtn');
    
    // Clear previous content
    setup.textContent = '';
    delivery.textContent = '';
    
    if (joke.type === 'single') {
        // Single joke
        setup.textContent = joke.joke;
        delivery.style.display = 'none';
        typeBadge.textContent = 'Single';
    } else if (joke.type === 'twopart') {
        // Two-part joke
        setup.textContent = joke.setup;
        delivery.textContent = joke.delivery;
        delivery.style.display = 'block';
        typeBadge.textContent = 'Two-Part';
    }
    
    // Update joke number and category
    const category = joke.category.charAt(0).toUpperCase() + joke.category.slice(1);
    jokeNumber.textContent = `Joke #${jokeCounter} • ${category}`;
    
    // Show buttons
    jokeContent.style.display = 'block';
    errorMessage.style.display = 'none';
    copyBtn.style.display = 'flex';
    shareBtn.style.display = 'flex';
    
    // Update favorite button
    updateFavoriteButton();
}

// Show error message
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const jokeContent = document.getElementById('jokeContent');
    
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    jokeContent.style.display = 'none';
}

// Copy joke to clipboard
function copyToClipboard() {
    if (!currentJoke) return;
    
    let jokeText = '';
    
    if (currentJoke.type === 'single') {
        jokeText = currentJoke.joke;
    } else {
        jokeText = currentJoke.setup + '\n' + currentJoke.delivery;
    }
    
    navigator.clipboard.writeText(jokeText).then(() => {
        const copyBtn = document.getElementById('copyBtn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyBtn.style.background = 'var(--success-color)';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '';
        }, 2000);
    }).catch(err => {
        alert('Failed to copy joke');
    });
}

// Share joke
function shareJoke() {
    if (!currentJoke) return;
    
    let jokeText = '';
    
    if (currentJoke.type === 'single') {
        jokeText = currentJoke.joke;
    } else {
        jokeText = currentJoke.setup + '\n' + currentJoke.delivery;
    }
    
    if (navigator.share) {
        navigator.share({
            title: 'Check out this joke!',
            text: jokeText
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy to clipboard
        copyToClipboard();
    }
}

// Add joke to favorites
function addToFavorites() {
    if (!currentJoke) return;
    
    const jokeId = generateJokeId(currentJoke);
    
    // Check if already in favorites
    if (favorites.some(fav => generateJokeId(fav) === jokeId)) {
        removeFromFavorites(jokeId);
        return;
    }
    
    favorites.push(currentJoke);
    saveFavorites();
    updateStats();
    updateFavoriteButton();
    
    // Show feedback
    showNotification('Added to favorites! ❤️');
}

// Remove from favorites
function removeFromFavorites(jokeId) {
    favorites = favorites.filter(fav => generateJokeId(fav) !== jokeId);
    saveFavorites();
    updateStats();
    updateFavoriteButton();
    displayFavorites();
    showNotification('Removed from favorites');
}

// Generate unique ID for joke
function generateJokeId(joke) {
    return joke.type === 'single' ? joke.joke : joke.setup + joke.delivery;
}

// Update favorite button appearance
function updateFavoriteButton() {
    if (!currentJoke) return;
    
    const jokeId = generateJokeId(currentJoke);
    const isFavorite = favorites.some(fav => generateJokeId(fav) === jokeId);
    
    let favoriteBtn = document.getElementById('favoriteBtn');
    
    if (!favoriteBtn) {
        // Create favorite button if it doesn't exist
        const controls = document.querySelector('.controls');
        favoriteBtn = document.createElement('button');
        favoriteBtn.id = 'favoriteBtn';
        favoriteBtn.className = 'btn btn-secondary';
        favoriteBtn.onclick = addToFavorites;
        controls.appendChild(favoriteBtn);
    }
    
    if (isFavorite) {
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
        favoriteBtn.style.color = 'var(--danger-color)';
    } else {
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Add to Favorites';
        favoriteBtn.style.color = 'var(--text-dark)';
    }
    
    favoriteBtn.style.display = 'flex';
}

// Display favorites
function displayFavorites() {
    const favoritesContent = document.getElementById('favoritesContent');
    
    if (favorites.length === 0) {
        favoritesContent.innerHTML = '<div class="empty-message">No favorites yet. Add a joke to get started!</div>';
        return;
    }
    
    favoritesContent.innerHTML = favorites.map((joke, index) => {
        const jokeId = generateJokeId(joke);
        let jokeText = joke.type === 'single' ? joke.joke : joke.setup + ' ' + joke.delivery;
        
        return `
            <div class="favorite-item">
                <p>${jokeText}</p>
                <button onclick="removeFromFavorites('${jokeId.replace(/'/g, "\\'")}')">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        `;
    }).join('');
}

// Toggle favorites panel
function toggleFavorites() {
    const favoritesList = document.getElementById('favoritesList');
    const isHidden = favoritesList.style.display === 'none';
    
    if (isHidden) {
        favoritesList.style.display = 'block';
        displayFavorites();
    } else {
        favoritesList.style.display = 'none';
    }
}

// Clear all favorites
function clearFavorites() {
    if (confirm('Are you sure you want to delete all favorites?')) {
        favorites = [];
        saveFavorites();
        updateStats();
        displayFavorites();
        updateFavoriteButton();
        showNotification('All favorites cleared');
    }
}

// Save favorites to localStorage
function saveFavorites() {
    localStorage.setItem('jokeGeneratorFavorites', JSON.stringify(favorites));
}

// Load favorites from localStorage
function loadFavorites() {
    const stored = localStorage.getItem('jokeGeneratorFavorites');
    if (stored) {
        try {
            favorites = JSON.parse(stored);
        } catch (e) {
            favorites = [];
        }
    }
    updateStats();
}

// Update stats display
function updateStats() {
    document.getElementById('jokeCount').textContent = jokeCounter;
    document.getElementById('favoriteCount').textContent = favorites.length;
    document.getElementById('favCount').textContent = favorites.length;
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, var(--success-color) 0%, #059669 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        getNewJoke();
    }
    
    if (e.code === 'KeyC' && e.ctrlKey) {
        e.preventDefault();
        copyToClipboard();
    }
});

// Prefetch next joke on idle
let prefetchTimeout;
function prefetchNextJoke() {
    clearTimeout(prefetchTimeout);
    prefetchTimeout = setTimeout(() => {
        // Optionally prefetch, but don't display
    }, 3000);
}
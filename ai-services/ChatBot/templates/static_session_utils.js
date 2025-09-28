// Function to get a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Function to set a cookie
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Function to display session info in the UI
function displaySessionInfo() {
    const sessionId = getCookie('chat_session_id');
    if (sessionId) {
        const sessionInfoElement = document.getElementById('session-info');
        if (sessionInfoElement) {
            // Format: Show first 8 chars + "..."
            sessionInfoElement.textContent = `Session: ${sessionId.substring(0, 8)}...`;
            sessionInfoElement.style.display = 'block';
        }
    }
}

// Function to handle starting a new conversation
function startNewConversation() {
    // Show loading overlay
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
    
    fetch('/api/clear', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'  // Include cookies
    })
    .then(response => response.json())
    .then(data => {
        // Clear the chat messages except welcome message
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            // Keep only the first welcome message
            const welcomeMessage = chatMessages.querySelector('.bot-message');
            chatMessages.innerHTML = '';
            if (welcomeMessage) {
                chatMessages.appendChild(welcomeMessage);
            }
        }
        
        // Add system message about new conversation
        const systemMessage = document.createElement('div');
        systemMessage.className = 'message system-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const messageP = document.createElement('p');
        messageP.textContent = 'Started a new conversation';
        
        contentDiv.appendChild(messageP);
        systemMessage.appendChild(contentDiv);
        
        chatMessages.appendChild(systemMessage);
        
        // Update the session info with new session ID
        if (data.session_id) {
            // Save new session ID in global variable (for script.js)
            window.sessionId = data.session_id;
            displaySessionInfo();
        }
        
        // Hide loading overlay
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error starting new conversation:', error);
        // Hide loading overlay
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        // Show error message
        const errorToast = document.getElementById('errorToast');
        const errorMessage = document.getElementById('errorMessage');
        if (errorToast && errorMessage) {
            errorMessage.textContent = 'Failed to start new conversation';
            errorToast.style.display = 'flex';
            setTimeout(() => {
                errorToast.style.display = 'none';
            }, 5000);
        }
    });
}

// Initialize session management
document.addEventListener('DOMContentLoaded', function() {
    // Display current session info
    displaySessionInfo();
    
    // Set up clear chat button event listener
    const clearChatButton = document.getElementById('clear-chat');
    if (clearChatButton) {
        clearChatButton.addEventListener('click', startNewConversation);
    }
    
    // Sync session ID from cookie to script.js
    const sessionIdFromCookie = getCookie('chat_session_id');
    if (sessionIdFromCookie) {
        window.sessionId = sessionIdFromCookie;
    }
});
// Global variables
// Initialize with a temporary ID that will be replaced when DOM is fully loaded
let sessionId = null; 
let isWaitingForResponse = false;
let searchTimeout = null;

// DOM elements (these will be initialized when DOM is loaded)
let chatMessages;
let messageInput;
let sendButton;
let typingIndicator;
let charCount;
let errorToast;
let errorMessage;
let loadingOverlay;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize DOM elements now that they're available
    chatMessages = document.getElementById('chatMessages');
    messageInput = document.getElementById('messageInput');
    sendButton = document.getElementById('sendButton');
    typingIndicator = document.getElementById('typingIndicator');
    charCount = document.getElementById('charCount');
    errorToast = document.getElementById('errorToast');
    errorMessage = document.getElementById('errorMessage');
    loadingOverlay = document.getElementById('loadingOverlay');
    
    // Get session ID from cookie or generate a new one
    sessionId = getCookie('chat_session_id') || generateSessionId();
    
    // Set welcome message timestamp
    const welcomeTime = document.getElementById('welcomeTime');
    if (welcomeTime) {
        welcomeTime.textContent = formatTime(new Date());
    }
    
    // Add event listeners
    messageInput.addEventListener('input', handleInputChange);
    messageInput.addEventListener('keypress', handleKeyPress);
    messageInput.addEventListener('paste', handlePaste);
    
    // Focus on input
    messageInput.focus();
    
    // Auto-resize textarea
    autoResizeTextarea();
}

function handleInputChange() {
    const message = messageInput.value.trim();
    const length = messageInput.value.length;
    
    // Update character count
    charCount.textContent = `${length}/2000`;
    
    // Update send button state
    sendButton.disabled = !message || isWaitingForResponse;
    
    // Auto-resize textarea
    autoResizeTextarea();
    
    // Update character count color
    if (length > 1800) {
        charCount.style.color = '#ef4444';
    } else if (length > 1500) {
        charCount.style.color = '#f59e0b';
    } else {
        charCount.style.color = '#64748b';
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function handlePaste(event) {
    // Handle paste event to ensure character limit
    setTimeout(() => {
        if (messageInput.value.length > 2000) {
            messageInput.value = messageInput.value.substring(0, 2000);
            showError('Message truncated to 2000 characters');
        }
        handleInputChange();
    }, 10);
}

function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    const scrollHeight = messageInput.scrollHeight;
    const maxHeight = 120; // 5 lines approximately
    
    if (scrollHeight <= maxHeight) {
        messageInput.style.height = scrollHeight + 'px';
    } else {
        messageInput.style.height = maxHeight + 'px';
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || isWaitingForResponse) {
        return;
    }
    
    // Disable input and show loading state
    setLoadingState(true);
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    messageInput.value = '';
    handleInputChange();
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Determine API URL (development vs production)
        const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? `${window.location.protocol}//${window.location.host}`  // Use current host if localhost
            : 'http://localhost:5000';  // Default to localhost:5000 for direct file access
            
        // Send message to backend
        const response = await fetch(`${apiBaseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',  // Include cookies
            body: JSON.stringify({
                message: message,
                session_id: sessionId
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get response');
        }
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add bot response to chat
        addMessage(data.response, 'bot');
        
        // Update session ID if returned from server
        if (data.session_id) {
            sessionId = data.session_id;
            displaySessionInfo();
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        hideTypingIndicator();
        showError(error.message || 'Failed to send message. Please try again.');
        
        // Re-enable input on error
        setLoadingState(false);
        return;
    }
    
    // Re-enable input
    setLoadingState(false);
    messageInput.focus();
}

function addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    if (type === 'bot') {
        avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
    } else {
        avatarDiv.innerHTML = '<i class="fas fa-user"></i>';
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const messageP = document.createElement('p');
    messageP.textContent = content;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = formatTime(new Date());
    
    contentDiv.appendChild(messageP);
    contentDiv.appendChild(timeSpan);
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    scrollToBottom();
}

function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

function scrollToBottom() {
    const chatContainer = document.querySelector('.chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function setLoadingState(loading) {
    isWaitingForResponse = loading;
    sendButton.disabled = loading || !messageInput.value.trim();
    
    if (loading) {
        sendButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
        messageInput.disabled = true;
    } else {
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        messageInput.disabled = false;
    }
}

// Clear chat function now delegated to session_utils.js
// This function is kept for compatibility but now just calls the shared function
async function clearChat() {
    if (!confirm('Are you sure you want to clear the chat history?')) {
        return;
    }
    
    // Use the shared function from session_utils.js
    startNewConversation();
    
    // Focus on input
    messageInput.focus();
}

function showError(message) {
    errorMessage.textContent = message;
    errorToast.style.display = 'flex';
    
    // Auto-hide after 5 seconds
    setTimeout(hideError, 5000);
}

function hideError() {
    errorToast.style.display = 'none';
}

async function handleSearch(event) {
    const query = event.target.value.trim();
    
    // Clear existing timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Set new timeout to prevent too many requests
    searchTimeout = setTimeout(async () => {
        if (query) {
            try {
                // Determine API URL (development vs production)
                const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                    ? `${window.location.protocol}//${window.location.host}`  // Use current host if localhost
                    : 'http://localhost:5000';  // Default to localhost:5000 for direct file access
                    
                const response = await fetch(`${apiBaseUrl}/api/history?session_id=${sessionId}&query=${encodeURIComponent(query)}`, {
                    credentials: 'same-origin'  // Include cookies
                });
                const data = await response.json();
                
                // Clear current messages
                chatMessages.innerHTML = '';
                
                // Display retrieved messages
                if (data.history) {
                    data.history.split('\n').forEach(message => {
                        const [role, ...contentParts] = message.split(': ');
                        const content = contentParts.join(': '); // Handle cases where message content contains ': '
                        addMessage(content, role.toLowerCase());
                    });
                }
                
                scrollToBottom();
            } catch (error) {
                showError('Failed to search messages');
            }
        }
    }, 500); // Wait 500ms after last keystroke before searching
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// This function is kept for compatibility
// But we now prefer to use server-generated UUIDs via cookies
function generateSessionId() {
    return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    // Only show error if we have the error toast element initialized
    if (errorToast && errorMessage) {
        showError('An unexpected error occurred');
    }
});

// Handle network errors
window.addEventListener('online', function() {
    if (typeof hideError === 'function') {
        hideError();
    }
});

window.addEventListener('offline', function() {
    if (typeof showError === 'function') {
        showError('You are currently offline. Please check your internet connection.');
    }
});
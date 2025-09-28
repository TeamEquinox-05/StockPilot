// Function to get a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Function to display session information in the UI
function displaySessionInfo() {
    const sessionId = getCookie('chat_session_id');
    if (sessionId) {
        const sessionInfoElement = document.getElementById('session-info');
        if (sessionInfoElement) {
            sessionInfoElement.textContent = `Session: ${sessionId.substring(0, 8)}...`;
            sessionInfoElement.style.display = 'block';
        }
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    displaySessionInfo();
});

// Add this to your event listener for the clear chat button
document.getElementById('clear-chat').addEventListener('click', function() {
    fetch('/api/clear', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'  // Include cookies
    })
    .then(response => response.json())
    .then(data => {
        // Clear the chat messages
        document.querySelector('.chat-messages').innerHTML = '';
        
        // Update the session info
        displaySessionInfo();
        
        // Add a system message
        const systemMessage = document.createElement('div');
        systemMessage.className = 'message system';
        systemMessage.textContent = 'Started a new conversation';
        document.querySelector('.chat-messages').appendChild(systemMessage);
    });
});
# AI Chatbot with RAG and Session Management

A modern, responsive chatbot application powered by Google's Gemini AI API, available with both Flask and FastAPI backends, featuring document RAG (Retrieval Augmented Generation) and persistent sessions.

## Features

- 🤖 **Powered by Google Gemini AI** - Advanced conversational AI capabilities
- � **Document RAG** - Retrieves relevant information from documents to enhance responses
- 🔄 **Persistent Sessions** - Maintains conversations across browser sessions using cookies
- � **Vector Search** - Uses Chroma DB and Ollama embeddings for efficient retrieval
- � **Real-time chat interface** - Smooth, responsive chat experience
- 📱 **Fully responsive** - Works perfectly on desktop and mobile
- 🛡️ **Error handling** - Robust error management and user feedback
- 🧹 **Session Management** - Start new conversations while maintaining history

## Technologies Used

### Backend
- **FastAPI/Flask** - Python web frameworks (two implementations available)
- **Google Generative AI** - Gemini API integration
- **Chroma DB** - Vector database for document and conversation storage
- **Ollama** - Local embeddings with mxbai-embed-large model
- **LangChain** - Framework for RAG implementation
- **CORS Middleware** - Cross-origin resource sharing
- **Pydantic** - Data validation with FastAPI
- **python-dotenv** - Environment variable management

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients and animations
- **Vanilla JavaScript** - No framework dependencies
- **Font Awesome** - Icon library
- **Cookie-based sessions** - Persistent user sessions

## Prerequisites

- Python 3.9 or higher
- Google AI Studio account for Gemini API key
- Ollama running locally with the mxbai-embed-large model
- Modern web browser

## Installation

1. **Clone or download the project files**

2. **Install Python dependencies**
   
   For Flask implementation:
   ```bash
   pip install -r requirements.txt
   ```
   
   For FastAPI implementation:
   ```bash
   pip install -r requirements_fastapi.txt
   ```

3. **Get your Gemini API key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key for the next step

4. **Set up Ollama for embeddings**
   - Install Ollama from [ollama.ai](https://ollama.ai)
   - Run the embedding model:
   ```bash
   ollama run mxbai-embed-large
   ```

5. **Configure environment variables**
   - Create a `.env` file and update it with your API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   FLASK_DEBUG=True
   PORT=5000
   ```

6. **Run the application**
   
   Flask version:
   ```bash
   python app.py
   ```
   
   FastAPI version:
   ```bash
   python -m uvicorn fastapi_app:app --reload
   ```

7. **Open your browser**
   - Navigate to `http://localhost:5000`
   - Start chatting with the AI!

## Project Structure

```
project_root/
│
├── app.py                  # Flask application
├── fastapi_app.py          # FastAPI application
├── embedding_utils.py      # Utility functions for embeddings
├── migrate_db.py           # Database migration script
├── rag_store.py            # Simple RAG implementation
├── session_rag.py          # Session-based RAG implementation
├── requirements.txt        # Python dependencies for Flask
├── requirements_fastapi.txt # Python dependencies for FastAPI
├── .env                    # Environment variables (create this)
├── README.md               # Project documentation
│
├── templates/
│   ├── index.html          # Main HTML template
│   ├── style.css           # Main stylesheet
│   ├── script.js           # Main JavaScript functionality
│   └── session_utils.js    # Session management utilities
│
├── Docs/                   # Documents for RAG
│
├── document_store/         # Vector database for documents
│   └── chroma.sqlite3
│
└── chat_sessions/          # Session storage directory
```

## API Endpoints

### `GET /`
- Serves the main chatbot interface with session management
- Sets a cookie with the session ID

### `POST /api/chat`
- Handles chat messages with document retrieval and conversation context
- **Request body:**
  ```json
  {
    "message": "User message text",
    "session_id": "unique_session_identifier"
  }
  ```
- **Response:**
  ```json
  {
    "response": "AI response text",
    "session_id": "current_session_id"
  }
  ```
- Sets a cookie with the session ID

### `POST /api/clear`
- Creates a new conversation session
- Returns a new session ID and updates the cookie

### `GET /api/history`
- Gets conversation history for a session
- Supports text search with a query parameter
- **Query parameters:**
  ```
  session_id: The session ID to retrieve history for
  query: (optional) Text to search for in the history
  ```
  }
  ```
- **Response:**
  ```json
  {
    "response": "AI response text",
    "session_id": "session_identifier"
  }
  ```

### `POST /api/clear`
- Clears conversation history for a session
- **Request body:**
  ```json
  {
    "session_id": "session_identifier"
  }
  ```

### `GET /health`
- Health check endpoint
- Returns server status

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Required |
| `FLASK_DEBUG` | Enable debug mode (Flask) | `False` |
| `PORT` | Server port number | `5000` |
| `SECRET_KEY` | Secret key for Flask | For Flask only |

### Customization

- **Modify the AI behavior**: Edit the prompt in the chat endpoint (Flask: `app.py`, FastAPI: `fastapi_app.py`)
- **Change the UI theme**: Update CSS variables in `style.css`
- **Add new features**: Extend the API routes and JavaScript functions
- **API documentation**: With FastAPI, access built-in interactive docs at `/docs` or `/redoc`

## Features in Detail

### Chat Interface
- **Responsive design** that works on all devices
- **Real-time typing indicators** for better UX
- **Message timestamps** for conversation tracking
- **Auto-scrolling** to keep latest messages in view
- **Character counter** with visual feedback

### AI Integration
- **Context-aware conversations** using session history
- **Error handling** for API failures
- **Rate limiting protection** through proper session management
- **Customizable AI prompts** for different use cases

### User Experience
- **Smooth animations** for message appearance
- **Loading states** during API calls
- **Error notifications** with auto-dismiss
- **Keyboard shortcuts** (Enter to send, Shift+Enter for new line)
- **Accessible design** following web standards

## Deployment

### Local Development
```bash
python app.py
```

### Production with Gunicorn
```bash
gunicorn --bind 0.0.0.0:8000 app:app
```

### Environment Variables for Production
Make sure to set these in your production environment:
- `GEMINI_API_KEY` - Your actual API key
- `FLASK_DEBUG=False` - Disable debug mode
- `SECRET_KEY` - A secure random string

## Troubleshooting

### Common Issues

1. **"Import flask could not be resolved"**
   - Install dependencies: `pip install -r requirements.txt`

2. **"GEMINI_API_KEY not found"**
   - Ensure your `.env` file exists and contains the correct API key
   - Check that the key is valid in Google AI Studio

3. **Chat not responding**
   - Check browser console for JavaScript errors
   - Verify the Flask server is running
   - Confirm API key has proper permissions

4. **Styling issues**
   - Clear browser cache
   - Check that static files are being served correctly

### Debug Mode

Run with debug logging:
```bash
FLASK_DEBUG=True python app.py
```

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the chatbot.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Google Gemini AI for the powerful language model
- Flask community for the excellent web framework
- Font Awesome for the beautiful icons
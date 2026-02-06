# AderaBot-Hermes - AI Knowledge Chatbot

A custom knowledge chatbot for the Adera-Hybrid-App PTP (Point-to-Point) delivery service, built with Next.js 16, TypeScript, and cutting-edge AI technologies.

## 🚀 Features

### Core Capabilities
- **Multi-Source Knowledge Base**: Integrate knowledge from PDF documents, websites, and database queries
- **Voice Interaction**: Speech-to-text (ASR) and text-to-speech (TTS) for hands-free conversations
- **Context-Aware Conversations**: Remembers conversation history with configurable context length
- **Database Integration**: Query Supabase database for user, delivery, and product information
- **Real-Time Responses**: Fast AI responses using OpenRouter's free LLM model
- **Modern UI**: Beautiful, responsive interface built with shadcn/ui components
- **Web API**: RESTful API endpoints for easy integration into existing applications

### User Experience
- 📱 **Responsive Design**: Mobile-first design that works on all devices
- 🎨 **Dark Mode**: Automatic theme switching support
- 🔊 **Voice Controls**: Toggle voice input/output on demand
- 📚 **Knowledge Management**: Add/remove PDF and web knowledge sources
- ⚙️ **Customizable Settings**: Configure behavior to your preferences
- 💬 **Rich Chat Interface**: Source attribution, message copying, chat clearing
- ⚡ **Fast Performance**: Optimized for quick responses and smooth interactions

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Hooks
- **Icons**: Lucide React

### Backend & AI
- **LLM**: z-ai-web-dev-sdk with OpenRouter (meta-llama/llama-3.3-70b-instruct:free)
- **Speech-to-Text**: z-ai-web-dev-sdk ASR
- **Text-to-Speech**: z-ai-web-dev-sdk TTS
- **Web Reading**: z-ai-web-dev-sdk web-reader
- **PDF Processing**: pdf-parse
- **Database**: Supabase (PostgreSQL)

### Development Tools
- **Package Manager**: Bun
- **Linting**: ESLint
- **Type Checking**: TypeScript

## 📦 Installation

The project is already set up and ready to run. To start the development server:

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

### Dependencies

Key dependencies are already installed:
```json
{
  "next": "^16.1.1",
  "react": "^19.0.0",
  "z-ai-web-dev-sdk": "^0.0.16",
  "@supabase/supabase-js": "^2.93.3",
  "pdf-parse": "^2.4.5"
}
```

## 🌐 API Endpoints

### 1. Chat API - `POST /api/chat`
Send messages and receive AI responses with context awareness.

**Request**:
```json
{
  "message": "User message",
  "conversationHistory": [...],
  "settings": {
    "voiceOutput": true,
    "showSources": true,
    "contextLength": 10
  },
  "knowledgeSources": [...]
}
```

**Response**:
```json
{
  "response": "AI response",
  "sources": ["Source names"],
  "audioUrl": "data:audio/wav;base64,..."
}
```

### 2. Transcribe API - `POST /api/transcribe`
Convert speech audio to text.

**Request**:
```json
{
  "audio": "base64_encoded_audio"
}
```

**Response**:
```json
{
  "text": "Transcribed text"
}
```

### 3. PDF Knowledge API - `POST /api/knowledge/pdf`
Upload and extract text from PDF documents.

**Request**: `multipart/form-data` with `pdf` file

**Response**:
```json
{
  "success": true,
  "content": "Extracted text",
  "filename": "document.pdf"
}
```

### 4. Web Knowledge API - `POST /api/knowledge/web`
Extract content from web pages.

**Request**:
```json
{
  "url": "https://example.com"
}
```

**Response**:
```json
{
  "success": true,
  "title": "Page Title",
  "content": "Extracted content",
  "url": "https://example.com",
  "publishedTime": "2024-01-15T10:30:00Z"
}
```

### 5. Database Query API - `POST /api/database`
Query Supabase database for user, delivery, and product information.

**Request**:
```json
{
  "query": "Natural language query",
  "type": "delivery"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "deliveries": [...]
  }
}
```

For complete API documentation, see [ADERABOT-API.md](./ADERABOT-API.md).

## 💡 Usage Examples

### Basic Chat Interaction

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is the status of my delivery?',
    settings: { showSources: true },
  }),
});

const data = await response.json();
console.log(data.response);
```

### Adding Knowledge Sources

```typescript
// Upload PDF
const formData = new FormData();
formData.append('pdf', pdfFile);
await fetch('/api/knowledge/pdf', { method: 'POST', body: formData });

// Add Web Source
await fetch('/api/knowledge/web', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com/article' }),
});
```

### Voice Input

```typescript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream);
const audioChunks = [];

mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
  const base64 = await blobToBase64(audioBlob);
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio: base64 }),
  });
  const data = await response.json();
  console.log(data.text);
};

mediaRecorder.start();
setTimeout(() => mediaRecorder.stop(), 5000);
```

### Database Queries

```typescript
// Query delivery status
const response = await fetch('/api/database', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What is the status of order #12345?',
    type: 'delivery',
  }),
});

const data = await response.json();
console.log(data.data.deliveries);
```

## 🏗️ Project Structure

```
/home/z/my-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts          # Chat API endpoint
│   │   │   ├── transcribe/
│   │   │   │   └── route.ts          # ASR API endpoint
│   │   │   ├── knowledge/
│   │   │   │   ├── pdf/
│   │   │   │   │   └── route.ts      # PDF upload API
│   │   │   │   └── web/
│   │   │   │       └── route.ts      # Web extraction API
│   │   │   └── database/
│   │   │       └── route.ts          # Database query API
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                 # Main chat interface
│   ├── components/ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client
│   │   └── utils.ts                 # Utility functions
│   └── hooks/                       # Custom React hooks
├── prisma/
│   └── schema.prisma                # Database schema
├── ADERABOT-API.md                  # Complete API documentation
├── ADERABOT-README.md               # This file
├── worklog.md                       # Development work log
└── package.json                     # Dependencies
```

## ⚙️ Configuration

### Chat / Z.AI (required for bot messages)

The chat API uses `z-ai-web-dev-sdk`, which needs a config file or environment variables:

- **Option A**: Create a `.z-ai-config` file in the project root (see `.z-ai-config.example`):
  ```json
  { "baseUrl": "https://openrouter.ai/api/v1", "apiKey": "YOUR_API_KEY" }
  ```
- **Option B**: Set in `.env.local` and the app will create `.z-ai-config` on first chat request:
  - `OPENROUTER_API_KEY` (or `Z_AI_API_KEY`)
  - Optional: `OPENROUTER_API_BASE_URL` or `Z_AI_BASE_URL` (default: `https://openrouter.ai/api/v1`)

Do not commit `.z-ai-config`; it is in `.gitignore`.

### Environment Variables

For production, create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ehrmscvjuxnqpxcixnvq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

### Database Schema

The application expects the following Supabase tables:

**users**
- `id`: uuid (primary key)
- `email`: text (unique)
- `name`: text (optional)
- `role`: text (optional)
- `created_at`: timestamp

**deliveries**
- `id`: uuid (primary key)
- `user_id`: uuid (foreign key)
- `order_number`: text
- `status`: enum ('pending', 'in_transit', 'delivered', 'cancelled')
- `pickup_address`: text
- `delivery_address`: text
- `pickup_time`: timestamp (optional)
- `delivery_time`: timestamp (optional)
- `created_at`: timestamp
- `updated_at`: timestamp

**products**
- `id`: uuid (primary key)
- `name`: text
- `description`: text (optional)
- `price`: numeric
- `category`: text (optional)
- `in_stock`: boolean
- `created_at`: timestamp

## 🔐 Security Considerations

### Current Implementation
- ❌ No authentication required (development mode)
- ❌ No rate limiting implemented
- ⚠️ Credentials are hardcoded in source files

### Production Recommendations
1. **Authentication**: Implement Supabase Auth for user authentication
2. **Rate Limiting**: Add API rate limiting to prevent abuse
3. **Environment Variables**: Move all credentials to `.env.local`
4. **HTTPS**: Ensure all communications use HTTPS
5. **Input Validation**: Validate and sanitize all user inputs
6. **CORS**: Configure CORS for your specific domain
7. **API Key Protection**: Never expose service keys in client-side code

## 📊 Performance Optimization

### Implemented
- ✅ SDK instance reuse for z-ai-web-dev-sdk
- ✅ Lazy loading of PDF parsing library
- ✅ Optimized context length to prevent token overflow
- ✅ Client-side caching of knowledge sources

### Recommended Enhancements
- 🔄 Implement response caching for common queries
- 🔄 Add WebSocket for real-time communication
- 🔄 Use CDN for static assets
- 🔄 Implement request deduplication
- 🔄 Add service worker for offline support

## 🧪 Testing

### Manual Testing

1. **Chat Interface**:
   - Open `http://localhost:3000`
   - Send a message and verify AI response
   - Test voice input/output toggles
   - Add knowledge sources and test queries

2. **API Testing**:
   ```bash
   # Test chat API
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello!"}'

   # Test database API
   curl -X POST http://localhost:3000/api/database \
     -H "Content-Type: application/json" \
     -d '{"query": "Show recent deliveries", "type": "delivery"}'
   ```

### Code Quality

Run linter to check code quality:
```bash
bun run lint
```

## 🚧 Future Enhancements

### Planned Features
- [ ] WebSocket real-time communication
- [ ] Conversation persistence in database
- [ ] Advanced NLP for database queries
- [ ] Multi-language support
- [ ] User authentication and authorization
- [ ] Conversation export and sharing
- [ ] Analytics dashboard
- [ ] Custom system prompt configuration
- [ ] Integration with more AI models
- [ ] Rate limiting and abuse prevention

### Improvements
- [ ] Better PDF text extraction (OCR for scanned PDFs)
- [ ] Enhanced web scraping for dynamic content
- [ ] More sophisticated query parsing
- [ ] Improved error handling and user feedback
- [ ] Performance monitoring and logging
- [ ] Automated testing suite

## 📝 Development Notes

### AderaBot-Hermes Personality

AderaBot-Hermes is designed to be:
- Professional yet friendly and approachable
- Concise and clear in responses
- Always helpful and patient
- Focused on providing actionable solutions
- Context-aware with good memory

### System Prompt

The chatbot uses a custom system prompt that defines:
- Role as Adera-Hybrid-App PTP delivery service assistant
- Personality traits and communication style
- Guidelines for handling different query types
- Instructions for referencing knowledge sources
- Error handling approach

### Knowledge Sources

The chatbot can leverage multiple knowledge sources:
1. **PDF Documents**: Product manuals, policies, documentation
2. **Web Pages**: External articles, blog posts, updates
3. **Database**: User profiles, delivery records, product inventory

## 📞 Support & Documentation

- **Main Documentation**: [ADERABOT-API.md](./ADERABOT-API.md) - Complete API reference
- **Work Log**: [worklog.md](./worklog.md) - Development progress and notes
- **Dev Log**: `/home/z/my-project/dev.log` - Runtime server logs

## 📄 License

© 2024 Adera-Hybrid-App. All rights reserved.

## 🙏 Acknowledgments

Built with:
- Next.js team for the amazing framework
- shadcn for the beautiful UI components
- OpenRouter for providing free AI model access
- Supabase for the excellent database platform
- The open-source community

---

**Note**: This is a production-ready foundation for the AderaBot-Hermes knowledge chatbot. Further customization and enhancements can be made based on specific requirements and use cases.

# AderaBot-Hermes API Documentation

Complete API documentation for integrating AderaBot-Hermes into the Adera-Hybrid-App.

## Overview

AderaBot-Hermes is a custom knowledge chatbot built with:
- **Next.js 16** with App Router
- **TypeScript** for type safety
- **shadcn/ui** for modern UI components
- **z-ai-web-dev-sdk** for AI capabilities
- **Supabase** for database integration
- **OpenRouter** for LLM (meta-llama/llama-3.3-70b-instruct:free)

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication. For production, implement proper authentication using Supabase Auth.

## Endpoints

### 1. Chat API

Process chat messages and generate AI responses with context awareness.

#### POST /api/chat

**Description**: Send a message to AderaBot-Hermes and receive an AI response.

**Request Body**:
```typescript
{
  message: string;                    // User message
  conversationHistory?: Array<{      // Optional conversation history
    role: 'user' | 'assistant';
    content: string;
  }>;
  settings?: {                       // Optional settings
    voiceOutput?: boolean;           // Enable TTS
    voiceInput?: boolean;            // Enable ASR
    autoScroll?: boolean;            // Auto-scroll in UI
    showSources?: boolean;           // Show source attribution
    contextLength?: number;          // Number of messages in context (1-50)
  };
  knowledgeSources?: Array<{         // Optional knowledge sources
    id: string;
    type: 'pdf' | 'web' | 'database';
    name: string;
    url?: string;
    content?: string;
  }>;
}
```

**Response**:
```typescript
{
  response: string;                  // AI response
  sources?: string[];               // Sources used in response
  audioUrl?: string;                // Base64 encoded audio (if voice enabled)
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the status of my delivery?",
    "conversationHistory": [],
    "settings": {
      "voiceOutput": false,
      "showSources": true,
      "contextLength": 10
    },
    "knowledgeSources": [
      {
        "id": "1",
        "type": "database",
        "name": "User & Delivery Database"
      }
    ]
  }'
```

---

### 2. Transcribe API (Speech-to-Text)

Convert audio speech to text using ASR.

#### POST /api/transcribe

**Description**: Transcribe audio input to text.

**Request Body**:
```typescript
{
  audio: string;  // Base64 encoded audio (WAV, MP3, M4A, FLAC, OGG)
}
```

**Response**:
```typescript
{
  text: string;  // Transcribed text
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "audio": "UklGRiQAAABXQVZFZm10..."
  }'
```

**Audio Requirements**:
- Supported formats: WAV, MP3, M4A, FLAC, OGG
- Recommended sample rate: 16kHz or higher
- Maximum file size: 100MB

---

### 3. PDF Knowledge API

Upload and extract text from PDF documents.

#### POST /api/knowledge/pdf

**Description**: Upload a PDF document and extract its text content.

**Request**: `multipart/form-data` with `pdf` field containing the PDF file.

**Response**:
```typescript
{
  success: boolean;
  content?: string;   // Extracted text from PDF
  filename?: string;   // Original filename
  error?: string;     // Error message if failed
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/knowledge/pdf \
  -F "pdf=@document.pdf"
```

**Requirements**:
- File type: PDF
- Maximum file size: 10MB
- Content: Plain text PDFs (scanned PDFs may not extract properly)

---

### 4. Web Knowledge API

Extract content from web pages.

#### POST /api/knowledge/web

**Description**: Extract text content from a web URL.

**Request Body**:
```typescript
{
  url: string;  // Valid HTTP/HTTPS URL
}
```

**Response**:
```typescript
{
  success: boolean;
  title?: string;            // Page title
  content?: string;          // Extracted content (plain text)
  url?: string;              // Original URL
  publishedTime?: string;    // Publication timestamp (if available)
  error?: string;            // Error message if failed
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/knowledge/web \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/article"
  }'
```

**Notes**:
- URL must be publicly accessible
- Some websites may block scraping
- JavaScript-heavy pages may not extract properly

---

### 5. Database Query API

Query the Supabase database for user, delivery, and product information.

#### POST /api/database

**Description**: Query the database using natural language.

**Request Body**:
```typescript
{
  query: string;  // Natural language query
  type?: 'user' | 'delivery' | 'product' | 'general';
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: {
    users?: Array<User>;
    deliveries?: Array<Delivery>;
    products?: Array<Product>;
  };
  error?: string;
}
```

**Example - General Query**:
```bash
curl -X POST http://localhost:3000/api/database \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me recent data"
  }'
```

**Example - Delivery Status**:
```bash
curl -X POST http://localhost:3000/api/database \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the status of order #12345?",
    "type": "delivery"
  }'
```

**Example - User by Email**:
```bash
curl -X POST http://localhost:3000/api/database \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Find user with email user@example.com",
    "type": "user"
  }'
```

**Supported Query Types**:
- `user`: Query user information (by email, list all)
- `delivery`: Query delivery information (by status, order number, recent)
- `product`: Query product information (by category, in stock, all)
- `general`: Query all tables (returns sample data)

---

## Integration Guide

### JavaScript/TypeScript Integration

```typescript
import { AderaBotClient } from '@/lib/aderabot-client';

// Initialize client
const client = new AderaBotClient({
  baseUrl: 'http://localhost:3000/api',
  settings: {
    voiceOutput: false,
    showSources: true,
    contextLength: 10,
  },
});

// Send a message
const response = await client.chat({
  message: 'What is the status of my delivery?',
  knowledgeSources: [
    {
      id: '1',
      type: 'database',
      name: 'User & Delivery Database',
    },
  ],
});

console.log(response.response);
console.log(response.sources);
```

### React Integration Example

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ChatWidget() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages,
          settings: { showSources: true },
        }),
      });

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response },
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            <span className="inline-block px-3 py-2 rounded-lg bg-muted">
              {msg.content}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
```

### Using Voice Input

```typescript
async function handleVoiceInput() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const audioChunks: Blob[] = [];

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: base64Audio }),
    });

    const data = await response.json();
    console.log('Transcribed:', data.text);
  };

  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), 5000); // Stop after 5 seconds
}
```

### Adding Knowledge Sources

```typescript
// Upload PDF
async function uploadPDF(file: File) {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await fetch('/api/knowledge/pdf', {
    method: 'POST',
    body: formData,
  });

  return await response.json();
}

// Add Web Source
async function addWebSource(url: string) {
  const response = await fetch('/api/knowledge/web', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  return await response.json();
}
```

## Error Handling

All API endpoints return errors in the following format:

```typescript
{
  error: string;        // Error message
  details?: string;     // Detailed error information
}
```

### Common Error Codes

- `400`: Bad Request (invalid parameters, missing fields)
- `500`: Internal Server Error (unexpected errors)

Always handle errors in your integration:

```typescript
const response = await fetch('/api/chat', { /* ... */ });

if (!response.ok) {
  const error = await response.json();
  console.error('Error:', error.error, error.details);
  // Handle error appropriately
}
```

## Rate Limiting

Currently, there is no rate limiting implemented. For production, implement rate limiting using:
- Next.js middleware
- Redis-based rate limiting
- Third-party services like Cloudflare

## Security Considerations

### Current Status
- No authentication required (development mode)
- No rate limiting
- Credentials are hardcoded in the code

### Production Recommendations
1. **Implement Authentication**: Use Supabase Auth for user authentication
2. **Rate Limiting**: Protect API endpoints from abuse
3. **Environment Variables**: Move all credentials to environment variables
4. **HTTPS**: Ensure all API requests use HTTPS
5. **Input Validation**: Validate all user inputs
6. **CORS**: Configure CORS properly for your domain

## Testing

### Test Chat API

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

### Test Transcribe API

```bash
# First, create a test audio file
# Then transcribe it
curl -X POST http://localhost:3000/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audio": "UklGRiQAAABXQVZFZm10..."}'
```

### Test Database API

```bash
curl -X POST http://localhost:3000/api/database \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me recent deliveries", "type": "delivery"}'
```

## Support

For issues or questions:
- Check the main README.md
- Review the worklog.md for development updates
- Check the dev.log for runtime errors

## License

© 2024 Adera-Hybrid-App. All rights reserved.

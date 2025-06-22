# Frontend - Personal Knowledge Base

Next.js frontend for the Personal Knowledge Base with semantic search capabilities.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# or using yarn
yarn install
```

### Development

```bash
# Start development server
npm run dev

# or using yarn
yarn dev
```

The application will be available at:
- Frontend: http://localhost:3000
- API proxy: Requests to `/api/*` are automatically proxied to `http://localhost:8000`

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **File Upload**: React Dropzone
- **Markdown**: React Markdown

### Project Structure

```
frontend/
├── components/         # React components
│   ├── UploadForm.tsx # Document upload interface
│   ├── AskForm.tsx    # Question asking interface
│   └── Results.tsx    # System status and results
├── pages/             # Next.js pages
│   ├── _app.tsx       # App wrapper
│   ├── _document.tsx  # HTML document
│   └── index.tsx      # Main page
├── styles/
│   └── globals.css    # Global styles
└── public/            # Static assets
```

## 📱 Features

### Upload Documents
- **File Upload**: Drag & drop PDF or text files
- **Text Input**: Manual text entry with optional filename
- **Progress Tracking**: Real-time upload status
- **Error Handling**: Clear error messages and retry options

### Ask Questions
- **Natural Language**: Ask questions in plain English
- **Configurable Results**: Choose number of chunks to retrieve (3, 5, or 10)
- **Source Attribution**: See which documents the answer came from
- **Confidence Scoring**: View answer confidence levels

### System Status
- **Component Health**: Database, embeddings, vector index, and LLM status
- **Document Management**: List all uploaded documents
- **Embedding Progress**: Track which documents have been processed
- **Batch Operations**: Generate embeddings for all documents at once

## 🎨 UI Components

### Custom Components

**UploadForm**
- File dropzone with drag & drop
- Manual text input
- Upload progress and status
- Success/error feedback

**AskForm**
- Question input textarea
- Configurable search parameters
- Answer display with markdown support
- Source chunk display with similarity scores

**Results**
- System health dashboard
- Document list with metadata
- Embedding status with progress bars
- Action buttons for batch operations

### Styling

The app uses a custom design system built on Tailwind CSS:

```css
/* Button styles */
.btn-primary    /* Primary action buttons */
.btn-secondary  /* Secondary action buttons */

/* Form elements */
.input-field    /* Consistent input styling */

/* Layout */
.card          /* White container with shadow */
```

## 🔧 Configuration

### API Configuration

The frontend automatically proxies API requests to the backend. Configure the backend URL in `next.config.js`:

```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    },
  ]
}
```

### Environment Variables

Create a `.env.local` file for environment-specific settings:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🎯 Usage

### 1. Upload Documents

1. Go to the "Upload Documents" tab
2. Either drag & drop files or click to select
3. Or use the manual text input for quick notes
4. Wait for processing confirmation

### 2. Generate Embeddings

1. Go to "System Status" tab
2. Click "Generate All Embeddings" if needed
3. Wait for processing to complete

### 3. Ask Questions

1. Go to "Ask Questions" tab
2. Type your question in natural language
3. Adjust the number of chunks if needed
4. Click "Ask" and wait for the response

## 🔍 API Integration

The frontend communicates with the FastAPI backend through these endpoints:

```typescript
// Upload document
POST /api/v1/upload/

// Generate embeddings
POST /api/v1/embed/

// Ask questions
POST /api/v1/ask/

// Get system status
GET /api/v1/system/status/

// List documents
GET /api/v1/documents/
```

### Error Handling

The app includes comprehensive error handling:

- **Network Errors**: Retry options and clear messages
- **API Errors**: Display backend error details
- **Validation**: Client-side input validation
- **Loading States**: Visual feedback during operations

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure backend is running on port 8000
   - Check CORS configuration in backend
   - Verify API proxy settings in `next.config.js`

2. **File Upload Issues**
   - Check file size limits
   - Ensure supported file types (PDF, TXT)
   - Verify backend storage configuration

3. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check PostCSS configuration
   - Clear Next.js cache: `rm -rf .next`

### Development Tips

- Use browser dev tools to debug API calls
- Check the Network tab for failed requests
- Use React DevTools for component debugging
- Enable verbose logging with `DEBUG=* npm run dev`

## 📈 Performance

### Optimization

- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Prefetching**: Automatic link prefetching
- **Bundle Analysis**: Run `npm run build` to see bundle sizes

### Monitoring

Monitor these metrics:
- **First Contentful Paint (FCP)**: Should be < 1.5s
- **Largest Contentful Paint (LCP)**: Should be < 2.5s
- **Cumulative Layout Shift (CLS)**: Should be < 0.1
- **Time to Interactive (TTI)**: Should be < 3.8s

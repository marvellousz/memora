# Getting Started with Memora

Welcome to Memora - your AI-powered personal knowledge base! This guide will help you get everything up and running quickly.

## System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18+)
- **Python**: 3.8+ (3.10+ recommended)
- **Node.js**: 18+ (LTS recommended)
- **MongoDB**: 5.0+ (Community Edition)
- **RAM**: 4GB minimum (8GB+ recommended for LLM)
- **Storage**: 10GB+ free space

## Prerequisites Installation

### Windows
1. **Python**: Download from [python.org](https://www.python.org/downloads/) - Check "Add Python to PATH"
2. **Node.js**: Download from [nodejs.org](https://nodejs.org/) (LTS version)
3. **MongoDB**: Download [MongoDB Community Server](https://www.mongodb.com/try/download/community)
4. **Git**: Download from [git-scm.com](https://git-scm.com/)
5. **Build Tools**: Install Visual Studio Build Tools (for Python packages)

### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install prerequisites
brew install python@3.10 node git
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Linux (Ubuntu/Debian)
```bash
# Update system
sudo apt update

# Install Python and build tools
sudo apt install python3.10 python3.10-venv python3.10-dev python3-pip build-essential cmake git

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Quick Start (Automated Setup)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd memora

# Run setup script
# Windows:
setup.bat

# macOS/Linux:
chmod +x setup.sh
./setup.sh
```

### 2. Download LLM Model (Optional)
The setup script will offer to download the LLM model. If you skip it, you can download it later:

```bash
cd backend/models
# Download Mistral 7B Instruct (4.4GB)
curl -L -o mistral-7b-instruct-v0.1.Q4_K_M.gguf "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
```

### 3. Start the Application

**Option A: Use startup script**
```bash
# Windows:
start_app.bat

# macOS/Linux:
./start_app.sh
```

**Option B: Manual startup**
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python -m uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 4. Access Your Application
- **Main App**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Manual Setup (Step by Step)

**Unix/macOS:**
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

1. **Clone and navigate:**
   ```bash
   git clone <your-repo>
   cd personal-knowledge-base
   ```

2. **Backend setup:**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows:
   venv\Scripts\activate
   # Unix/macOS:
   source venv/bin/activate
   
   pip install -r requirements.txt
   cd ..
   ```

3. **Frontend setup:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Start MongoDB:**
   ```bash
   mongod
   ```

5. **Start the backend:**
   ```bash
   cd backend
   # Activate virtual environment first
   python -m uvicorn app.main:app --reload
   ```

6. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## Access Your Application

Once everything is running:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## First Steps

### 1. Upload Your First Document

1. Go to http://localhost:3000
2. Click on "Upload Documents" tab
3. Drag & drop a PDF file or enter text manually
4. Wait for processing confirmation

### 2. Generate Embeddings

1. Go to "System Status" tab
2. Click "Generate All Embeddings"
3. Wait for the process to complete

### 3. Ask Your First Question

1. Go to "Ask Questions" tab
2. Type a question about your uploaded document
3. Click "Ask" and see the AI-powered response!

## Adding Local LLM (Optional)

For the best question-answering experience, download a local language model:

### Recommended Models

1. **Mistral 7B Instruct** (Recommended)
   ```bash
   cd backend/models
   wget https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf
   ```

2. **Zephyr 7B Beta** (Alternative)
   ```bash
   cd backend/models
   wget https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF/resolve/main/zephyr-7b-beta.Q4_K_M.gguf
   ```

### Without LLM
The system will still work without a local LLM - it will return relevant document chunks but won't generate natural language answers.

## Configuration

### Backend Configuration

Create `backend/.env` file:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=knowledge_base
LLM_MODEL_PATH=models/mistral-7b-instruct-v0.1.Q4_K_M.gguf
EMBEDDING_MODEL=all-MiniLM-L6-v2
LOG_LEVEL=INFO
```

### Frontend Configuration

Create `frontend/.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Start MongoDB
mongod

# Or specify data directory
mongod --dbpath /path/to/your/db
```

**Port 8000 Already in Use**
```bash
# Find process using port 8000
lsof -i :8000  # Unix/macOS
netstat -ano | findstr :8000  # Windows

# Kill the process or use different port
python -m uvicorn app.main:app --reload --port 8001
```

**Node Modules Issues**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Python Dependencies Issues**
```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Getting Help

1. Check the logs:
   - Backend: Look at terminal output
   - Frontend: Check browser console (F12)
   - MongoDB: Check MongoDB logs

2. Verify system status at http://localhost:8000/health

3. Check individual component READMEs:
   - [Backend README](backend/README.md)
   - [Frontend README](frontend/README.md)

## Usage Tips

### Best Practices

1. **Document Upload:**
   - Use descriptive filenames
   - PDFs work best with text-based content
   - Break large documents into smaller chunks

2. **Question Asking:**
   - Be specific in your questions
   - Reference document topics you've uploaded
   - Try different phrasings for better results

3. **System Maintenance:**
   - Regularly check "System Status" tab
   - Generate embeddings after uploading documents
   - Monitor storage space for large document collections

### Performance Optimization

1. **For Large Document Collections:**
   - Consider using GPU-accelerated FAISS (`faiss-gpu`)
   - Increase chunk size for longer documents
   - Use more powerful LLM models for better answers

2. **For Better Search Results:**
   - Upload related documents together
   - Use consistent terminology
   - Include context in your questions

## Next Steps

### Extend Your Knowledge Base

1. **Upload More Documents:**
   - Research papers
   - Personal notes
   - Meeting transcripts
   - Documentation

2. **Advanced Features:**
   - Experiment with different chunk sizes
   - Try various LLM models
   - Adjust search parameters

3. **Integration:**
   - Use the API endpoints in other applications
   - Build custom frontends
   - Integrate with existing workflows

### Development

If you want to modify or extend the system:

1. **Backend Development:**
   ```bash
   cd backend
   source venv/bin/activate  # Unix/macOS
   # venv\Scripts\activate  # Windows
   python -m uvicorn app.main:app --reload
   ```

2. **Frontend Development:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **API Testing:**
   - Use the interactive docs at http://localhost:8000/docs
   - Test endpoints with curl or Postman

## Support

- **Documentation:** Check the README files in each directory
- **API Reference:** http://localhost:8000/docs
- **Issues:** Create issues in your repository
- **Logs:** Check terminal outputs for detailed error messages

## Congratulations!

You now have a fully functional Personal Knowledge Base with:
- Document upload and processing
- Semantic search capabilities  
- AI-powered question answering
- Modern web interface
- Completely local and private

Happy knowledge building! 🧠

#!/bin/bash

# Memora - AI-Powered Personal Knowledge Base Setup Script
# This script helps set up the complete project with all dependencies

echo "🚀 Setting up Memora - AI-Powered Personal Knowledge Base..."
echo "======================================================"

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if service is running
service_running() {
    if command_exists systemctl; then
        systemctl is-active --quiet "$1"
    elif command_exists brew; then
        brew services list | grep "$1" | grep "started" > /dev/null
    else
        return 1
    fi
}

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if command_exists apt; then
        DISTRO="debian"
    elif command_exists yum; then
        DISTRO="redhat"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    OS="windows"
fi

echo "🔍 Detected OS: $OS"

# Check and install prerequisites
echo "📋 Checking prerequisites..."

# Check Python
if ! command_exists python3; then
    echo "❌ Python 3 is required but not installed"
    echo "Please install Python 3.8+ from:"
    if [ "$OS" = "macos" ]; then
        echo "  - Homebrew: brew install python@3.10"
    elif [ "$OS" = "linux" ]; then
        echo "  - Ubuntu/Debian: sudo apt install python3.10 python3.10-venv python3.10-dev python3-pip build-essential"
        echo "  - CentOS/RHEL: sudo yum install python3 python3-venv python3-devel gcc"
    fi
    echo "  - Or download from: https://www.python.org/downloads/"
    exit 1
else
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo "✅ Python $PYTHON_VERSION found"
fi

# Check Node.js
if ! command_exists node; then
    echo "❌ Node.js is required but not installed"
    echo "Please install Node.js 18+ from:"
    if [ "$OS" = "macos" ]; then
        echo "  - Homebrew: brew install node"
    elif [ "$OS" = "linux" ]; then
        echo "  - NodeSource: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs"
    fi
    echo "  - Or download from: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION found"
fi

# Check MongoDB
if ! command_exists mongod && ! command_exists mongo; then
    echo "⚠️  MongoDB not found. Installing MongoDB..."
    
    if [ "$OS" = "macos" ]; then
        if command_exists brew; then
            echo "Installing MongoDB via Homebrew..."
            brew tap mongodb/brew
            brew install mongodb-community
            echo "Starting MongoDB service..."
            brew services start mongodb/brew/mongodb-community
        else
            echo "❌ Homebrew not found. Please install MongoDB manually:"
            echo "https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/"
            exit 1
        fi
    elif [ "$OS" = "linux" ] && [ "$DISTRO" = "debian" ]; then
        echo "Installing MongoDB on Ubuntu/Debian..."
        wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
        sudo apt-get update
        sudo apt-get install -y mongodb-org
        sudo systemctl start mongod
        sudo systemctl enable mongod
    else
        echo "❌ Please install MongoDB manually for your system:"
        echo "https://docs.mongodb.com/manual/installation/"
        exit 1
    fi
else
    echo "✅ MongoDB found"
    
    # Check if MongoDB is running
    if [ "$OS" = "macos" ]; then
        if brew services list | grep mongodb | grep "started" > /dev/null; then
            echo "✅ MongoDB is running"
        else
            echo "🔄 Starting MongoDB..."
            brew services start mongodb/brew/mongodb-community
        fi
    elif [ "$OS" = "linux" ]; then
        if systemctl is-active --quiet mongod; then
            echo "✅ MongoDB is running"
        else
            echo "🔄 Starting MongoDB..."
            sudo systemctl start mongod
            sudo systemctl enable mongod
        fi
    fi
fi

# Check build tools
echo "🔧 Checking build tools..."
if [ "$OS" = "linux" ]; then
    if ! command_exists gcc; then
        echo "Installing build tools..."
        if [ "$DISTRO" = "debian" ]; then
            sudo apt update
            sudo apt install -y build-essential cmake python3-dev
        fi
    fi
    echo "✅ Build tools available"
elif [ "$OS" = "macos" ]; then
    if ! command_exists gcc; then
        echo "Installing Xcode command line tools..."
        xcode-select --install
    fi
    echo "✅ Build tools available"
fi

echo "✅ Prerequisites check complete"
echo ""

# Create project directories
echo "📁 Creating project directories..."
mkdir -p backend/models
mkdir -p backend/data
mkdir -p backend/logs
mkdir -p frontend/.next
echo "✅ Directories created"

# Backend setup
echo "🔧 Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip setuptools wheel

# Install dependencies
echo "Installing Python dependencies..."
echo "This may take several minutes..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Python dependencies"
    echo "Try running: pip install --upgrade pip setuptools wheel"
    echo "Then rerun this script"
    exit 1
fi

echo "✅ Backend setup complete"
cd ..

# Frontend setup
echo "🎨 Setting up frontend..."
cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
echo "This may take several minutes..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Node.js dependencies"
    echo "Try running: npm cache clean --force"
    echo "Then rerun this script"
    exit 1
fi

echo "✅ Frontend setup complete"
cd ..

# Environment file setup
echo "📝 Creating environment files..."

# Backend environment
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << 'EOF'
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=memora_kb

# Model Paths
LLM_MODEL_PATH=models/mistral-7b-instruct-v0.1.Q4_K_M.gguf
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Logging
LOG_LEVEL=INFO

# FAISS Index
FAISS_INDEX_PATH=faiss_index.pkl
EOF
    echo "✅ Backend .env file created"
else
    echo "✅ Backend .env file already exists"
fi

# Frontend environment
if [ ! -f "frontend/.env.local" ]; then
    cat > frontend/.env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
    echo "✅ Frontend .env.local file created"
else
    echo "✅ Frontend .env.local file already exists"
fi

# LLM Model download
echo "🤖 LLM Model Setup..."
if [ ! -f "backend/models/mistral-7b-instruct-v0.1.Q4_K_M.gguf" ]; then
    echo "📥 LLM model not found. Would you like to download it now?"
    echo "   Model: Mistral 7B Instruct (Q4_K_M)"
    echo "   Size: ~4.4GB"
    echo "   This will enable question answering functionality"
    echo ""
    read -p "Download now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Downloading LLM model..."
        cd backend/models
        if command_exists curl; then
            curl -L -o mistral-7b-instruct-v0.1.Q4_K_M.gguf "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
        elif command_exists wget; then
            wget -O mistral-7b-instruct-v0.1.Q4_K_M.gguf "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
        else
            echo "❌ Neither curl nor wget found. Please download manually:"
            echo "URL: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
            echo "Save to: backend/models/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
        fi
        cd ../..
    else
        echo "Skipping model download. You can download it later if needed."
        echo "Manual download URL: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF"
    fi
else
    echo "✅ LLM model already exists"
fi

# Create startup scripts
echo "📝 Creating startup scripts..."

# Unix/Linux startup script
cat > start_app.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Memora..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Starting MongoDB..."
    if command -v systemctl > /dev/null; then
        sudo systemctl start mongod
    elif command -v brew > /dev/null; then
        brew services start mongodb/brew/mongodb-community
    else
        echo "Please start MongoDB manually"
    fi
fi

# Start backend in background
echo "Starting backend..."
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend in background
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Services started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF

chmod +x start_app.sh

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Verify MongoDB is running:"
if [ "$OS" = "macos" ]; then
    echo "   brew services list | grep mongodb"
elif [ "$OS" = "linux" ]; then
    echo "   sudo systemctl status mongod"
fi
echo ""
echo "2. Start the application:"
echo "   ./start_app.sh"
echo ""
echo "   OR start services individually:"
echo "   Terminal 1: cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "3. Access the application:"
echo "   🌐 Main App: http://localhost:3000"
echo "   🔧 Backend API: http://localhost:8000"
echo "   📖 API Documentation: http://localhost:8000/docs"
echo ""
if [ ! -f "backend/models/mistral-7b-instruct-v0.1.Q4_K_M.gguf" ]; then
    echo "4. Optional: Download LLM model for question answering"
    echo "   Visit: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF"
    echo "   Download: mistral-7b-instruct-v0.1.Q4_K_M.gguf to backend/models/"
    echo ""
fi
echo "📖 See README.md for detailed instructions and troubleshooting"
echo ""
echo "🎉 Welcome to Memora - Your AI-Powered Knowledge Base!"

@echo off
REM Memora - AI-Powered Personal Knowledge Base Setup Script for Windows
REM This script helps set up the complete project with all dependencies

echo 🚀 Setting up Memora - AI-Powered Personal Knowledge Base...
echo ======================================================

REM Check if we're in the right directory
if not exist "README.md" (
    echo ❌ Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check prerequisites
echo 📋 Checking prerequisites...

python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is required but not installed
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
) else (
    for /f "tokens=2" %%i in ('python --version') do echo ✅ Python %%i found
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is required but not installed
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=1" %%i in ('node --version') do echo ✅ Node.js %%i found
)

REM Check MongoDB
sc query "MongoDB" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MongoDB service not found. Checking if MongoDB is installed...
    mongod --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ MongoDB not found. Please install MongoDB Community Server
        echo Download from: https://www.mongodb.com/try/download/community
        echo Choose Windows x64 and follow the installer wizard
        pause
        exit /b 1
    ) else (
        echo ✅ MongoDB found but not running as service
    )
) else (
    echo ✅ MongoDB service found
)

REM Check build tools
where cl >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Visual Studio Build Tools not found
    echo Some Python packages may fail to install
    echo Consider installing Visual Studio Build Tools if you encounter errors
    echo Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
)

echo ✅ Prerequisites check complete
echo.

REM Create project directories
echo 📁 Creating project directories...
if not exist "backend\models" mkdir backend\models
if not exist "backend\data" mkdir backend\data
if not exist "backend\logs" mkdir backend\logs
if not exist "frontend\.next" mkdir frontend\.next
echo ✅ Directories created

REM Backend setup
echo 🔧 Setting up backend...
cd backend

REM Create virtual environment
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip setuptools wheel

REM Install dependencies
echo Installing Python dependencies...
echo This may take several minutes...
pip install --no-cache-dir -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install Python dependencies
    echo Try installing Visual Studio Build Tools and rerun this script
    pause
    exit /b 1
)

echo ✅ Backend setup complete
cd ..

REM Frontend setup
echo 🎨 Setting up frontend...
cd frontend

REM Install dependencies
echo Installing Node.js dependencies...
echo This may take several minutes...
npm install --no-optional
if errorlevel 1 (
    echo ❌ Failed to install Node.js dependencies
    echo Try running: npm cache clean --force
    echo Then rerun this script
    pause
    exit /b 1
)

echo ✅ Frontend setup complete
cd ..

REM Environment file setup
echo 📝 Creating environment files...

REM Backend environment
if not exist "backend\.env" (
    echo # MongoDB Configuration > backend\.env
    echo MONGODB_URL=mongodb://localhost:27017 >> backend\.env
    echo DATABASE_NAME=memora_kb >> backend\.env
    echo. >> backend\.env
    echo # Model Paths >> backend\.env
    echo LLM_MODEL_PATH=models/mistral-7b-instruct-v0.1.Q4_K_M.gguf >> backend\.env
    echo EMBEDDING_MODEL=all-MiniLM-L6-v2 >> backend\.env
    echo. >> backend\.env
    echo # Logging >> backend\.env
    echo LOG_LEVEL=INFO >> backend\.env
    echo. >> backend\.env
    echo # FAISS Index >> backend\.env
    echo FAISS_INDEX_PATH=faiss_index.pkl >> backend\.env
    echo ✅ Backend .env file created
) else (
    echo ✅ Backend .env file already exists
)

REM Frontend environment
if not exist "frontend\.env.local" (
    echo # API Configuration > frontend\.env.local
    echo NEXT_PUBLIC_API_URL=http://localhost:8000 >> frontend\.env.local
    echo ✅ Frontend .env.local file created
) else (
    echo ✅ Frontend .env.local file already exists
)

REM LLM Model setup
echo 🤖 LLM Model Setup...
if not exist "backend\models\mistral-7b-instruct-v0.1.Q4_K_M.gguf" (
    echo 📥 LLM model not found. 
    echo    Model: Mistral 7B Instruct (Q4_K_M)
    echo    Size: ~4.4GB
    echo    This will enable question answering functionality
    echo.
    set /p download="Download now? (y/N): "
    if /i "%download%"=="y" (
        echo Downloading LLM model...
        cd backend\models
        where curl >nul 2>&1
        if not errorlevel 1 (
            curl -L -o mistral-7b-instruct-v0.1.Q4_K_M.gguf "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
        ) else (
            echo ❌ curl not found. Please download manually:
            echo URL: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf
            echo Save to: backend\models\mistral-7b-instruct-v0.1.Q4_K_M.gguf
        )
        cd ..\..
    ) else (
        echo Skipping model download. You can download it later if needed.
        echo Manual download URL: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF
    )
) else (
    echo ✅ LLM model already exists
)

REM Create startup script
echo 📝 Creating startup script...
echo @echo off > start_app.bat
echo echo 🚀 Starting Memora... >> start_app.bat
echo. >> start_app.bat
echo REM Check if MongoDB service is running >> start_app.bat
echo sc query "MongoDB" ^| find "RUNNING" ^>nul 2^>^&1 >> start_app.bat
echo if errorlevel 1 ( >> start_app.bat
echo     echo Starting MongoDB service... >> start_app.bat
echo     net start MongoDB >> start_app.bat
echo ^) >> start_app.bat
echo. >> start_app.bat
echo REM Start backend >> start_app.bat
echo echo Starting backend... >> start_app.bat
echo start "Memora Backend" cmd /k "cd backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" >> start_app.bat
echo. >> start_app.bat
echo REM Wait a moment for backend to start >> start_app.bat
echo timeout /t 3 /nobreak ^>nul >> start_app.bat
echo. >> start_app.bat
echo REM Start frontend >> start_app.bat
echo echo Starting frontend... >> start_app.bat
echo start "Memora Frontend" cmd /k "cd frontend && npm run dev" >> start_app.bat
echo. >> start_app.bat
echo echo ✅ Services starting... >> start_app.bat
echo echo 🌐 Frontend: http://localhost:3000 >> start_app.bat
echo echo 🔧 Backend: http://localhost:8000 >> start_app.bat
echo echo 📖 API Docs: http://localhost:8000/docs >> start_app.bat
echo pause >> start_app.bat

echo ✅ Setup complete!
echo.
echo 🎯 Next steps:
echo 1. Verify MongoDB service is running:
echo    services.msc (look for MongoDB Server)
echo.
echo 2. Start the application:
echo    start_app.bat
echo.
echo    OR start services individually:
echo    Terminal 1: cd backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload
echo    Terminal 2: cd frontend && npm run dev
echo.
echo 3. Access the application:
echo    🌐 Main App: http://localhost:3000
echo    🔧 Backend API: http://localhost:8000
echo    📖 API Documentation: http://localhost:8000/docs
echo.
if not exist "backend\models\mistral-7b-instruct-v0.1.Q4_K_M.gguf" (
    echo 4. Optional: Download LLM model for question answering
    echo    Visit: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF
    echo    Download: mistral-7b-instruct-v0.1.Q4_K_M.gguf to backend\models\
    echo.
)
echo 📖 See README.md for detailed instructions and troubleshooting
echo.
echo 🎉 Welcome to Memora - Your AI-Powered Knowledge Base!
pause

cd ..

REM Frontend setup
echo 🎨 Setting up frontend...
cd frontend

REM Install dependencies
echo Installing Node.js dependencies...
npm install

cd ..

REM Create directories
echo 📁 Creating necessary directories...
if not exist "backend\models" mkdir backend\models
if not exist "backend\data" mkdir backend\data
if not exist "backend\logs" mkdir backend\logs

REM Model download information
echo 📥 Model download information:
echo To enable local LLM, download a GGUF model to backend\models\
echo Recommended: Mistral 7B Instruct Q4_K_M
echo Download URL: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF

REM Environment file templates
echo 📝 Creating environment file templates...

echo # MongoDB Configuration > backend\.env.example
echo MONGODB_URL=mongodb://localhost:27017 >> backend\.env.example
echo DATABASE_NAME=knowledge_base >> backend\.env.example
echo. >> backend\.env.example
echo # Model Paths >> backend\.env.example
echo LLM_MODEL_PATH=models/mistral-7b-instruct-v0.1.Q4_K_M.gguf >> backend\.env.example
echo EMBEDDING_MODEL=all-MiniLM-L6-v2 >> backend\.env.example
echo. >> backend\.env.example
echo # Logging >> backend\.env.example
echo LOG_LEVEL=INFO >> backend\.env.example
echo. >> backend\.env.example
echo # FAISS Index >> backend\.env.example
echo FAISS_INDEX_PATH=faiss_index.pkl >> backend\.env.example

echo # API Configuration > frontend\.env.local.example
echo NEXT_PUBLIC_API_URL=http://localhost:8000 >> frontend\.env.local.example

echo ✅ Setup complete!
echo.
echo 🎯 Next steps:
echo 1. Start MongoDB: mongod
echo 2. Start backend: cd backend ^&^& venv\Scripts\activate ^&^& python -m uvicorn app.main:app --reload
echo 3. Start frontend: cd frontend ^&^& npm run dev
echo 4. Optional: Download LLM model to backend\models\ for question answering
echo.
echo 📖 See README.md files in backend\ and frontend\ for detailed instructions

pause

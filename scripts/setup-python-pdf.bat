@echo off
REM Setup Python PDF parsing for ScaleAgents
echo 🐍 Setting up Python PDF parsing for ScaleAgents...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.7+ first.
    echo    Visit: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python found
python --version

REM Check if pip is available
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip is not installed. Please install pip first.
    pause
    exit /b 1
)

echo ✅ pip found
pip --version

REM Install PyMuPDF
echo 📦 Installing PyMuPDF...
pip install -r scripts/requirements.txt

REM Test the installation
echo 🧪 Testing PyMuPDF installation...
python -c "import fitz; print('✅ PyMuPDF installed successfully')"

if errorlevel 1 (
    echo ❌ PyMuPDF installation failed. Please check the error messages above.
    pause
    exit /b 1
) else (
    echo 🎉 Python PDF parsing setup complete!
    echo    You can now use Python PyMuPDF for superior PDF text extraction.
    pause
)

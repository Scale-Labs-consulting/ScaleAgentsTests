#!/bin/bash

# Setup Python PDF parsing for ScaleAgents
echo "🐍 Setting up Python PDF parsing for ScaleAgents..."

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.7+ first."
    echo "   Visit: https://www.python.org/downloads/"
    exit 1
fi

echo "✅ Python found: $(python --version)"

# Check if pip is available
if ! command -v pip &> /dev/null; then
    echo "❌ pip is not installed. Please install pip first."
    exit 1
fi

echo "✅ pip found: $(pip --version)"

# Install PyMuPDF
echo "📦 Installing PyMuPDF..."
pip install -r scripts/requirements.txt

# Test the installation
echo "🧪 Testing PyMuPDF installation..."
python -c "import fitz; print('✅ PyMuPDF installed successfully')"

if [ $? -eq 0 ]; then
    echo "🎉 Python PDF parsing setup complete!"
    echo "   You can now use Python PyMuPDF for superior PDF text extraction."
else
    echo "❌ PyMuPDF installation failed. Please check the error messages above."
    exit 1
fi

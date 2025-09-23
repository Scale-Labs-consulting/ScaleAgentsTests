# Python PDF Parser Service

A Flask-based microservice for extracting text from PDF files with better encoding handling than JavaScript libraries.

## Features

- Multiple PDF extraction libraries (PyMuPDF, pdfplumber, PyPDF2)
- Automatic fallback between extraction methods
- Advanced text cleaning for Portuguese content
- Handles encoding issues and garbled text
- RESTful API interface

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

Start the service:
```bash
python app.py
```

The service will run on `http://localhost:5000`

## API Endpoints

### POST /extract-pdf
Extract text from a PDF URL.

**Request:**
```json
{
  "url": "https://example.com/document.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "text": "Extracted and cleaned text content...",
  "original_length": 5000,
  "cleaned_length": 4500,
  "extraction_method": "PyMuPDF",
  "url": "https://example.com/document.pdf"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "python-pdf-parser"
}
```

## Integration with Node.js

To use this service from your Node.js application:

```javascript
const response = await fetch('http://localhost:5000/extract-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com/document.pdf'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Extracted text:', result.text);
}
```

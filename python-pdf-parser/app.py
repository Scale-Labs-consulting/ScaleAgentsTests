from flask import Flask, request, jsonify
import os
import requests
import tempfile
import logging
from typing import Optional
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

def extract_text_with_pymupdf(pdf_path: str) -> Optional[str]:
    """Extract text using PyMuPDF (fitz) - best for complex PDFs"""
    try:
        import fitz  # PyMuPDF
        logger.info(f"Trying PyMuPDF extraction for {pdf_path}")
        
        doc = fitz.open(pdf_path)
        text = ""
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text += page.get_text()
        
        doc.close()
        
        if text.strip():
            logger.info(f"PyMuPDF successful: {len(text)} characters, {len(doc)} pages")
            return text
        else:
            logger.warning("PyMuPDF returned empty text")
            return None
            
    except ImportError:
        logger.warning("PyMuPDF not available")
        return None
    except Exception as e:
        logger.error(f"PyMuPDF failed: {e}")
        return None

def extract_text_with_pdfplumber(pdf_path: str) -> Optional[str]:
    """Extract text using pdfplumber - good for tables and structured content"""
    try:
        import pdfplumber
        logger.info(f"Trying pdfplumber extraction for {pdf_path}")
        
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        if text.strip():
            logger.info(f"pdfplumber successful: {len(text)} characters")
            return text
        else:
            logger.warning("pdfplumber returned empty text")
            return None
            
    except ImportError:
        logger.warning("pdfplumber not available")
        return None
    except Exception as e:
        logger.error(f"pdfplumber failed: {e}")
        return None

def extract_text_with_pypdf2(pdf_path: str) -> Optional[str]:
    """Extract text using PyPDF2 - basic but reliable"""
    try:
        import PyPDF2
        logger.info(f"Trying PyPDF2 extraction for {pdf_path}")
        
        text = ""
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text()
        
        if text.strip():
            logger.info(f"PyPDF2 successful: {len(text)} characters, {len(pdf_reader.pages)} pages")
            return text
        else:
            logger.warning("PyPDF2 returned empty text")
            return None
            
    except ImportError:
        logger.warning("PyPDF2 not available")
        return None
    except Exception as e:
        logger.error(f"PyPDF2 failed: {e}")
        return None

def clean_extracted_text(text: str) -> str:
    """Clean and normalize extracted text"""
    try:
        logger.info(f"Cleaning extracted text ({len(text)} characters)")
        
        cleaned = text
        
        # Fix common encoding issues
        encoding_fixes = {
            'Ã¡': 'á', 'Ã ': 'à', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã¤': 'ä',
            'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
            'Ã­': 'í', 'Ã¬': 'ì', 'Ã®': 'î', 'Ã¯': 'ï',
            'Ã³': 'ó', 'Ã²': 'ò', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ã¶': 'ö',
            'Ãº': 'ú', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã¼': 'ü',
            'Ã§': 'ç', 'Ã±': 'ñ'
        }
        
        for wrong, correct in encoding_fixes.items():
            cleaned = cleaned.replace(wrong, correct)
        
        # Fix common PDF extraction artifacts
        cleaned = cleaned.replace('ﬁ', 'fi').replace('ﬂ', 'fl')
        cleaned = cleaned.replace('ﬀ', 'ff').replace('ﬃ', 'ffi').replace('ﬄ', 'ffl')
        
        # Clean up spacing
        import re
        cleaned = re.sub(r'\s+', ' ', cleaned)  # Multiple spaces to single
        cleaned = re.sub(r'\n\s*\n', '\n\n', cleaned)  # Clean line breaks
        cleaned = re.sub(r'\s+([.,;:!?])', r'\1', cleaned)  # Remove spaces before punctuation
        cleaned = re.sub(r'([.,;:!?])([A-Za-z])', r'\1 \2', cleaned)  # Add space after punctuation
        
        # Remove bullet point artifacts
        cleaned = re.sub(r'●\s*●\s*●\s*●', '', cleaned)
        cleaned = cleaned.replace('●', '')
        
        # Fix specific garbled patterns
        cleaned = re.sub(r'2\s+PaMs\s+mMp', '2 Páginas', cleaned)
        cleaned = cleaned.replace('PaMs', 'Páginas')
        cleaned = cleaned.replace('mMp', '')
        
        # Fix spaced-out words (common PDF extraction issue)
        spaced_words = [
            (r'u\s+r\s+b\s+o\s+a\s+e\s+e\s+o\s+c\s+o\s+n\s+x\s+l', 'urbano ocorrência'),
            (r'r\s+m\s+e\s+h\s+r\s+ﬁ\s+c\s+i\s+d\s+s\s+m', 'reme hr ficidade'),
            (r'o\s+a\s+a\s+o\s+s\s+a\s+d\s+r\s+o\s+n\s+v\s+i', 'oaa os ad ro nvi'),
            (r'g\s+a\s+z\s+o\s+e\s+ç\s+n\s+e\s+a', 'gaz o e ç ne a')
        ]
        
        for pattern, replacement in spaced_words:
            cleaned = re.sub(pattern, replacement, cleaned)
        
        # Fix common Portuguese words that get garbled
        portuguese_words = [
            (r'\bv\s+e\s+n\s+d\s+a\s+s\b', 'vendas'),
            (r'\bc\s+h\s+a\s+m\s+a\s+d\s+a\b', 'chamada'),
            (r'\bt\s+e\s+l\s+e\s+f\s+ó\s+n\s+i\s+c\s+a\b', 'telefónica'),
            (r'\bo\s+b\s+j\s+e\s+ç\s+õ\s+e\s+s\b', 'objeções'),
            (r'\br\s+e\s+u\s+n\s+i\s+ã\s+o\b', 'reunião'),
            (r'\bd\s+e\s+s\s+c\s+o\s+b\s+e\s+r\s+t\s+a\b', 'descoberta'),
            (r'\bf\s+e\s+c\s+h\s+o\b', 'fecho'),
            (r'\bf\s+e\s+c\s+h\s+a\s+m\s+e\s+n\s+t\s+o\b', 'fechamento'),
            (r'\bi\s+n\s+t\s+r\s+o\s+d\s+u\s+ç\s+ã\s+o\b', 'introdução'),
            (r'\bm\s+i\s+n\s+d\s+s\s+e\s+t\b', 'mindset'),
            (r'\bf\s+u\s+n\s+d\s+a\s+m\s+e\s+n\s+t\s+o\s+s\b', 'fundamentos'),
            (r'\bc\s+r\s+o\s+s\s+s\b', 'cross'),
            (r'\bu\s+p\s+s\s+e\s+l\s+l\s+i\s+n\s+g\b', 'upselling'),
            (r'\br\s+e\s+s\s+e\s+l\s+l\b', 'resell'),
            (r'\bp\s+r\s+o\s+d\s+u\s+t\s+o\s+s\b', 'produtos')
        ]
        
        for pattern, replacement in portuguese_words:
            cleaned = re.sub(pattern, replacement, cleaned)
        
        # Final cleanup
        cleaned = cleaned.strip()
        
        logger.info(f"Text cleaning completed: {len(cleaned)} characters")
        logger.info(f"Cleaned preview: {cleaned[:200]}...")
        
        return cleaned
        
    except Exception as e:
        logger.error(f"Text cleaning error: {e}")
        return text  # Return original text if cleaning fails

@app.route('/extract-pdf', methods=['POST'])
def extract_pdf():
    """Extract text from PDF URL"""
    try:
        data = request.get_json()
        pdf_url = data.get('url')
        
        if not pdf_url:
            return jsonify({'error': 'URL is required'}), 400
        
        logger.info(f"Extracting PDF from URL: {pdf_url}")
        
        # Download PDF to temporary file
        response = requests.get(pdf_url, timeout=30)
        response.raise_for_status()
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_file.write(response.content)
            temp_path = temp_file.name
        
        try:
            extracted_text = None
            extraction_method = None
            
            # Try different extraction methods in order of preference
            methods = [
                ('PyMuPDF', extract_text_with_pymupdf),
                ('pdfplumber', extract_text_with_pdfplumber),
                ('PyPDF2', extract_text_with_pypdf2)
            ]
            
            for method_name, method_func in methods:
                try:
                    extracted_text = method_func(temp_path)
                    if extracted_text and extracted_text.strip():
                        extraction_method = method_name
                        break
                except Exception as e:
                    logger.warning(f"{method_name} failed: {e}")
                    continue
            
            if not extracted_text or not extracted_text.strip():
                return jsonify({
                    'success': False,
                    'error': 'No text could be extracted from PDF',
                    'url': pdf_url
                }), 400
            
            # Clean the extracted text
            cleaned_text = clean_extracted_text(extracted_text)
            
            return jsonify({
                'success': True,
                'text': cleaned_text,
                'original_length': len(extracted_text),
                'cleaned_length': len(cleaned_text),
                'extraction_method': extraction_method,
                'url': pdf_url
            })
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except:
                pass
                
    except requests.RequestException as e:
        logger.error(f"Failed to download PDF: {e}")
        return jsonify({'error': f'Failed to download PDF: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': f'PDF extraction failed: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'python-pdf-parser'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

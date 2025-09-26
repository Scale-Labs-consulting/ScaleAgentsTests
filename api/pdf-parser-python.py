from http.server import BaseHTTPRequestHandler
import json
import base64
import io
import sys

# Try to import PyMuPDF, fallback to basic parsing if not available
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    print("⚠️ PyMuPDF not available, using basic text extraction")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Get content length
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length == 0:
                self.send_error_response(400, "No content provided")
                return
            
            # Read the request body
            post_data = self.rfile.read(content_length)
            
            # Parse multipart form data
            boundary = self.headers.get('Content-Type', '').split('boundary=')[1]
            parts = post_data.split(f'--{boundary}'.encode())
            
            pdf_data = None
            filename = "document.pdf"
            
            for part in parts:
                if b'Content-Disposition: form-data' in part and b'name="file"' in part:
                    # Extract filename if present
                    if b'filename=' in part:
                        filename_start = part.find(b'filename="') + 11
                        filename_end = part.find(b'"', filename_start)
                        if filename_start > 10 and filename_end > filename_start:
                            filename = part[filename_start:filename_end].decode('utf-8')
                    
                    # Extract PDF data (skip headers)
                    header_end = part.find(b'\r\n\r\n')
                    if header_end != -1:
                        pdf_data = part[header_end + 4:-2]  # Remove trailing \r\n
                        break
            
            if not pdf_data:
                self.send_error_response(400, "No PDF file found in request")
                return
            
            print(f"🐍 Python PDF parser processing: {filename} ({len(pdf_data)} bytes)")
            
            # Extract text using PyMuPDF if available
            if PYMUPDF_AVAILABLE:
                try:
                    # Create PDF document from bytes
                    pdf_document = fitz.open(stream=pdf_data, filetype="pdf")
                    
                    text_content = ""
                    num_pages = pdf_document.page_count
                    pages_processed = 0
                    
                    # Limit to first 20 pages for performance
                    max_pages = min(20, num_pages)
                    
                    for page_num in range(max_pages):
                        page = pdf_document[page_num]
                        page_text = page.get_text()
                        text_content += page_text + "\n"
                        pages_processed += 1
                    
                    pdf_document.close()
                    
                    # Get document info
                    doc_info = {
                        "title": pdf_document.metadata.get("title", ""),
                        "author": pdf_document.metadata.get("author", ""),
                        "subject": pdf_document.metadata.get("subject", ""),
                        "creator": pdf_document.metadata.get("creator", ""),
                        "producer": pdf_document.metadata.get("producer", ""),
                        "creationDate": pdf_document.metadata.get("creationDate", ""),
                        "modDate": pdf_document.metadata.get("modDate", "")
                    }
                    
                    result = {
                        "success": True,
                        "text": text_content,
                        "numpages": num_pages,
                        "numrender": pages_processed,
                        "info": doc_info,
                        "metadata": {
                            "method": "python-pymupdf",
                            "filename": filename,
                            "file_size": len(pdf_data)
                        },
                        "version": "python-pymupdf"
                    }
                    
                    print(f"✅ PyMuPDF extraction successful: {pages_processed}/{num_pages} pages")
                    
                except Exception as e:
                    print(f"❌ PyMuPDF extraction failed: {str(e)}")
                    # Fallback to basic response
                    result = {
                        "success": True,
                        "text": f"PDF parsing failed: {str(e)}",
                        "numpages": 0,
                        "numrender": 0,
                        "info": {"title": "PyMuPDF Error"},
                        "metadata": {"method": "python-error", "error": str(e)},
                        "version": "python-error"
                    }
            else:
                # Fallback when PyMuPDF is not available
                result = {
                    "success": True,
                    "text": "PDF parsing not available - PyMuPDF not installed",
                    "numpages": 0,
                    "numrender": 0,
                    "info": {"title": "PyMuPDF Not Available"},
                    "metadata": {"method": "python-fallback"},
                    "version": "python-fallback"
                }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response_json = json.dumps(result, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
        except Exception as e:
            print(f"❌ Python PDF parser error: {str(e)}")
            self.send_error_response(500, f"PDF parsing failed: {str(e)}")
    
    def send_error_response(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        error_response = {
            "success": False,
            "error": message,
            "details": str(message)
        }
        
        self.wfile.write(json.dumps(error_response).encode('utf-8'))

#!/usr/bin/env python3
"""
Python PDF Parser for ScaleAgents
Uses PyMuPDF (fitz) for superior PDF text extraction
"""

import sys
import json
import fitz  # PyMuPDF
import argparse
from pathlib import Path

def extract_text_from_pdf(pdf_path, max_pages=None):
    """
    Extract text from PDF using PyMuPDF (fitz)
    """
    try:
        # Open the PDF document
        doc = fitz.open(pdf_path)
        
        if not doc:
            return {
                "success": False,
                "error": "Could not open PDF file",
                "text": "",
                "num_pages": 0,
                "method": "PyMuPDF"
            }
        
        num_pages = len(doc)
        text_content = ""
        pages_processed = 0
        
        # Determine how many pages to process
        pages_to_process = min(max_pages, num_pages) if max_pages else num_pages
        
        # Extract text from each page
        for page_num in range(pages_to_process):
            try:
                page = doc[page_num]
                page_text = page.get_text()
                
                if page_text.strip():
                    text_content += page_text + "\n"
                    pages_processed += 1
                    
            except Exception as page_error:
                print(f"Warning: Error processing page {page_num + 1}: {page_error}", file=sys.stderr)
                continue
        
        # Close the document
        doc.close()
        
        # Clean up the text
        if text_content:
            # Remove excessive whitespace
            lines = text_content.split('\n')
            cleaned_lines = []
            for line in lines:
                cleaned_line = ' '.join(line.split())
                if cleaned_line.strip():
                    cleaned_lines.append(cleaned_line)
            
            text_content = '\n'.join(cleaned_lines)
        
        return {
            "success": True,
            "text": text_content,
            "num_pages": num_pages,
            "pages_processed": pages_processed,
            "method": "PyMuPDF",
            "file_size": Path(pdf_path).stat().st_size if Path(pdf_path).exists() else 0
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "text": "",
            "num_pages": 0,
            "method": "PyMuPDF"
        }

def main():
    parser = argparse.ArgumentParser(description='Extract text from PDF using PyMuPDF')
    parser.add_argument('pdf_path', help='Path to the PDF file')
    parser.add_argument('--max-pages', type=int, help='Maximum number of pages to process')
    parser.add_argument('--output', help='Output file path (optional)')
    
    args = parser.parse_args()
    
    # Check if PDF file exists
    if not Path(args.pdf_path).exists():
        result = {
            "success": False,
            "error": f"PDF file not found: {args.pdf_path}",
            "text": "",
            "num_pages": 0,
            "method": "PyMuPDF"
        }
    else:
        # Extract text from PDF
        result = extract_text_from_pdf(args.pdf_path, args.max_pages)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))
    
    # Optionally save to file
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()

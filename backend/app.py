import os
import tempfile
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)


def extract_from_mitchell_estimate(pdf_path):
    """
    Extract data from Mitchell Estimate PDF format.
    This uses direct text extraction (no OCR needed for digital PDFs).
    """
    doc = fitz.open(pdf_path)
    full_text = ''
    for page in doc:
        full_text += page.get_text()
    doc.close()
    
    lines = [l.strip() for l in full_text.split('\n') if l.strip()]
    
    result = {
        'customer': {'name': '', 'phone': ''},
        'vehicle': {'year': '', 'makeModel': '', 'plate': '', 'vin': ''},
        'items': [],
        'notes': ''
    }
    
    # Extract VIN (17 character alphanumeric)
    vin_match = re.search(r'VIN\s*\n?\s*([A-HJ-NPR-Z0-9]{17})', full_text)
    if vin_match:
        result['vehicle']['vin'] = vin_match.group(1)
    
    # Extract License Plate (format: XX-XXXXXXX, allowing spaces)
    plate_match = re.search(r'License\s*\n?\s*([A-Z]{2}-[A-Z0-9 ]+)', full_text)
    if plate_match:
        result['vehicle']['plate'] = plate_match.group(1)
    
    # Extract Vehicle Description (year + make + model line)
    # Pattern: 4-digit year followed by make/model info
    # Model info can contain quotes (119" WB), dots, etc.
    vehicle_match = re.search(r'(\d{4})\s+(Honda|Toyota|Ford|Chevrolet|Nissan|Hyundai|Kia|BMW|Mercedes|Audi|Lexus|Mazda|Subaru|Volkswagen|Jeep|Dodge|GMC|Ram|Acura|Infiniti|Volvo|[A-Za-z]+)\s+([^\n]+?)(?:\d+\s*Door|\d+\.\d+L|License)', full_text, re.IGNORECASE)
    if vehicle_match:
        result['vehicle']['year'] = vehicle_match.group(1)
        result['vehicle']['makeModel'] = f"{vehicle_match.group(2)} {vehicle_match.group(3).strip()}"
    
    # Extract job descriptions
    # Mitchell format has part names on one line and operation type nearby
    # Look for lines containing common body parts followed by operation types
    
    # Find where the line items section starts (after "Line #" header)
    line_items_start = 0
    for i, line in enumerate(lines):
        if 'Line #' in line or 'Description' in line and 'Operation' in ' '.join(lines[max(0,i-1):i+2]):
            line_items_start = i
            break
    
    body_parts = [
        'bumper', 'cover', 'grille', 'hood', 'fender', 'door', 'panel', 
        'rocker', 'quarter', 'trunk', 'tailgate', 'mirror', 'lamp',
        'garnish', 'molding', 'bracket', 'support', 'assembly', 'guard',
        'handle', 'mudguard', 'wheel opening', 'belt', 'sensor', 'pump',
        'glass', 'absorber', 'condenser', 'radiator', 'frame', 'plate',
        'shield', 'lock', 'latch', 'hinge', 'regulator', 'motor', 'pillar'
    ]
    
    # Exclude common option/feature terms that appear in description but aren't parts
    # Note: 'seat belt' and 'air bag' removed from exclusion as they can be valid repair parts
    # The line_items_start check prevents matching them in the Options section
    exclude_terms = [
        'automatic headlights', 'power door locks', 'power remote', 'power steering',
        'power windows', 'heated mirror', 'lumbar support', 'daytime running', 
        'tonneau cover', 'air conditioning', 'cruise control', 'steering wheel', 
        'bluetooth', 'keyless', '4wd', 'awd', 'cyl gas', 'door utility', 'audio control'
    ]
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Skip lines before the line items section
        if i < line_items_start:
            i += 1
            continue
            
        line_lower = line.lower()
        
        # Skip excluded terms (vehicle options)
        if any(term in line_lower for term in exclude_terms):
            i += 1
            continue
        
        # Check if this line contains a body part
        # Also check for specific missed items like "W/Shield" or "Air Bag" explicitly if not in body_parts
        has_part = any(part in line_lower for part in body_parts) or \
                   'air bag' in line_lower or \
                   'seat belt' in line_lower or \
                   'w/shield' in line_lower
        
        if not has_part:
            i += 1
            continue
            
        # Skip header/section lines
        if line in ['Front Bumper', 'Front Fender', 'Front Door', 'Rear Bumper', 'Hood', 'Headlamps', 'Fog Lamps', 'Front Lamps', 'Grille', 'Seat Belts', 'Air Bags', 'Cooling', 'Radiator Support', 'Air Bag System']:
            i += 1
            continue
            
        # Skip standalone generic terms that are part of other items
        if line in ['Garnish', 'Assembly', 'Support', 'Bracket']:
            i += 1
            continue
        
        # Look for operation type in nearby lines (within 4 lines after current)
        search_range = lines[i:min(len(lines), i+5)]
        search_text = ' '.join(search_range)
        
        # Determine job type based on specific operation patterns
        job_type = None
        
        # Check for Blend first (most specific)
        if 'Blend' in search_text:
            job_type = 'Blend'
        # Only "Remove / Replace" should be Replace
        elif 'Remove /' in search_text and 'Replace' in search_text:
            job_type = 'Replace'
        # Repair operation
        elif 'Repair' in search_text:
            job_type = 'Repair'
        
        # Skip items without a clear operation type
        if job_type is None:
            i += 1
            continue
        
        # Build the description - check if next line(s) are continuation
        desc = line.strip()
        lines_consumed = 0
        
        # Keywords that indicate end of description
        end_keywords = ['Remove', 'Replace', 'Blend', 'Refinish', 'Repair', 'Overhaul', 
                       'Body', 'INC', 'Existing', 'Aftermarket', 'New', 'Yes', 'No']
        
        # Clean description if it contains operation words (e.g., "Part Name Remove /")
        for kw in ['Remove /', 'Remove', 'Replace']:
            if kw in desc:
                desc = desc.split(kw)[0].strip()
        
        # Check next lines for continuation
        for j in range(i+1, min(len(lines), i+3)):
            next_line = lines[j].strip()
            # Stop if it's a keyword, number, or empty
            if (not next_line or 
                next_line in end_keywords or 
                next_line.replace('.', '').replace('#', '').isdigit() or
                any(next_line.startswith(kw) for kw in end_keywords)):
                break
            # Check if next line looks like a continuation (part of description)
            if len(next_line) > 2 and next_line[0].isupper():
                desc = f"{desc} {next_line}"
                lines_consumed += 1
                break  # Only combine one continuation line
        
        part_num_val = ''
        
        if desc and len(desc) > 3 and desc not in ['AUTO', 'Body', 'INC', 'Inc', 'Existing']:
            # For Replace items, look for Part Number
            if job_type == 'Replace':
                # Look ahead up to 12 lines for part number
                # Part numbers usually appear after "New", "Aftermarket", "Recycled"
                # Pattern: Uppercase alphanumeric, often 7+ chars.
                for k in range(i, min(len(lines), i+15)):
                    line_k = lines[k].strip()
                    # Skip common keywords
                    if line_k in ['Body', 'Refinish', 'New', 'Aftermarket', 'Recycled', 'Existing', 'Remove /', 'Replace']:
                        continue
                    if line_k.replace('.', '').replace('#', '').replace('*', '').replace('$', '').isdigit():
                        continue
                        
                    # Check if line looks like a part number
                    # e.g. HO1014102C, 71140T0AA01, 971 807 180
                    # Must be mostly alphanumeric, at least 5 chars, usually uppercase, allow spaces/dashes
                    if len(line_k) >= 3 and re.match(r'^[A-Z0-9 -]+$', line_k) and any(c.isdigit() for c in line_k):
                        # Avoid matching generic terms
                        if line_k not in ['Order', 'Labor', 'Total', 'Sublet', 'Notes']:
                            part_num_val = line_k
                            
                            # Check for continuation (e.g. 74115-T0A- \n A01)
                            # Only append if strictly looks like continuation (ends with hyphen)
                            if k+1 < len(lines):
                                next_p = lines[k+1].strip()
                                if line_k.endswith('-') and re.match(r'^[A-Z0-9]+$', next_p):
                                     part_num_val += next_p
                            break

            result['items'].append({
                'type': job_type,
                'desc': desc,
                'partNum': part_num_val,
                'customTitle': ''
            })
            
        i += 1 + lines_consumed
    
    # Deduplicate items (exact match only)
    seen = set()
    unique_items = []
    for item in result['items']:
        key = (item['type'], item['desc'].lower())
        if key not in seen:
            seen.add(key)
            unique_items.append(item)
    
    result['items'] = unique_items
    
    return result


@app.route('/analyze', methods=['POST'])
def analyze_pdf():
    """Main endpoint to analyze uploaded PDF."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        file.save(tmp.name)
        pdf_path = tmp.name
    
    try:
        print("Extracting data from PDF...")
        result = extract_from_mitchell_estimate(pdf_path)
        
        print(f"Extracted: VIN={result['vehicle']['vin']}, Plate={result['vehicle']['plate']}")
        print(f"Found {len(result['items'])} job items")
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Clean up
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)

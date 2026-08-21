import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def extract_text_from_pptx(pptx_path):
    if not os.path.exists(pptx_path):
        print(f"File not found: {pptx_path}")
        return

    text_content = []
    try:
        with zipfile.ZipFile(pptx_path, 'r') as zip_ref:
            slide_files = [f for f in zip_ref.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
            # Sort by slide number
            slide_files.sort(key=lambda x: int(x.replace('ppt/slides/slide', '').replace('.xml', '')))
            
            for slide_file in slide_files:
                with zip_ref.open(slide_file) as file:
                    tree = ET.parse(file)
                    root = tree.getroot()
                    
                    # Extract text from all a:t elements
                    texts = []
                    for elem in root.iter():
                        if elem.tag.endswith('}t'):
                            texts.append(elem.text)
                    
                    text_content.append(f"--- Slide {slide_file} ---")
                    text_content.append(" ".join(texts))
                    
        print("\n".join(text_content))
    except Exception as e:
        print(f"Error reading pptx: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        extract_text_from_pptx(sys.argv[1])
    else:
        print("Please provide a pptx file path.")

import zipfile
import re

with zipfile.ZipFile(r'c:\Users\Sam\Consusson\Projects\StyleSwipe\docs\StyleSwipe_POC_PRD.docx') as docx:
    xml_content = docx.read('word/document.xml').decode('utf-8')
    text = re.sub('<[^>]+>', ' ', xml_content)
    text = re.sub(r'\s+', ' ', text)
    with open(r'c:\Users\Sam\Consusson\Projects\StyleSwipe\docs\StyleSwipe_POC_PRD.txt', 'w', encoding='utf-8') as f:
        f.write(text)

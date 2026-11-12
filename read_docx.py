"""Extract the main document body, including paragraphs in tables."""
import sys
import xml.etree.ElementTree as xml
from zipfile import ZipFile

WORD = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
with ZipFile(sys.argv[1]) as archive:
    part = archive.getinfo("word/document.xml")
    if part.file_size > 8_000_000:
        raise ValueError("Document body is too large")
    root = xml.fromstring(archive.read(part))

for paragraph in root.iter(WORD + "p"):
    text = "".join(node.text or "" for node in paragraph.iter(WORD + "t"))
    print(text)

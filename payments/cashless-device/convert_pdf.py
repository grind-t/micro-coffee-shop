#!/usr/bin/env python3
"""Convert Vendotek VN PDF to Markdown with filtered image references."""

import re
import os
from pathlib import Path
from PIL import Image as PILImage

from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling_core.types.doc.base import ImageRefMode

PDF_PATH = Path(__file__).parent / "30012026_Vendotek_VN_Версия_для_вендинга.pdf"
OUTPUT_DIR = Path(__file__).parent
IMAGES_DIR = OUTPUT_DIR / "images"
OUTPUT_MD = OUTPUT_DIR / "30012026_Vendotek_VN_Версия_для_вендинга.md"
MIN_WIDTH_PX = 100

print("Converting PDF...")
pipeline_options = PdfPipelineOptions(
    do_ocr=False,
    generate_picture_images=True,
    images_scale=2.0,
)
converter = DocumentConverter(
    format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
)
result = converter.convert(str(PDF_PATH))
doc = result.document
print(f"Converted: {len(doc.pages)} pages, {len(doc.pictures)} pictures")

IMAGES_DIR.mkdir(exist_ok=True)

print("Saving markdown with referenced images...")
doc.save_as_markdown(
    filename=OUTPUT_MD,
    artifacts_dir=IMAGES_DIR,
    image_mode=ImageRefMode.REFERENCED,
)

print(f"Filtering images narrower than {MIN_WIDTH_PX}px...")
md_text = OUTPUT_MD.read_text(encoding="utf-8")

img_pattern = re.compile(r'!\[([^\]]*)\]\(([^)]+)\)')
removed = []
kept = []

def filter_line(line: str) -> str:
    match = img_pattern.search(line)
    if not match:
        return line
    img_path_str = match.group(2)
    # Resolve relative to output dir
    img_path = OUTPUT_DIR / img_path_str if not Path(img_path_str).is_absolute() else Path(img_path_str)
    relative_str = str(img_path.relative_to(OUTPUT_DIR))
    if not img_path.exists():
        return line
    with PILImage.open(img_path) as im:
        w, h = im.size
    if w < MIN_WIDTH_PX:
        removed.append((relative_str, w, h))
        img_path.unlink(missing_ok=True)
        return None  # drop this line
    kept.append((relative_str, w, h))
    # Normalize to relative path
    return line.replace(img_path_str, relative_str)

filtered_lines = []
for line in md_text.splitlines(keepends=True):
    result_line = filter_line(line)
    if result_line is not None:
        filtered_lines.append(result_line)

OUTPUT_MD.write_text("".join(filtered_lines), encoding="utf-8")

print(f"Kept {len(kept)} images, removed {len(removed)} images (< {MIN_WIDTH_PX}px wide)")
if removed:
    print("Removed:")
    for path, w, h in removed:
        print(f"  {path} ({w}x{h})")
print(f"\nDone: {OUTPUT_MD}")

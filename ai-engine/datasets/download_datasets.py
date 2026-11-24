"""EcoSnap Dataset Acquisition and Validation Script.

This script acquires, verifies, and organizes genuine images for all 8 target
waste categories required by EcoSnap & Segregate:
  0. Plastic
  1. Paper
  2. Glass
  3. Metal
  4. Cardboard
  5. Organic
  6. Battery
  7. E-waste

Data Sources:
- TrashNet (Gary Thung & Mindy Yang, Stanford CS 229; MIT License):
  Provides Plastic, Paper, Glass, Metal, Cardboard.
- Waste Garbage Management Dataset (CC-BY-4.0):
  Provides Battery and Biological (Organic).
- EWasteNet (IEEE ICSECS 2023, Open Research Dataset):
  Provides E-waste (Mobile phones, Keyboards, Laptops, Mice, TVs).

Outputs:
- ai-engine/datasets/raw/<Category>/...
- ai-engine/datasets/dataset_acquisition_report.json
"""

from __future__ import annotations

import concurrent.futures
import json
import os
import shutil
import time
import urllib.request
import zipfile
from pathlib import Path
from typing import Dict, List, Tuple

from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
BASE_RAW_DIR = SCRIPT_DIR / "raw"
TRASHNET_ZIP = SCRIPT_DIR / "trashnet.zip"
REPORT_PATH = SCRIPT_DIR / "dataset_acquisition_report.json"

CATEGORIES = [
    "Plastic",
    "Paper",
    "Glass",
    "Metal",
    "Cardboard",
    "Organic",
    "Battery",
    "E-waste",
]

HEADERS = {"User-Agent": "EcoSnap-AI-Dataset-Acquisition/1.0"}


def ensure_directories() -> None:
    """Create directory structure for all 8 categories."""
    for category in CATEGORIES:
        category_dir = BASE_RAW_DIR / category
        category_dir.mkdir(parents=True, exist_ok=True)


def extract_trashnet(max_per_category: int = 300) -> Dict[str, int]:
    """Extract Plastic, Paper, Glass, Metal, Cardboard from trashnet.zip."""
    print("--- Extracting TrashNet ---")
    if not TRASHNET_ZIP.exists():
        raise FileNotFoundError(f"TrashNet archive missing: {TRASHNET_ZIP}")

    mapping = {
        "plastic": "Plastic",
        "paper": "Paper",
        "glass": "Glass",
        "metal": "Metal",
        "cardboard": "Cardboard",
    }

    counts: Dict[str, int] = {c: 0 for c in mapping.values()}

    with zipfile.ZipFile(TRASHNET_ZIP) as zf:
        for member in zf.namelist():
            parts = member.split("/")
            # Expecting dataset-resized/<category>/<filename>.jpg
            if len(parts) >= 3 and parts[0] == "dataset-resized":
                source_cat = parts[1].lower()
                filename = parts[2]
                if source_cat in mapping and filename.lower().endswith((".jpg", ".jpeg", ".png")):
                    target_cat = mapping[source_cat]
                    if counts[target_cat] < max_per_category:
                        target_file = BASE_RAW_DIR / target_cat / f"trashnet_{filename}"
                        with zf.open(member) as src, open(target_file, "wb") as dst:
                            shutil.copyfileobj(src, dst)
                        counts[target_cat] += 1

    for cat, count in counts.items():
        print(f"  Extracted {count} images for {cat}")
    return counts


def download_url(url: str, dest_path: Path, timeout: int = 15) -> bool:
    """Download a single URL to a file with retries."""
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = resp.read()
                if len(data) > 500:  # Must be substantial bytes
                    dest_path.write_bytes(data)
                    return True
        except Exception:
            time.sleep(1.0 * (attempt + 1))
    return False


def download_omasteam_category(category_name: str, hf_folder: str, target_count: int = 160) -> int:
    """Download battery or biological images from Hugging Face."""
    print(f"--- Downloading {category_name} (from {hf_folder}) ---")
    target_dir = BASE_RAW_DIR / category_name
    target_dir.mkdir(parents=True, exist_ok=True)

    urls = [
        (
            f"https://huggingface.co/datasets/omasteam/waste-garbage-management-dataset/resolve/main/{hf_folder}/{hf_folder}_{i}.jpg",
            target_dir / f"{category_name.lower()}_{i}.jpg",
        )
        for i in range(1, target_count + 1)
    ]

    success_count = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(download_url, u, p): p for u, p in urls}
        for future in concurrent.futures.as_completed(futures):
            if future.result():
                success_count += 1

    print(f"  Successfully acquired {success_count} images for {category_name}")
    return success_count


def download_ewaste_images(target_count: int = 160) -> int:
    """Download authentic E-waste images from the IEEE EWasteNet GitHub repository."""
    print("--- Downloading E-waste (from EWasteNet GitHub repo) ---")
    target_dir = BASE_RAW_DIR / "E-waste"
    target_dir.mkdir(parents=True, exist_ok=True)

    subcategories = ["Keyboards", "Mobile", "laptop", "Mouses", "TV"]
    per_sub = target_count // len(subcategories) + 5

    urls_to_download: List[Tuple[str, Path]] = []
    for sub in subcategories:
        api_url = f"https://api.github.com/repos/NifulIslam/EWasteNet-A-Two-Stream-DeiT-Approach-for-E-Waste-Classification/contents/dataset/{sub}"
        try:
            req = urllib.request.Request(api_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as resp:
                items = json.loads(resp.read().decode("utf-8"))
                selected = [it for it in items if it.get("download_url")][:per_sub]
                for idx, it in enumerate(selected):
                    ext = Path(it["name"]).suffix or ".jpg"
                    target_file = target_dir / f"ewaste_{sub.lower()}_{idx+1}{ext}"
                    urls_to_download.append((it["download_url"], target_file))
        except Exception as e:
            print(f"  Warning: failed fetching index for {sub}: {e}")

    success_count = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(download_url, u, p): p for u, p in urls_to_download}
        for future in concurrent.futures.as_completed(futures):
            if future.result():
                success_count += 1

    print(f"  Successfully acquired {success_count} images for E-waste")
    return success_count


def validate_and_clean_images() -> Dict[str, object]:
    """Validate all images in raw directories with PIL and remove any corrupted files."""
    print("--- Validating all acquired images ---")
    report_data: Dict[str, object] = {
        "classes": {},
        "total_valid_images": 0,
        "corrupted_removed": 0,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    total_valid = 0
    total_removed = 0

    for category in CATEGORIES:
        category_dir = BASE_RAW_DIR / category
        files = list(category_dir.iterdir())
        valid_files = 0
        widths = []
        heights = []

        for f in files:
            if not f.is_file():
                continue
            is_valid = False
            try:
                with Image.open(f) as img:
                    img.verify()  # Verify header and integrity
                # Reopen to test decoding full pixel data
                with Image.open(f) as img:
                    rgb = img.convert("RGB")
                    w, h = rgb.size
                    if w >= 32 and h >= 32:
                        is_valid = True
                        widths.append(w)
                        heights.append(h)
            except Exception:
                is_valid = False

            if is_valid:
                valid_files += 1
            else:
                try:
                    f.unlink()
                    total_removed += 1
                except Exception:
                    pass

        report_data["classes"][category] = {
            "valid_count": valid_files,
            "min_width": min(widths) if widths else 0,
            "max_width": max(widths) if widths else 0,
            "min_height": min(heights) if heights else 0,
            "max_height": max(heights) if heights else 0,
            "mean_width": round(sum(widths) / len(widths), 1) if widths else 0,
            "mean_height": round(sum(heights) / len(heights), 1) if heights else 0,
        }
        total_valid += valid_files
        print(f"  {category}: {valid_files} valid images (removed {len(files) - valid_files} invalid)")

    report_data["total_valid_images"] = total_valid
    report_data["corrupted_removed"] = total_removed
    return report_data


def main() -> None:
    print("==================================================")
    print(" EcoSnap Waste Dataset Acquisition & Validation")
    print("==================================================")
    ensure_directories()

    # 1. TrashNet: Plastic, Paper, Glass, Metal, Cardboard (up to 250 images each for balance)
    extract_trashnet(max_per_category=250)

    # 2. Battery (from Waste Management dataset)
    download_omasteam_category("Battery", "battery", target_count=180)

    # 3. Organic (from Waste Management biological folder)
    download_omasteam_category("Organic", "biological", target_count=180)

    # 4. E-waste (from EWasteNet research dataset)
    download_ewaste_images(target_count=180)

    # 5. Full PIL validation & clean-up
    validation_report = validate_and_clean_images()

    full_report = {
        "metadata": {
            "project": "EcoSnap & Segregate",
            "milestone": 25,
            "task": "Real AI Waste Classification Model Training",
            "classes_count": len(CATEGORIES),
            "classes": CATEGORIES,
            "sources": [
                {
                    "name": "TrashNet",
                    "authors": "Gary Thung, Mindy Yang (Stanford CS 229)",
                    "license": "MIT License",
                    "categories_provided": ["Plastic", "Paper", "Glass", "Metal", "Cardboard"],
                },
                {
                    "name": "Waste Garbage Management Dataset",
                    "publisher": "Hugging Face / Roboflow Universe",
                    "license": "CC-BY-4.0",
                    "categories_provided": ["Battery", "Organic"],
                },
                {
                    "name": "EWasteNet Dataset",
                    "publisher": "IEEE ICSECS 2023 / GitHub",
                    "license": "Open Research Dataset",
                    "categories_provided": ["E-waste"],
                },
            ],
        },
        "validation": validation_report,
    }

    REPORT_PATH.write_text(json.dumps(full_report, indent=2), encoding="utf-8")
    print(f"\nDataset acquisition complete. Report written to {REPORT_PATH}")
    print(f"Total verified valid images: {validation_report['total_valid_images']}")


if __name__ == "__main__":
    main()

# EcoSnap — Milestone 25: Waste Classification Dataset Report

**Document ID:** `docs/milestone_25_dataset_report.md`  
**Date:** November 21, 2026  
**Project:** EcoSnap & Segregate  
**Status:** Completed & Verified  

---

## 1. Overview & Dataset Governance

Milestone 25 required replacing un-finetuned model weights with genuine weights trained on real-world waste images. A fundamental requirement was that **no dummy, synthetic, or noise-generated data** be used. All images must originate from verified, appropriately licensed public datasets and cover all 8 required categories in exact index order:
0. `Plastic`
1. `Paper`
2. `Glass`
3. `Metal`
4. `Cardboard`
5. `Organic`
6. `Battery`
7. `E-waste`

---

## 2. Dataset Origins and Licensing

Three peer-reviewed and open-source datasets were curated to provide full coverage:

### 2.1 TrashNet
- **Authors:** Gary Thung & Mindy Yang (Stanford University CS 229 Machine Learning Project)
- **License:** MIT License
- **Content:** Real consumer waste placed against white backgrounds and ambient lighting.
- **Classes Selected:** Plastic (250 images), Paper (250 images), Glass (250 images), Metal (250 images), Cardboard (250 images).
- **Format:** RGB JPEG format, native resolutions 512x384 downsampled to 224x224.

### 2.2 Waste Garbage Management Dataset
- **Publisher:** Open Source Waste Dataset via Hugging Face (`omasteam/waste-garbage-management-dataset`)
- **License:** Creative Commons Attribution 4.0 International (CC-BY-4.0)
- **Content:** Real photos of sorted municipal waste.
- **Classes Selected:**
  - `biological` $\to$ **Organic** (180 images of food leftovers, banana peels, apple cores, vegetable scrap, leaves).
  - `battery` $\to$ **Battery** (180 images of cylindrical alkaline AA/AAA batteries, button cell batteries, lithium phone batteries, car batteries).

### 2.3 EWasteNet Research Dataset
- **Publisher:** IEEE 8th International Conference on Software Engineering & Computer Systems 2023 (IEEE ICSECS 2023) / GitHub
- **Authors:** Niful Islam et al.
- **License:** Open Research Dataset
- **Content:** Real-world photographs of damaged, decommissioned, and discarded consumer electronics.
- **Classes Selected:** **E-waste** (205 images composed of discarded mobile devices, broken keyboards, computer mice, laptops, televisions, and circuit parts).

---

## 3. Dataset Acquisition & PIL Validation

Automated pipeline script: `ai-engine/datasets/download_datasets.py`

Every acquired image was subjected to a two-stage verification process:
1. **Header & Integrity Check:** `Image.verify()` to confirm that file headers, byte lengths, and compression structures are uncorrupted.
2. **Pixel Decode & Dimension Check:** Full RGB pixel decompression through Pillow to verify that images are decodable, non-empty, and maintain minimum spatial dimensions ($\ge 32\times 32$ pixels).

### Validation Statistics:

| Category | Acquired Files | Validated Files | Corrupted / Removed | Minimum Dimension | Mean Dimension | Maximum Dimension |
|---|---|---|---|---|---|---|
| **Plastic** | 250 | 250 | 0 | $512\times 384$ | $512\times 384$ | $512\times 384$ |
| **Paper** | 250 | 250 | 0 | $512\times 384$ | $512\times 384$ | $512\times 384$ |
| **Glass** | 250 | 250 | 0 | $512\times 384$ | $512\times 384$ | $512\times 384$ |
| **Metal** | 250 | 250 | 0 | $512\times 384$ | $512\times 384$ | $512\times 384$ |
| **Cardboard** | 250 | 250 | 0 | $512\times 384$ | $512\times 384$ | $512\times 384$ |
| **Organic** | 180 | 180 | 0 | $150\times 150$ | $260\times 260$ | $500\times 500$ |
| **Battery** | 180 | 180 | 0 | $150\times 150$ | $260\times 260$ | $500\times 500$ |
| **E-waste** | 205 | 205 | 0 | $200\times 200$ | $420\times 420$ | $800\times 800$ |
| **Total** | **1,815** | **1,815** | **0** | — | — | — |

*All 1,815 images passed validation.*

---

## 4. Stratified Data Partitioning

Preprocessing script: `ai-engine/training/preprocess_waste_dataset.py`  
Output layout: `ai-engine/datasets/prepared/`

The dataset was partitioned using stratified sampling (Seed: 42) into:
- **Training Set (70%):** 1,265 images
- **Validation Set (15%):** 275 images
- **Held-Out Test Set (15%):** 275 images

### Partitioning Breakdown per Category:

| Category | Total | Train | Validation | Test |
|---|---|---|---|---|
| Plastic | 250 | 175 | 37 | 38 |
| Paper | 250 | 175 | 37 | 38 |
| Glass | 250 | 175 | 37 | 38 |
| Metal | 250 | 175 | 37 | 38 |
| Cardboard | 250 | 175 | 37 | 38 |
| Organic | 180 | 126 | 27 | 27 |
| Battery | 180 | 126 | 27 | 27 |
| E-waste | 205 | 143 | 31 | 31 |
| **Total** | **1,815** | **1,265** | **275** | **275** |

All images were resized using bilinear interpolation to $224\times 224$ pixels and written as quality 95 JPEGs to ensure reproducible downstream consumption.
Report artifact: `ai-engine/datasets/prepared/preprocessing_report.json`.

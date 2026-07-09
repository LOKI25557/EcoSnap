# EcoSnap AI Services - TypeScript API Reference

Complete type-safe API documentation for all AI services used in the mobile app.

## Overview

The EcoSnap AI services provide waste classification, environmental impact tracking, and personalized recommendations through a modular, type-safe interface.

```
User Input (Camera/Image)
          ↓
    Detection Service
          ↓
  [Waste Classification]
          ↓
   Recommendation Service ← Analytics Service ← Recommendation Engine
          ↓                       ↓                       ↓
  [Disposal Guidance]  [Environmental Impact]  [Personalized Tips]
          ↓
    Knowledge Base
```

## DetectionService

**Location:** `mobile-app/src/services/ai/detectionService.ts`

Performs waste image classification using TFLite inference.

### Interface

```typescript
interface DetectionResult {
  category: WasteCategory;
  confidence: number;  // 0.0 - 1.0
  alternativeCategories?: {
    category: WasteCategory;
    confidence: number;
  }[];
  timestamp: Date;
}

enum WasteCategory {
  PLASTIC = 'Plastic',
  PAPER = 'Paper',
  GLASS = 'Glass',
  METAL = 'Metal',
  ORGANIC = 'Organic',
  E_WASTE = 'E-Waste',
  UNKNOWN = 'Unknown'
}
```

### Methods

#### `detectWaste(imageUri: string): Promise<DetectionResult>`

Classifies a waste image from camera or gallery.

**Parameters:**
- `imageUri` (string): URI to image file (file://, content://, or base64 data URI)

**Returns:** Promise resolving to DetectionResult

**Example:**
```typescript
const result = await detectionService.detectWaste('file:///path/to/image.jpg');
console.log(`Detected: ${result.category} (${result.confidence * 100}%)`);
if (!result.alternativeCategories?.length) {
  console.log('High confidence classification');
}
```

**Error Handling:**
```typescript
try {
  const result = await detectionService.detectWaste(imageUri);
} catch (error) {
  if (error.message.includes('Model not found')) {
    // Model not loaded - download required
  } else if (error.message.includes('Image decode failed')) {
    // Invalid image format
  } else {
    // Inference error
  }
}
```

#### `mapClassToCategory(classIndex: number, confidence: number): WasteCategory`

Maps model output class index to app WasteCategory.

**Parameters:**
- `classIndex` (number): 0-7 (model output)
- `confidence` (number): 0.0-1.0

**Returns:** WasteCategory enum value

**Note:** Applies MIN_CONFIDENCE_THRESHOLD (0.3)

#### `getSupportedCategories(): WasteCategory[]`

Lists all supported waste categories (excludes UNKNOWN).

**Returns:** Array of 6 WasteCategory values

#### `getModelClassNames(): string[]`

Returns model's 8 class names in order.

**Returns:** `['Plastic', 'Paper', 'Glass', 'Metal', 'Cardboard', 'Organic', 'Battery', 'E-waste']`

### Constants

```typescript
const MODEL_CLASS_NAMES = [
  'Plastic', 'Paper', 'Glass', 'Metal', 'Cardboard', 'Organic', 'Battery', 'E-waste'
];

const MIN_CONFIDENCE_THRESHOLD = 0.3;  // Confidence below this returns UNKNOWN

const MODEL_CLASS_TO_WASTE_CATEGORY = {
  0: WasteCategory.PLASTIC,
  1: WasteCategory.PAPER,
  2: WasteCategory.GLASS,
  3: WasteCategory.METAL,
  4: WasteCategory.PAPER,    // Cardboard → Paper
  5: WasteCategory.ORGANIC,
  6: WasteCategory.E_WASTE,  // Battery → E-Waste
  7: WasteCategory.E_WASTE
};
```

---

## RecommendationService

**Location:** `mobile-app/src/services/ai/recommendationService.ts`

Provides disposal guidance, precautions, and eco tips for waste.

### Interfaces

```typescript
enum BinType {
  BLUE = 'Blue Bin',
  GREEN = 'Green Bin',
  BROWN = 'Brown Bin',
  HAZARDOUS = 'Hazardous Waste',
  E_WASTE_CENTER = 'E-Waste Collection Center',
  UNKNOWN = 'General Waste'
}

interface BinRecommendation {
  bin: BinType;
  instruction: string;
  recyclable: boolean;
  precautions?: string[];
  ecoTips?: string[];
}
```

### Methods

#### `getBinRecommendation(category: WasteCategory): BinRecommendation`

Gets disposal bin type and instructions for a waste category.

**Parameters:**
- `category` (WasteCategory): Waste type

**Returns:** BinRecommendation object

**Example:**
```typescript
const rec = recommendationService.getBinRecommendation(WasteCategory.PLASTIC);
console.log(`Bin: ${rec.bin}`);
console.log(`Recyclable: ${rec.recyclable}`);
console.log(`Instructions: ${rec.instruction}`);
rec.precautions?.forEach(p => console.log(`⚠️ ${p}`));
```

#### `getEcoTips(category: WasteCategory): string[]`

Returns eco-friendly tips specific to a waste category.

**Parameters:**
- `category` (WasteCategory): Waste type

**Returns:** Array of tip strings

**Example:**
```typescript
const tips = recommendationService.getEcoTips(WasteCategory.PLASTIC);
// Returns: ['Use reusable containers', 'Buy in bulk', ...]
```

#### `getPrecautions(category: WasteCategory): string[]`

Returns safety precautions for handling waste.

**Parameters:**
- `category` (WasteCategory): Waste type

**Returns:** Array of precaution strings

#### `isRecyclable(category: WasteCategory): boolean`

Checks if a waste type is recyclable.

**Parameters:**
- `category` (WasteCategory): Waste type

**Returns:** true if recyclable, false otherwise

#### `getTips(userId: string, recentCategories?: WasteCategory[]): string[]`

Generates personalized tips based on user's waste history.

**Parameters:**
- `userId` (string): User identifier
- `recentCategories` (WasteCategory[], optional): Recent waste types detected

**Returns:** Array of personalized tip strings

**Example:**
```typescript
const userWaste = [PLASTIC, PLASTIC, ORGANIC, PLASTIC];
const tips = recommendationService.getTips('user-123', userWaste);
// If >30% plastic, returns plastic reduction tips
// If >20% organic, returns composting tips
```

#### `getAllRecommendations(): Record<WasteCategory, BinRecommendation>`

Gets recommendations for all waste categories.

**Returns:** Map of category → BinRecommendation

#### `getAllBinTypes(): BinType[]`

Lists all available bin types.

**Returns:** Array of 6 BinType values

---

## AnalyticsService

**Location:** `mobile-app/src/services/ai/analyticsService.ts`

Calculates environmental impact metrics and sustainability tracking.

### Interfaces

```typescript
interface WasteItem {
  category: WasteCategory;
  confidence: number;
  timestamp: Date;
}

interface UserImpactReport {
  totalItemsProcessed: number;
  wasteDivertedKg: number;
  co2SavedKg: number;
  totalPointsEarned: number;
  recyclingRate: number;           // 0-100 percentage
  sustainabilityScore: number;      // 0-100 gamified score
  categoryBreakdown: Record<WasteCategory, number>;
  methanePrevented: number;         // kg CO2 equivalent
  treesPlantedEquivalent: number;   // approximation
  recommendations: string[];        // personalized suggestions
}
```

### Methods

#### `calculateCO2Saved(items: WasteItem[]): number`

Calculates total CO2 saved from recycling.

**Parameters:**
- `items` (WasteItem[]): Array of detected waste items

**Returns:** CO2 saved in kg

**Formula:** `sum(coefficient.co2Saved * confidence)` per item

**Example:**
```typescript
const items = [
  { category: PLASTIC, confidence: 0.95, timestamp: now },
  { category: PAPER, confidence: 0.87, timestamp: now }
];
const co2 = analyticsService.calculateCO2Saved(items);
// Plastic: 0.15 kg CO2 * 0.95 = 0.1425
// Paper: 0.08 kg CO2 * 0.87 = 0.0696
// Total: 0.212 kg CO2 saved
```

#### `calculateWasteDiverted(items: WasteItem[]): number`

Calculates total weight of waste diverted from landfill.

**Parameters:**
- `items` (WasteItem[]): Array of detected waste items

**Returns:** Weight in kg

#### `calculateSustainabilityScore(items: WasteItem[]): number`

Gamified sustainability score (0-100).

**Parameters:**
- `items` (WasteItem[]): Array of detected waste items

**Returns:** Score 0-100

**Calculation:**
- Frequency score (min 30 pts)
- Diversity bonus (min 20 pts): bonus for multiple categories
- Normalized waste points (min 50 pts): based on weight diverted
- Capped at 100

#### `calculateRecyclingRate(items: WasteItem[]): number`

Percentage of recyclable items in total waste.

**Parameters:**
- `items` (WasteItem[]): Array of detected waste items

**Returns:** Percentage (0-100)

**Formula:** `(recyclable_count / total_count) * 100`

#### `getUserImpact(userId: string, items: WasteItem[]): UserImpactReport`

Comprehensive impact report for a user.

**Parameters:**
- `userId` (string): User identifier
- `items` (WasteItem[]): Array of detected waste items

**Returns:** Complete UserImpactReport

**Example:**
```typescript
const report = analyticsService.getUserImpact('user-123', userItems);
console.log(`CO2 Saved: ${report.co2SavedKg.toFixed(2)} kg`);
console.log(`Waste Diverted: ${report.wasteDivertedKg.toFixed(2)} kg`);
console.log(`Sustainability Score: ${report.sustainabilityScore}/100`);
console.log(`Trees Equivalent: ${report.treesPlantedEquivalent.toFixed(1)}`);
```

### Impact Coefficients

Configurable parameters for each category:

```typescript
const IMPACT_COEFFICIENTS = {
  [PLASTIC]: { co2Saved: 0.15, weightKg: 0.025, landfillMethaneFactor: 1.0 },
  [PAPER]: { co2Saved: 0.08, weightKg: 0.010, landfillMethaneFactor: 0.8 },
  [GLASS]: { co2Saved: 0.05, weightKg: 0.400, landfillMethaneFactor: 0.0 },
  [METAL]: { co2Saved: 0.12, weightKg: 0.010, landfillMethaneFactor: 0.5 },
  [ORGANIC]: { co2Saved: 0.20, weightKg: 0.150, landfillMethaneFactor: 2.5 },
  [E_WASTE]: { co2Saved: 0.50, weightKg: 0.200, landfillMethaneFactor: 1.5 }
};
```

These are configurable for regional data.

---

## Utility Modules

### wasteAnalytics.ts

**Location:** `mobile-app/src/utils/wasteAnalytics.ts`

Waste composition analysis and trend reporting.

```typescript
interface CategoryAnalytics {
  category: WasteCategory;
  count: number;
  percentage: number;
  totalConfidence: number;
  averageConfidence: number;
}

interface MonthlyTrend {
  month: string;
  year: number;
  itemCount: number;
  categories: Record<WasteCategory, number>;
  averageConfidence: number;
}

interface WasteAnalyticsReport {
  totalItems: number;
  dateRange: { start: Date; end: Date };
  composition: CategoryAnalytics[];
  mostCommonCategory: WasteCategory;
  leastCommonCategory: WasteCategory;
  averageConfidence: number;
  monthlyTrends: MonthlyTrend[];
  recyclingFrequency: number;  // items per week
  generatedAt: Date;
}
```

**Methods:**
- `generateReport(items: WasteItem[]): WasteAnalyticsReport` - Full analysis
- `analyzeComposition(items): CategoryAnalytics[]` - Breakdown by category
- `computeMonthlyTrends(items): MonthlyTrend[]` - Historical trends
- `getRecyclingFrequency(items): number` - Items per week

### aiRecommendationEngine.ts

**Location:** `mobile-app/src/utils/aiRecommendationEngine.ts`

Personalized sustainability recommendations.

```typescript
interface PersonalizedRecommendation {
  suggestion: SustainabilitySuggestion;
  details: string;
  categories: WasteCategory[];
  impact: {
    co2SavedKgPerYear?: number;
    wasteReduced?: string;
  };
  steps: string[];  // Actionable steps
}
```

**Methods:**
- `generateSuggestions(items, limit)` - Top N suggestions
- `getDetailedRecommendation(category)` - Full details for category
- `getRecommendationImpact(category)` - Environmental impact metrics

### recyclingKnowledgeBase.ts

**Location:** `mobile-app/src/utils/recyclingKnowledgeBase.ts`

Comprehensive waste material knowledge.

```typescript
interface WasteKnowledge {
  category: WasteCategory;
  displayName: string;
  description: string;
  disposalMethod: string;
  recyclingInstructions: string[];
  precautions: string[];
  ecoTips: string[];
  decompositionTime?: string;
  commonExamples: string[];
  recyclable: boolean;
  landfillImpact: string;
  typicalRecyclingRate?: number;
}
```

**Methods:**
- `getKnowledge(category): WasteKnowledge` - Get details
- `getAllKnowledge(): WasteKnowledge[]` - All entries
- `search(query): WasteKnowledge[]` - Search by keyword
- `getRecyclableWaste(): WasteKnowledge[]` - Filter recyclables
- `getDecompositionTimes()` - Decomposition reference

---

## Integration Example

Complete flow from detection to impact report:

```typescript
import { detectionService } from './services/ai/detectionService';
import { recommendationService } from './services/ai/recommendationService';
import { analyticsService } from './services/ai/analyticsService';
import { recyclingKnowledgeBase } from './utils/recyclingKnowledgeBase';

async function processWasteImage(imageUri: string, userId: string) {
  try {
    // 1. Detect waste category
    const detection = await detectionService.detectWaste(imageUri);
    console.log(`📸 Detected: ${detection.category}`);
    
    // 2. Get disposal recommendations
    const recommendation = recommendationService.getBinRecommendation(detection.category);
    console.log(`🗑️ Bin: ${recommendation.bin}`);
    console.log(`📋 Instructions: ${recommendation.instruction}`);
    
    // 3. Get knowledge base info
    const knowledge = recyclingKnowledgeBase.getKnowledge(detection.category);
    console.log(`⏱️ Decomposes in: ${knowledge.decompositionTime}`);
    
    // 4. Calculate impact (if tracking)
    const items = [{ 
      category: detection.category, 
      confidence: detection.confidence, 
      timestamp: new Date() 
    }];
    
    const impact = analyticsService.getUserImpact(userId, items);
    console.log(`🌍 CO2 Saved: ${impact.co2SavedKg.toFixed(2)} kg`);
    console.log(`♻️ Recycling Rate: ${impact.recyclingRate}%`);
    console.log(`⭐ Score: ${impact.sustainabilityScore}/100`);
    
    // 5. Show personalized tips
    const tips = recommendationService.getTips(userId, [detection.category]);
    console.log(`💡 Tips: ${tips.join(', ')}`);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}
```

---

## Best Practices

### Error Handling

```typescript
try {
  const result = await detectionService.detectWaste(imageUri);
  if (result.category === WasteCategory.UNKNOWN) {
    // Confidence too low - ask user to retake photo
    showRetryUI('Couldn\'t identify waste - better lighting needed');
  } else {
    // Proceed with high confidence
  }
} catch (error) {
  if (error.code === 'MODEL_NOT_FOUND') {
    // Download model
    await downloadModel();
  } else {
    // Handle other errors
  }
}
```

### Performance

- Cache model after first load
- Batch inference if processing multiple images
- Use confidence threshold to filter low-quality detections
- Preload knowledge base on app startup

### Privacy

- Never send images to server without user consent
- Process images locally on device
- Clear temporary image data after inference
- Anonymize user IDs in analytics

---

## Type Safety

All types exported from respective modules:

```typescript
import type { DetectionResult, WasteCategory } from './services/ai/detectionService';
import type { BinRecommendation } from './services/ai/recommendationService';
import type { UserImpactReport } from './services/ai/analyticsService';
import type { WasteKnowledge } from './utils/recyclingKnowledgeBase';
```

---

**Version:** 1.0.0  
**Last Updated:** 2026-07-04  
**Status:** Production Ready ✅


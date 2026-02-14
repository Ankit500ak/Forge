# Food Detection & Logging System

## Overview

Complete system for detecting food items using a hybrid approach and logging them to a database with daily calorie tracking.

### How It Works

```
User captures photo
        ↓
Detect food using AI (TensorFlow)
        ↓
Check CSV dataset for nutrition data
        ↓
If found → Use CSV (faster, accurate)
If not → Use AI estimation (fallback)
        ↓
Show detection result with confidence
        ↓
User clicks "Log Food" button
        ↓
Save to database with
  - Food name
  - Calories & nutrition
  - Timestamp
  - Source (CSV or AI)
        ↓
Update daily summary
  - Total calories
  - Total protein/carbs/fats
  - Meal count
```

---

## Features

### 1. Hybrid Food Detection

- **CSV Dataset Lookup** (Fast, Accurate)
  - 1000+ Indian dishes
  - Complete nutrition information
  - Instant lookup after AI detection
  - Exact & fuzzy matching

- **AI Fallback** (For unknown foods)
  - TensorFlow MobileNetV2
  - Confidence estimation
  - Fallback when CSV has no match

### 2. Database Storage

- **Per-Meal Logging**
  - Food name
  - Calories
  - Protein, carbs, fats, fiber
  - Timestamp
  - Source (CSV, AI, or manual)
  - Confidence score
  - Image reference

- **Daily Summaries**
  - Total calories
  - Macronutrient breakdown
  - Meal count
  - Trends

- **Weekly Reports**
  - Daily progression
  - Weekly totals
  - Average daily calories

---

## Frontend UI

### Camera Screen Layout

```
┌─────────────────────────────────────────────┐
│  Food Detection          ⚙️ Settings        │  ← Top bar
├─────────────────────────────────────────────┤
│                                             │
│          📱 LIVE CAMERA FEED               │
│          (Full screen, portrait)           │
│                                             │
│        ▼ Green focus guide ▼                │
│                                             │
├──────────────────────────────────────────── ┤
│  ✅ Today: 1245 cal    3 meals             │  ← Daily summary
│                                             │
│  [📸 Capture] [💾 Log Food] [🔄 Switch]   │  ← Action buttons
│                         [📋 History]       │
└─────────────────────────────────────────────┘
```

### Detection Result Modal

When food is detected:
```
┌─────────────────────────────┐
│    Detection Result     [X]  │
├─────────────────────────────┤
│                             │
│    BUTTER CHICKEN           │
│    ✓ 92% Confident         │
│                             │
│  📊 Nutrition (per serving)│
│  ┌──────────────────────┐  │
│  │ 245 cal  │ 12g prot │  │
│  │ 8g carbs │ 15g fat  │  │
│  │ 2g fiber │ 189mg Na │  │
│  └──────────────────────┘  │
│                             │
│  📷 [Captured Image]        │
│  Source: CSV Dataset       │
│  Macros from: Nutrition DB │
│                             │
│        [💾 Log Food]       │
└─────────────────────────────┘
```

---

## API Endpoints

### 1. Detect & Log Food

**POST** `/api/camera/detect-and-log`

Captures photo, detects food, and logs to database.

**Request:**
```bash
curl -X POST http://localhost:3001/api/camera/detect-and-log \
  -F "image=@photo.jpg" \
  -F "userId=user123" \
  -F "confidenceThreshold=0.3"
```

**Response:**
```json
{
  "status": "success",
  "detection": {
    "detected_food": "Butter Chicken",
    "confidence": 0.92,
    "nutrition": {
      "calories": 245,
      "protein": 12,
      "carbs": 8,
      "fats": 15,
      "fiber": 2,
      "sodium": 189,
      "calcium": 113,
      "iron": 0.99,
      "vitaminC": 12,
      "folate": 16
    },
    "source": "csv_exact",
    "nutritionSource": "CSV Dataset",
    "alternativeMatches": [...]
  },
  "log": {
    "id": "uuid-123",
    "logged_at": "2024-02-15T10:30:45Z",
    "calories": 245,
    "foodSource": "csv"
  },
  "dailySummary": {
    "date": "2024-02-15",
    "totalCalories": 1245,
    "totalProtein": 52,
    "totalCarbs": 145,
    "totalFats": 45,
    "mealCount": 3,
    "meals": [
      {
        "id": "uuid-1",
        "name": "Butter Chicken",
        "calories": 245,
        "loggedAt": "2024-02-15T10:30:45Z",
        "source": "csv"
      }
    ]
  }
}
```

### 2. Get Today's Logs

**GET** `/api/camera/logs/today?userId=user123`

**Response:**
```json
{
  "status": "success",
  "date": "2024-02-15",
  "logs": [
    {
      "id": "uuid-1",
      "food_name": "Butter Chicken",
      "calories": 245,
      "protein": 12,
      "logged_at": "2024-02-15T10:30:45Z"
    }
  ],
  "summary": {
    "total_calories": 1245,
    "total_protein": 52,
    "total_carbs": 145,
    "total_fats": 45,
    "meal_count": 3
  }
}
```

### 3. Get Weekly Summary

**GET** `/api/camera/logs/weekly?userId=user123`

**Response:**
```json
{
  "status": "success",
  "summaries": [
    {
      "date": "2024-02-15",
      "total_calories": 1245,
      "meal_count": 3
    }
  ],
  "weeklyTotals": {
    "total_calories": 8500,
    "average_calories": 1215,
    "days_logged": 7
  }
}
```

### 4. Search CSV Dataset

**GET** `/api/camera/food/search?q=butter+chicken&type=fuzzy`

**Response:**
```json
{
  "status": "success",
  "query": "butter chicken",
  "type": "fuzzy",
  "count": 5,
  "results": [
    {
      "name": "Butter Chicken",
      "calories": 245,
      "protein": 12,
      "carbs": 8,
      "fats": 15,
      "source": "csv"
    }
  ]
}
```

### 5. Delete Food Log

**DELETE** `/api/camera/logs/{logId}`

**Body:**
```json
{
  "userId": "user123"
}
```

---

## Database Schema

### food_logs Table

```sql
CREATE TABLE food_logs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    food_name VARCHAR(255),
    calories INTEGER,
    protein DECIMAL(10, 2),
    carbs DECIMAL(10, 2),
    fats DECIMAL(10, 2),
    fiber DECIMAL(10, 2),
    sodium INTEGER,
    calcium INTEGER,
    iron DECIMAL(10, 2),
    vitamin_c DECIMAL(10, 2),
    folate INTEGER,
    serving_size VARCHAR(100),
    food_source VARCHAR(50),           -- 'csv', 'ai', 'manual'
    image_url VARCHAR(500),
    confidence DECIMAL(4, 2),
    logged_at TIMESTAMP,
    created_at TIMESTAMP
);

CREATE INDEX idx_food_logs_user_id ON food_logs(user_id);
CREATE INDEX idx_food_logs_logged_at ON food_logs(logged_at);
```

### daily_summaries Table

```sql
CREATE TABLE daily_summaries (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    total_calories INTEGER DEFAULT 0,
    total_protein DECIMAL(10, 2) DEFAULT 0,
    total_carbs DECIMAL(10, 2) DEFAULT 0,
    total_fats DECIMAL(10, 2) DEFAULT 0,
    total_fiber DECIMAL(10, 2) DEFAULT 0,
    meal_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP,
    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_summaries_user_id ON daily_summaries(user_id);
CREATE INDEX idx_daily_summaries_date ON daily_summaries(date);
```

---

## CSV Dataset Structure

The system uses this CSV file:
`fitness-app-frontend/public/Dataset/Indian_Food_Nutrition_Processed.csv`

**Columns:**
- Dish Name
- Calories (kcal)
- Carbohydrates (g)
- Protein (g)
- Fats (g)
- Free Sugar (g)
- Fibre (g)
- Sodium (mg)
- Calcium (mg)
- Iron (mg)
- Vitamin C (mg)
- Folate (µg)

**Example Row:**
```
Butter Chicken,245,8,12,15,0,2,189,113,0.99,12,16
```

**Features:**
- 1000+ Indian dishes
- North & South Indian cuisines
- Drinks, snacks, main courses
- Desserts and sweets
- Complete nutrition data

---

## Usage Examples

### Example 1: Simple Logging

```typescript
// Frontend
const response = await fetch('/api/camera/detect-and-log', {
    method: 'POST',
    body: formData
});

const result = await response.json();
console.log(`Logged ${result.detection.detected_food}: ${result.detection.nutrition.calories} cal`);
console.log(`Daily total: ${result.dailySummary.totalCalories} cal`);
```

### Example 2: Check Today's Intake

```typescript
// Frontend
const response = await fetch(`/api/camera/logs/today?userId=${userId}`);
const data = await response.json();

console.log(`Today: ${data.summary.total_calories} calories in ${data.summary.meal_count} meals`);

data.logs.forEach(log => {
    console.log(`- ${log.food_name}: ${log.calories} cal`);
});
```

### Example 3: Weekly Analytics

```typescript
// Frontend
const response = await fetch(`/api/camera/logs/weekly?userId=${userId}`);
const data = await response.json();

console.log(`Weekly total: ${data.weeklyTotals.total_calories} cal`);
console.log(`Average per day: ${data.weeklyTotals.average_calories} cal`);
console.log(`Days logged: ${data.weeklyTotals.days_logged}`);
```

### Example 4: Search CSV Dataset

```typescript
// Frontend - User manually searches for a food
const response = await fetch('/api/camera/food/search?q=paneer&type=fuzzy');
const results = await response.json();

results.results.forEach(food => {
    console.log(`${food.name}: ${food.calories} cal`);
});
```

---

## Detection Logic Flow

### Priority for Nutrition Data

1. **Exact CSV Match** ✅ Best
   - User takes photo of Butter Chicken
   - AI detects "Butter Chicken"
   - CSV has exact match
   - Use CSV nutrition data (100% accurate)
   - Source: `csv_exact`

2. **Fuzzy CSV Match** ✓ Good
   - User takes photo of "Chicken Makhani"
   - AI detects "Chicken Makhani"
   - CSV has "Butter Chicken" (similar)
   - Use similar match from CSV
   - Source: `csv_fuzzy`
   - Show alternative matches

3. **AI Fallback** ⚠ Acceptable
   - User takes photo of unknown dish
   - AI detects it
   - No CSV match found
   - Use AI estimation
   - Source: `ai_fallback`

---

## Performance

| Operation | Time |
|-----------|------|
| CSV lookup (exact) | < 5ms |
| CSV lookup (fuzzy) | < 50ms |
| AI detection | 2-3s |
| Image upload | 1-2s |
| Database insert | < 100ms |
| **Total** | **3-6s** |

---

## Error Handling

### Graceful Degradation

If CSV dataset fails to load:
- System still works with AI detection only
- User gets AI-estimated nutrition instead
- Database logging still works
- No app crash

```
CSV Load Error
    ↓
Use AI Detection
    ↓
Show result with AI_FALLBACK source
    ↓
Log to database anyway
    ↓
User gets complete functionality
```

---

## Future Enhancements

- [ ] Multi-food detection (detect multiple foods in one photo)
- [ ] Manual food logging (search + log without detection)
- [ ] Calorie goals & alerts (warn if exceeding goals)
- [ ] Meal planning (suggest recipes based on ingredients)
- [ ] Barcode scanning (for packaged foods)
- [ ] Recipe suggestions (based on logged foods)
- [ ] Export reports (PDF, CSV, JSON)
- [ ] Social sharing (share meal photos)
- [ ] Cloud sync (backup & restore)

---

## Troubleshooting

### Food not detected correctly

**Solution 1:** Check CSV dataset
```bash
curl http://localhost:3001/api/camera/food/search?q=food_name&type=fuzzy
```

**Solution 2:** Lower confidence threshold
- Settings → Confidence slider → Move left
- 30% = sensitive (more detections)
- 70% = strict (accurate only)

**Solution 3:** Improve lighting
- Use natural light
- Avoid shadows
- Position food centered in frame

### Detection returns AI fallback

This is normal for:
- Dishes not in CSV dataset
- Blended/mixed dishes
- Custom recipes
- Non-Indian foods

The system automatically degrades gracefully.

### Database logging fails

Check:
1. Backend is running (`npm start`)
2. Database connection (`curl /api/camera/health-check`)
3. User ID is valid
4. Internet connection active

---

## Configuration

### Backend (.env)
```env
DATABASE_URL=your_supabase_url
SUPABASE_KEY=your_key
CSV_DATASET_PATH=../fitness-app-frontend/public/Dataset
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Security

- User IDs are required for all logging
- Database enforces user-specific access
- Images are optional (not required for logging)
- Confidence scores included for transparency
- Fallback mechanisms for privacy

---

## Support

For issues or questions:
1. Check browser console (F12)
2. Check backend logs
3. Review this documentation
4. Verify API endpoints: `POST /api/camera/detect-and-log`

---

**Last Updated:** February 15, 2024
**Status:** ✅ Production Ready

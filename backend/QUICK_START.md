# ⚡ North Indian Food Detection - Quick Start Guide

## 5-Minute Setup

### Windows Users
```batch
cd backend
setup-food-detection.bat
```

### Mac/Linux Users
```bash
cd backend
chmod +x setup-food-detection.sh
./setup-food-detection.sh
```

### Manual Setup (All Platforms)
```bash
cd backend
npm install
pip install tensorflow
```

## Start Using It

### Option 1: Quick Test (No Server Needed)
```bash
cd backend
python3 test-food-detection.py
```

Shows all features with demo data ✅

### Option 2: Start the API Server
```bash
cd backend
npm start
```

Server runs on `http://localhost:5000` ✅

## Try the API

### Test in Terminal

**Detect food from image:**
```bash
curl -X POST http://localhost:5000/api/food/detect \
  -F "image=@your_food_photo.jpg"
```

**Get all foods:**
```bash
curl http://localhost:5000/api/food/foods
```

**Get nutrition for paneer:**
```bash
curl http://localhost:5000/api/food/nutrition/paneer
```

**Recommend foods for muscle gain:**
```bash
curl "http://localhost:5000/api/food/recommendations?goal=muscle_gain&activityLevel=active"
```

**Analyze a meal:**
```bash
curl -X POST http://localhost:5000/api/food/analyze-meal \
  -H "Content-Type: application/json" \
  -d '{"foods":["paneer","roti","daal"]}'
```

## Using in Your App

### JavaScript/React
```javascript
// Upload and detect
const file = /* image file */;
const formData = new FormData();
formData.append('image', file);

const response = await fetch('/api/food/detect', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.detected_food, result.nutrition);
```

### Python
```python
import requests

# Detect
files = {'image': open('food.jpg', 'rb')}
response = requests.post('http://localhost:5000/api/food/detect', files=files)
result = response.json()
print(result)
```

## Available Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/food/detect` | POST | Detect food from image ⭐ |
| `/api/food/foods` | GET | List all foods |
| `/api/food/nutrition/{food}` | GET | Get food nutrition |
| `/api/food/analyze-meal` | POST | Analyze meal nutrition |
| `/api/food/recommendations` | GET | Get AI recommendations |
| `/api/food/search` | POST | Search foods |
| `/api/food/categories` | GET | List categories |
| `/api/food/stats` | GET | Database stats |
| `/api/food/health-check` | GET | Service status |

## 24 Supported Foods

```
Breads: Roti, Naan, Paratha
Curries: Daal, Dal Makhani, Rajma, Chole Masala
Proteins: Paneer, Paneer Tikka, Tandoori Chicken, Butter Chicken
Rice: Biryani
Vegetables: Aloo Gobi
Snacks: Samosa, Momo
Beverages: Lassi
Sides: Raita, Achaar
Desserts: Gulab Jamun, Kheer, Barfi, Shahi Tukda
```

## Common Tasks

### Get Nutrition for a Food
```bash
curl http://localhost:5000/api/food/nutrition/butter_chicken
```

Response:
```json
{
  "status": "success",
  "food": "butter_chicken",
  "name": "Butter Chicken (Murgh Makhani)",
  "nutrition": {
    "calories": 180,
    "protein": 25,
    "carbs": 8,
    "fat": 8,
    "fiber": 0
  },
  "category": "protein"
}
```

### Analyze What You Ate
```bash
curl -X POST http://localhost:5000/api/food/analyze-meal \
  -H "Content-Type: application/json" \
  -d '{
    "foods": ["paneer", "roti", "daal"]
  }'
```

Response:
```json
{
  "status": "success",
  "meal": {
    "totalNutrition": {
      "calories": 610,
      "protein": 47,
      "carbs": 51,
      "fat": 20,
      "fiber": 7
    }
  }
}
```

### Get AI Recommendations
```bash
curl "http://localhost:5000/api/food/recommendations?goal=muscle_gain&activityLevel=active"
```

Gets:
- Daily calorie target
- Top food recommendations
- Foods to prioritize

## Example: Complete Workflow

1. **Take a photo of your meal:**
   ```bash
   curl -X POST http://localhost:5000/api/food/detect \
     -F "image=@lunch.jpg"
   ```

2. **Get detected food nutrition:**
   ```json
   {
     "detected_food": "paneer_tikka",
     "confidence": 0.92,
     "nutrition": {
       "calories": 180,
       "protein": 20,
       "carbs": 5,
       "fat": 9
     }
   }
   ```

3. **Log it with other foods:**
   ```bash
   curl -X POST http://localhost:5000/api/food/analyze-meal \
     -H "Content-Type: application/json" \
     -d '{"foods":["paneer_tikka","naan","daal"]}'
   ```

4. **See daily total:**
   ```json
   {
     "meal": {
       "totalNutrition": {
         "calories": 745,
         "protein": 53,
         ...
       }
     }
   }
   ```

5. **Compare with your goal:**
   - Goal: 2500 calories (muscle gain + active)
   - Consumed: 745 calories
   - Remaining: 1755 calories

## Requirements

- ✅ Python 3.8+
- ✅ Node.js 14+
- ✅ 500MB disk space (for model)
- ✅ TensorFlow (auto-installed)
- ✅ Internet (for first model download)

## Troubleshooting

### TensorFlow not installing?
```bash
pip install tensorflow --upgrade
# or
pip install tensorflow --no-cache-dir
```

### Port 5000 already in use?
```bash
# Use different port
PORT=5001 npm start
```

### Image detection slow?
First detection takes ~3-5 seconds (model loading)
Subsequent detections: ~0.5 seconds

### No food detected?
- Try better lighting
- Use clear, centered food photo
- Check confidence - lower it to 0.2

## Next Steps

1. ✅ Setup complete
2. 📖 Read: `backend/FOOD_DETECTION_GUIDE.md` for full API docs
3. 🎨 Integrate: See `FOOD_DETECTION_FRONTEND_GUIDE.md` for React/Next.js code
4. 🚀 Deploy: Use Docker/Cloud to run in production

## Getting Help

**Quick Issues:**
- Setup problems → Run setup script again
- API errors → Check health: `/api/food/health-check`
- Model errors → Reinstall TensorFlow

**Documentation:**
- Full API guide: `backend/FOOD_DETECTION_GUIDE.md`
- Frontend code: `FOOD_DETECTION_FRONTEND_GUIDE.md`
- This overview: `FOOD_DETECTION_README.md`

## Performance Tips

- ✅ Cache food database locally (don't fetch every time)
- ✅ Debounce search (don't query on every keystroke)
- ✅ Compress images before upload
- ✅ Reuse results (don't re-detect same image)
- ✅ Use CDN for images in production

## Example Integration

### React Hook
```typescript
const [food, setFood] = useState(null);

const detectFood = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await fetch('/api/food/detect', {
    method: 'POST',
    body: formData
  });
  const result = await response.json();
  setFood(result);
};
```

### Display Result
```jsx
{food && (
  <div>
    <h2>🍽️ {food.nutrition.name}</h2>
    <p>Calories: {food.nutrition.calories}</p>
    <p>Confidence: {food.probability}</p>
  </div>
)}
```

---

**Ready?** Run setup and start detecting food! 🍽️✨

For more details, see the full documentation files.

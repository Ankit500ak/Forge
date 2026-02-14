#!/usr/bin/env python3
"""
North Indian Food Detection Model
Uses transfer learning to detect and classify North Indian foods
Includes nutrition information for detected foods
"""

import numpy as np
import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')

try:
    import tensorflow as tf
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.preprocessing import image
    from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
    from tensorflow.keras.models import Sequential, load_model
    print("✓ TensorFlow loaded successfully", file=sys.stderr)
except ImportError:
    print("⚠️ TensorFlow not available, installing...", file=sys.stderr)
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "tensorflow", "-q"])
    import tensorflow as tf
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.preprocessing import image
    from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
    from tensorflow.keras.models import Sequential, load_model


class NorthIndianFoodDetector:
    """Detects and classifies North Indian foods from images"""
    
    # North Indian foods database with nutrition info (per serving ~100g)
    NORTH_INDIAN_FOODS = {
        'roti': {
            'name': 'Roti (Whole Wheat Bread)',
            'calories': 265,
            'protein': 8,
            'carbs': 48,
            'fat': 3,
            'fiber': 7,
            'region': 'North India',
            'category': 'grain'
        },
        'naan': {
            'name': 'Naan (Tandoor Bread)',
            'calories': 300,
            'protein': 9,
            'carbs': 50,
            'fat': 7,
            'fiber': 2,
            'region': 'North India',
            'category': 'bread'
        },
        'paratha': {
            'name': 'Paratha (Layered Flatbread)',
            'calories': 350,
            'protein': 8,
            'carbs': 45,
            'fat': 15,
            'fiber': 5,
            'region': 'North India',
            'category': 'bread'
        },
        'daal': {
            'name': 'Daal (Lentil Curry)',
            'calories': 120,
            'protein': 9,
            'carbs': 20,
            'fat': 2,
            'fiber': 8,
            'region': 'North India',
            'category': 'legume'
        },
        'butter_chicken': {
            'name': 'Butter Chicken (Murgh Makhani)',
            'calories': 180,
            'protein': 25,
            'carbs': 8,
            'fat': 8,
            'fiber': 0,
            'region': 'North India',
            'category': 'protein'
        },
        'tandoori_chicken': {
            'name': 'Tandoori Chicken',
            'calories': 165,
            'protein': 31,
            'carbs': 0,
            'fat': 3.5,
            'fiber': 0,
            'region': 'North India',
            'category': 'protein'
        },
        'samosa': {
            'name': 'Samosa',
            'calories': 260,
            'protein': 6,
            'carbs': 32,
            'fat': 12,
            'fiber': 2,
            'region': 'North India',
            'category': 'snack'
        },
        'biryani': {
            'name': 'Biryani (Rice Dish)',
            'calories': 280,
            'protein': 12,
            'carbs': 45,
            'fat': 6,
            'fiber': 3,
            'region': 'North India',
            'category': 'rice'
        },
        'paneer': {
            'name': 'Paneer (Cottage Cheese)',
            'calories': 265,
            'protein': 26,
            'carbs': 3,
            'fat': 17,
            'fiber': 0,
            'region': 'North India',
            'category': 'dairy/protein'
        },
        'paneer_tikka': {
            'name': 'Paneer Tikka',
            'calories': 180,
            'protein': 20,
            'carbs': 5,
            'fat': 9,
            'fiber': 1,
            'region': 'North India',
            'category': 'protein'
        },
        'chhole_bhature': {
            'name': 'Chhole Bhature',
            'calories': 350,
            'protein': 14,
            'carbs': 65,
            'fat': 3,
            'fiber': 8,
            'region': 'North India',
            'category': 'pulse'
        },
        'rajma': {
            'name': 'Rajma (Kidney Bean Curry)',
            'calories': 130,
            'protein': 9,
            'carbs': 23,
            'fat': 1,
            'fiber': 6,
            'region': 'North India',
            'category': 'legume'
        },
        'aloo_gobi': {
            'name': 'Aloo Gobi (Potato and Cauliflower)',
            'calories': 85,
            'protein': 3,
            'carbs': 15,
            'fat': 2,
            'fiber': 3,
            'region': 'North India',
            'category': 'vegetable'
        },
        'lassi': {
            'name': 'Lassi (Yogurt Drink)',
            'calories': 60,
            'protein': 3,
            'carbs': 10,
            'fat': 0.5,
            'fiber': 0,
            'region': 'North India',
            'category': 'beverage'
        },
        'momo': {
            'name': 'Momo (Dumpling)',
            'calories': 80,
            'protein': 3,
            'carbs': 14,
            'fat': 1.5,
            'fiber': 0.5,
            'region': 'North India',
            'category': 'snack'
        },
        'dal_makhani': {
            'name': 'Dal Makhani (Creamy Lentil Curry)',
            'calories': 180,
            'protein': 8,
            'carbs': 18,
            'fat': 9,
            'fiber': 5,
            'region': 'North India',
            'category': 'curry'
        },
        'chole_masala': {
            'name': 'Chole Masala (Spiced Chickpeas)',
            'calories': 150,
            'protein': 8,
            'carbs': 26,
            'fat': 2,
            'fiber': 7,
            'region': 'North India',
            'category': 'curry'
        },
        'shahi_tukda': {
            'name': 'Shahi Tukda (Royal Dessert)',
            'calories': 320,
            'protein': 5,
            'carbs': 45,
            'fat': 14,
            'fiber': 1,
            'region': 'North India',
            'category': 'dessert'
        },
        'gulab_jamun': {
            'name': 'Gulab Jamun (Sweet Dumpling)',
            'calories': 280,
            'protein': 2,
            'carbs': 40,
            'fat': 12,
            'fiber': 0,
            'region': 'North India',
            'category': 'dessert'
        },
        'kheer': {
            'name': 'Kheer (Rice Pudding)',
            'calories': 200,
            'protein': 4,
            'carbs': 32,
            'fat': 6,
            'fiber': 0,
            'region': 'North India',
            'category': 'dessert'
        },
        'barfi': {
            'name': 'Barfi (Indian Fudge)',
            'calories': 320,
            'protein': 8,
            'carbs': 35,
            'fat': 16,
            'fiber': 1,
            'region': 'North India',
            'category': 'dessert'
        },
        'raita': {
            'name': 'Raita (Yogurt Side Dish)',
            'calories': 45,
            'protein': 3,
            'carbs': 6,
            'fat': 0.5,
            'fiber': 1,
            'region': 'North India',
            'category': 'side'
        },
        'achaar': {
            'name': 'Achaar (Pickle)',
            'calories': 30,
            'protein': 0,
            'carbs': 7,
            'fat': 0,
            'fiber': 1,
            'region': 'North India',
            'category': 'condiment'
        }
    }
    
    def __init__(self, model_path: str = None):
        """Initialize the food detector with pre-trained model or create new one"""
        self.model = None
        self.model_path = model_path
        self.food_classes = list(self.NORTH_INDIAN_FOODS.keys())
        self.num_classes = len(self.food_classes)
        
        if model_path and Path(model_path).exists():
            self.load_model(model_path)
        else:
            self.create_model()
    
    def create_model(self):
        """Create a transfer learning model using MobileNetV2"""
        print("🏗️ Creating transfer learning model...", file=sys.stderr)
        
        try:
            # Load pre-trained MobileNetV2 (trained on ImageNet)
            base_model = MobileNetV2(
                input_shape=(224, 224, 3),
                include_top=False,
                weights='imagenet'
            )
            
            # Freeze base model layers
            base_model.trainable = False
            
            # Build model
            self.model = Sequential([
                base_model,
                GlobalAveragePooling2D(),
                Dense(256, activation='relu'),
                Dropout(0.3),
                Dense(128, activation='relu'),
                Dropout(0.2),
                Dense(self.num_classes, activation='softmax')
            ])
            
            self.model.compile(
                optimizer='adam',
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            print(f"✓ Model created with {self.num_classes} food classes", file=sys.stderr)
        except Exception as e:
            print(f"✗ Error creating model: {e}", file=sys.stderr)
            raise
    
    def load_model(self, model_path: str):
        """Load a pre-trained model"""
        try:
            self.model = load_model(model_path)
            print(f"✓ Model loaded from {model_path}", file=sys.stderr)
        except Exception as e:
            print(f"✗ Error loading model: {e}", file=sys.stderr)
            raise
    
    def save_model(self, model_path: str):
        """Save the trained model"""
        if self.model:
            self.model.save(model_path)
            print(f"✓ Model saved to {model_path}", file=sys.stderr)
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """Preprocess image for model input"""
        try:
            # Load image
            img = image.load_img(image_path, target_size=(224, 224))
            
            # Convert to array
            img_array = image.img_to_array(img)
            
            # Normalize (MobileNetV2 expects values in range [-1, 1])
            img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
            
            # Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            
            return img_array
        except Exception as e:
            print(f"✗ Error preprocessing image: {e}", file=sys.stderr)
            raise
    
    def detect_food(self, image_path: str, confidence_threshold: float = 0.3) -> Dict:
        """
        Detect food in image and return predictions
        
        Args:
            image_path: Path to the food image
            confidence_threshold: Minimum confidence for predictions
            
        Returns:
            Dictionary with detected food, confidence, and nutrition info
        """
        try:
            if not self.model:
                return {
                    'error': 'Model not loaded',
                    'status': 'failed'
                }
            
            # Preprocess image
            img_array = self.preprocess_image(image_path)
            
            # Make prediction
            predictions = self.model.predict(img_array, verbose=0)
            confidence_scores = predictions[0]
            
            # Get predictions above threshold
            detected_foods = []
            for idx, confidence in enumerate(confidence_scores):
                if confidence >= confidence_threshold:
                    food_name = self.food_classes[idx]
                    detected_foods.append({
                        'food': food_name,
                        'confidence': float(confidence),
                        'probability': f"{float(confidence) * 100:.2f}%"
                    })
            
            # Sort by confidence
            detected_foods.sort(key=lambda x: x['confidence'], reverse=True)
            
            if not detected_foods:
                return {
                    'status': 'no_food_detected',
                    'message': 'No food detected with sufficient confidence',
                    'top_prediction': self._get_top_prediction(confidence_scores)
                }
            
            # Get top prediction with full details
            top_food = detected_foods[0]['food']
            top_confidence = detected_foods[0]['confidence']
            nutrition_info = self.NORTH_INDIAN_FOODS[top_food]
            
            return {
                'status': 'success',
                'detected_food': top_food,
                'confidence': float(top_confidence),
                'probability': f"{float(top_confidence) * 100:.2f}%",
                'nutrition': {
                    'name': nutrition_info.get('name'),
                    'calories': nutrition_info.get('calories'),
                    'protein': nutrition_info.get('protein'),
                    'carbs': nutrition_info.get('carbs'),
                    'fat': nutrition_info.get('fat'),
                    'fiber': nutrition_info.get('fiber'),
                    'category': nutrition_info.get('category'),
                    'region': nutrition_info.get('region')
                },
                'all_predictions': detected_foods[:5]  # Top 5 predictions
            }
        
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def _get_top_prediction(self, predictions: np.ndarray) -> Dict:
        """Get top prediction details"""
        top_idx = np.argmax(predictions)
        top_food = self.food_classes[top_idx]
        top_confidence = float(predictions[top_idx])
        
        return {
            'food': top_food,
            'confidence': top_confidence,
            'probability': f"{top_confidence * 100:.2f}%"
        }
    
    def get_food_nutrition(self, food_name: str) -> Dict:
        """Get nutrition information for a food"""
        food_name_lower = food_name.lower().replace(' ', '_')
        
        if food_name_lower in self.NORTH_INDIAN_FOODS:
            food_info = self.NORTH_INDIAN_FOODS[food_name_lower]
            return {
                'status': 'success',
                'food': food_name_lower,
                'name': food_info.get('name'),
                'nutrition': {
                    'calories': food_info.get('calories'),
                    'protein': food_info.get('protein'),
                    'carbs': food_info.get('carbs'),
                    'fat': food_info.get('fat'),
                    'fiber': food_info.get('fiber')
                },
                'category': food_info.get('category'),
                'region': food_info.get('region')
            }
        else:
            return {
                'status': 'not_found',
                'error': f'Food "{food_name}" not found in database',
                'available_foods': list(self.NORTH_INDIAN_FOODS.keys())
            }
    
    def get_all_foods(self) -> Dict:
        """Get all supported foods and their nutrition info"""
        return {
            'status': 'success',
            'total_foods': len(self.NORTH_INDIAN_FOODS),
            'foods': self.NORTH_INDIAN_FOODS
        }


def main():
    """CLI interface for the food detector"""
    if len(sys.argv) < 2:
        print("Usage: python northIndianFoodDetector.py <image_path> [confidence_threshold]")
        print("       python northIndianFoodDetector.py --list-foods")
        sys.exit(1)
    
    command = sys.argv[1]
    
    # Initialize detector
    backend_dir = Path(__file__).parent.parent
    ml_models_dir = backend_dir / 'ml_models'
    model_path = ml_models_dir / 'north_indian_food_model.h5'
    
    detector = NorthIndianFoodDetector(str(model_path) if model_path.exists() else None)
    
    if command == '--list-foods':
        result = detector.get_all_foods()
        print(json.dumps(result, indent=2))
    else:
        image_path = command
        confidence_threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 0.3
        
        result = detector.detect_food(image_path, confidence_threshold)
        print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()

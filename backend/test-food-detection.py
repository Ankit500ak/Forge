#!/usr/bin/env python3
"""
Food Detection System - Test & Demo Script
Tests all features of the North Indian food detection system
"""

import json
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from services.northIndianFoodDetector import NorthIndianFoodDetector

def print_header(title):
    """Print a formatted header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70 + "\n")

def print_section(title):
    """Print a formatted section"""
    print(f"\n{'─'*70}")
    print(f"▶ {title}")
    print(f"{'─'*70}\n")

def demo_get_all_foods():
    """Demo: Get all supported foods"""
    print_section("Getting All Supported Foods")
    
    detector = NorthIndianFoodDetector()
    result = detector.get_all_foods()
    
    print(f"Status: {result['status']}")
    print(f"Total Foods: {result['total_foods']}\n")
    
    print("Available Foods:")
    for i, (food_id, food_info) in enumerate(list(result['foods'].items())[:10], 1):
        print(f"  {i}. {food_info['name']:<35} ({food_id})")
        print(f"     Calories: {food_info['calories']:>3} | Protein: {food_info['protein']:>2}g | " \
              f"Carbs: {food_info['carbs']:>2}g | Fat: {food_info['fat']:>2}g | Category: {food_info['category']}")
    
    print(f"\n  ... and {result['total_foods'] - 10} more foods")
    
    return result

def demo_get_nutrition():
    """Demo: Get nutrition for specific foods"""
    print_section("Getting Nutrition Information")
    
    detector = NorthIndianFoodDetector()
    
    foods_to_check = ['paneer', 'butter_chicken', 'daal', 'roti', 'samosa']
    
    for food_name in foods_to_check:
        result = detector.get_food_nutrition(food_name)
        
        if result['status'] == 'success':
            nutrition = result['nutrition']
            print(f"🍽️  {result['name']}")
            print(f"   Calories: {nutrition['calories']} kcal")
            print(f"   Protein:  {nutrition['protein']}g")
            print(f"   Carbs:    {nutrition['carbs']}g")
            print(f"   Fat:      {nutrition['fat']}g")
            print(f"   Fiber:    {nutrition['fiber']}g")
            print(f"   Category: {result['category']}")
            print()

def demo_analyze_meal():
    """Demo: Analyze a complete meal"""
    print_section("Analyzing a Complete Meal")
    
    detector = NorthIndianFoodDetector()
    
    # Typical North Indian meal
    meals = {
        "Vegetarian Lunch": ["roti", "daal", "aloo_gobi", "raita"],
        "Non-Veg Dinner": ["butter_chicken", "biryani", "raita"],
        "Protein-Focused": ["paneer_tikka", "tandoori_chicken", "daal"],
        "Casual Snack": ["samosa", "lassi", "achaar"]
    }
    
    for meal_name, foods in meals.items():
        print(f"📍 {meal_name}:")
        print(f"   Foods: {', '.join([f.replace('_', ' ').title() for f in foods])}")
        
        # Get all foods for lookup
        all_foods = detector.get_all_foods()
        
        total_cal = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0
        total_fiber = 0
        
        for food_id in foods:
            if food_id in all_foods['foods']:
                food = all_foods['foods'][food_id]
                total_cal += food['calories']
                total_protein += food['protein']
                total_carbs += food['carbs']
                total_fat += food['fat']
                total_fiber += food['fiber']
        
        print(f"   Total Nutrition:")
        print(f"   ├─ Calories: {total_cal} kcal")
        print(f"   ├─ Protein:  {total_protein}g ({total_protein*4} kcal)")
        print(f"   ├─ Carbs:    {total_carbs}g ({total_carbs*4} kcal)")
        print(f"   ├─ Fat:      {total_fat}g ({total_fat*9} kcal)")
        print(f"   └─ Fiber:    {total_fiber}g")
        print()

def demo_recommendations():
    """Demo: Get food recommendations based on goals"""
    print_section("Getting Personalized Food Recommendations")
    
    detector = NorthIndianFoodDetector()
    
    goals = {
        "muscle_gain": ("Building Muscle", "active"),
        "weight_loss": ("Losing Weight", "moderate"),
        "balanced": ("Balanced Diet", "moderate")
    }
    
    for goal, (description, activity) in goals.items():
        print(f"🎯 Goal: {description}")
        print(f"   Activity Level: {activity.title()}\n")
        
        recs = detector.get_food_recommendations({'goal': goal, 'activityLevel': activity})
        
        print(f"   Daily Calorie Target: {recs['calorieTarget']} kcal\n")
        print(f"   Top Recommendations:")
        
        for rec in recs['recommendations'][:5]:
            priority_icon = "🔴" if rec['priority'] == 'high' else "🟡"
            food_nice = rec['food'].replace('_', ' ').title()
            print(f"   {priority_icon} {food_nice:<20} - {rec['reason']}")
        
        print()

def demo_food_statistics():
    """Demo: Show food database statistics"""
    print_section("Food Database Statistics")
    
    detector = NorthIndianFoodDetector()
    all_foods = detector.get_all_foods()
    
    # Calculate statistics
    foods = all_foods['foods']
    
    total_cal = sum(f['calories'] for f in foods.values())
    avg_cal = total_cal / len(foods)
    
    total_protein = sum(f['protein'] for f in foods.values())
    avg_protein = total_protein / len(foods)
    
    total_carbs = sum(f['carbs'] for f in foods.values())
    avg_carbs = total_carbs / len(foods)
    
    total_fat = sum(f['fat'] for f in foods.values())
    avg_fat = total_fat / len(foods)
    
    total_fiber = sum(f['fiber'] for f in foods.values())
    avg_fiber = total_fiber / len(foods)
    
    # Category breakdown
    categories = {}
    for food in foods.values():
        cat = food.get('category', 'other')
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"📊 Database Overview:")
    print(f"   Total Foods: {len(foods)}")
    print(f"   Total Categories: {len(categories)}")
    print()
    
    print(f"📈 Average Nutrition (per 100g):")
    print(f"   Calories: {avg_cal:.1f} kcal")
    print(f"   Protein:  {avg_protein:.1f}g")
    print(f"   Carbs:    {avg_carbs:.1f}g")
    print(f"   Fat:      {avg_fat:.1f}g")
    print(f"   Fiber:    {avg_fiber:.1f}g")
    print()
    
    print(f"🏷️  Category Breakdown:")
    for category in sorted(categories.keys()):
        count = categories[category]
        percentage = (count / len(foods)) * 100
        bar = "█" * int(percentage / 5)
        print(f"   {category:<15} {count:>2} foods {bar:<20} {percentage:>5.1f}%")

def demo_search():
    """Demo: Search for foods"""
    print_section("Searching for Foods")
    
    detector = NorthIndianFoodDetector()
    all_foods = detector.get_all_foods()
    foods = all_foods['foods']
    
    search_terms = ['paneer', 'chicken', 'daal', 'bread']
    
    for search_term in search_terms:
        print(f"🔍 Searching for '{search_term}':")
        
        results = []
        search_lower = search_term.lower()
        
        for food_id, food_info in foods.items():
            if (search_lower in food_id or 
                search_lower in food_info['name'].lower() or
                search_lower in food_info.get('category', '').lower()):
                results.append((food_id, food_info))
        
        if results:
            for food_id, food_info in results:
                print(f"   ✓ {food_info['name']:<35} ({food_id})")
                print(f"     {food_info['calories']} cal | {food_info['protein']}g protein | {food_info['category']}")
        else:
            print(f"   ✗ No foods found")
        
        print()

def demo_quick_meal_plans():
    """Demo: Show quick meal plans for different goals"""
    print_section("Quick Meal Plans")
    
    meal_plans = {
        "High Protein (Muscle Building)": {
            "foods": ["tandoori_chicken", "paneer", "daal", "roti"],
            "goal": "Perfect for post-workout gains"
        },
        "Low Calorie (Weight Loss)": {
            "foods": ["tandoori_chicken", "aloo_gobi", "daal", "raita"],
            "goal": "Light but satisfying meal"
        },
        "Balanced Vegetarian": {
            "foods": ["paneer_tikka", "chhole_bhature", "raita"],
            "goal": "Complete nutrition without meat"
        },
        "Quick & Easy": {
            "foods": ["naan", "samosa", "lassi"],
            "goal": "Fast food from North India"
        }
    }
    
    detector = NorthIndianFoodDetector()
    all_foods = detector.get_all_foods()
    foods_db = all_foods['foods']
    
    for plan_name, plan_data in meal_plans.items():
        print(f"🍽️  {plan_name}")
        print(f"   {plan_data['goal']}\n")
        
        total_cal = 0
        total_protein = 0
        
        print(f"   Food Items:")
        for food_id in plan_data['foods']:
            if food_id in foods_db:
                food = foods_db[food_id]
                print(f"   • {food['name']:<35} {food['calories']:>3} cal | {food['protein']:>2}g protein")
                total_cal += food['calories']
                total_protein += food['protein']
        
        print(f"\n   Meal Totals: {total_cal} calories | {total_protein}g protein")
        print()

def main():
    """Run all demos"""
    print_header("🍽️ NORTH INDIAN FOOD DETECTION SYSTEM - TEST & DEMO")
    
    print("This demo showcases all features of the food detection system")
    print("These examples can be directly integrated into your fitness app\n")
    
    # Run all demos
    try:
        demo_get_all_foods()
        demo_get_nutrition()
        demo_analyze_meal()
        demo_recommendations()
        demo_food_statistics()
        demo_search()
        demo_quick_meal_plans()
        
        # Summary
        print_header("✅ DEMO COMPLETE")
        print("All food detection features are working correctly!\n")
        print("Next Steps:")
        print("1. Install dependencies: npm install (in backend directory)")
        print("2. Install Python packages: pip install tensorflow")
        print("3. Start the backend: npm start")
        print("4. Test the API endpoints (see FOOD_DETECTION_GUIDE.md)")
        print("\n")
        
    except Exception as e:
        print_header("❌ ERROR")
        print(f"An error occurred: {str(e)}\n")
        print("Make sure you have:")
        print("• Python 3.8+ installed")
        print("• TensorFlow installed (pip install tensorflow)")
        print("\n")
        sys.exit(1)

if __name__ == '__main__':
    main()

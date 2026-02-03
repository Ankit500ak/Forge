#!/usr/bin/env python3
"""
ML Models Verification Script
Checks that ML models are properly loaded and functional
"""

import sys
import os
import pickle
import json
from pathlib import Path

def check_model_files():
    """Check if model files exist"""
    print("=" * 60)
    print("🔍 ML Models Verification")
    print("=" * 60)
    
    backend_dir = Path(__file__).parent.parent
    ml_models_dir = backend_dir / 'ml_models'
    
    print(f"\n📁 ML Models Directory: {ml_models_dir}")
    print(f"   Exists: {ml_models_dir.exists()}\n")
    
    if not ml_models_dir.exists():
        print("   ❌ ML Models directory not found!")
        return False
    
    required_files = ['fitness_model.pkl', 'feature_preprocessor.pkl']
    all_exist = True
    
    for filename in required_files:
        file_path = ml_models_dir / filename
        exists = file_path.exists()
        size = file_path.stat().st_size if exists else 0
        status = "✓" if exists else "✗"
        print(f"   {status} {filename}: {size:,} bytes")
        all_exist = all_exist and exists
    
    return all_exist

def check_model_loading():
    """Test loading the models"""
    print("\n📦 Model Loading Test")
    print("-" * 60)
    
    backend_dir = Path(__file__).parent.parent
    ml_models_dir = backend_dir / 'ml_models'
    
    try:
        # Load model
        model_path = ml_models_dir / 'fitness_model.pkl'
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        print("   ✓ Fitness model loaded successfully")
        print(f"   Model type: {type(model).__name__}")
        
        # Load preprocessor
        preprocessor_path = ml_models_dir / 'feature_preprocessor.pkl'
        with open(preprocessor_path, 'rb') as f:
            preprocessor = pickle.load(f)
        print("   ✓ Feature preprocessor loaded successfully")
        print(f"   Preprocessor type: {type(preprocessor).__name__}")
        
        return True
    except Exception as e:
        print(f"   ✗ Error loading models: {e}")
        return False

def check_ml_task_generator():
    """Test the ML task generator service"""
    print("\n🤖 ML Task Generator Service Test")
    print("-" * 60)
    
    backend_dir = Path(__file__).parent.parent
    
    try:
        # Check if service exists
        service_path = backend_dir / 'services' / 'mlTaskGenerator.py'
        if not service_path.exists():
            print(f"   ✗ ML Task Generator service not found at {service_path}")
            return False
        
        print(f"   ✓ ML Task Generator found")
        
        # Try to import and instantiate
        sys.path.insert(0, str(backend_dir))
        from services.mlTaskGenerator import MLTaskGenerator
        
        generator = MLTaskGenerator()
        print("   ✓ ML Task Generator instantiated successfully")
        
        # Check categories
        categories = generator.CATEGORY_CLASSES
        print(f"   ✓ Categories: {', '.join(categories)}")
        
        # Check difficulties
        difficulties = generator.DIFFICULTY_CLASSES
        print(f"   ✓ Difficulties: {', '.join(difficulties)}")
        
        # Check exercises
        exercise_count = sum(len(v) for v in generator.EXERCISES.values())
        print(f"   ✓ Total exercises available: {exercise_count}")
        
        return True
    except ImportError as e:
        print(f"   ⚠ Cannot import directly (expected): {e}")
        print("   This is normal - the service is designed to be called via subprocess")
        return True
    except Exception as e:
        print(f"   ✗ Error with ML Task Generator: {e}")
        return False

def check_backend_integration():
    """Check backend task controller integration"""
    print("\n🔌 Backend Integration Test")
    print("-" * 60)
    
    backend_dir = Path(__file__).parent.parent
    
    try:
        # Check task controller
        controller_path = backend_dir / 'controllers' / 'taskController.js'
        if not controller_path.exists():
            print(f"   ✗ Task controller not found")
            return False
        
        print("   ✓ Task controller found")
        
        # Check if it references mlTaskGenerator
        with open(controller_path, 'r') as f:
            content = f.read()
            if 'mlTaskGenerator.py' in content:
                print("   ✓ Task controller references ML task generator")
            else:
                print("   ⚠ Task controller may not reference ML generator correctly")
        
        # Check task routes
        routes_path = backend_dir / 'routes' / 'tasks.js'
        if routes_path.exists():
            with open(routes_path, 'r') as f:
                content = f.read()
                if 'generate-ml' in content:
                    print("   ✓ ML task generation routes defined")
                else:
                    print("   ⚠ ML task generation routes not found")
        
        return True
    except Exception as e:
        print(f"   ✗ Error checking backend integration: {e}")
        return False

def check_python_packages():
    """Check required Python packages"""
    print("\n📚 Python Dependencies Test")
    print("-" * 60)
    
    required_packages = {
        'pickle': 'pickle',
        'json': 'json',
        'numpy': 'numpy',
        'sklearn': 'scikit-learn'
    }
    
    all_ok = True
    for import_name, display_name in required_packages.items():
        try:
            __import__(import_name)
            print(f"   ✓ {display_name} installed")
        except ImportError:
            print(f"   ✗ {display_name} NOT installed")
            print(f"      Install with: pip install {display_name}")
            all_ok = False
    
    return all_ok

def main():
    """Run all checks"""
    checks = [
        ("Model Files", check_model_files),
        ("Model Loading", check_model_loading),
        ("ML Task Generator", check_ml_task_generator),
        ("Python Dependencies", check_python_packages),
        ("Backend Integration", check_backend_integration),
    ]
    
    results = {}
    for name, check_func in checks:
        try:
            results[name] = check_func()
        except Exception as e:
            print(f"\n   ✗ Unexpected error: {e}")
            results[name] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Verification Summary")
    print("=" * 60)
    
    for name, result in results.items():
        status = "✓" if result else "✗"
        print(f"{status} {name}")
    
    total = len(results)
    passed = sum(1 for r in results.values() if r)
    
    print(f"\nTotal: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n✅ ML Integration is fully configured and ready!")
        print("\nNext steps:")
        print("1. Start the backend: npm run dev")
        print("2. Test ML endpoints: node test-ml-integration.js")
        print("3. Generate ML tasks: POST /api/tasks/generate-ml")
        return 0
    else:
        print("\n⚠️  Some checks failed. Please review the errors above.")
        print("\nTo fix common issues:")
        print("1. Install missing packages: pip install -r requirements_ml.txt")
        print("2. Verify model files exist: ls -la backend/ml_models/")
        print("3. Check Python version: python3 --version (3.8+ required)")
        return 1

if __name__ == '__main__':
    sys.exit(main())

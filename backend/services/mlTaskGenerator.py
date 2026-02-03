#!/usr/bin/env python3
"""
ML Task Generator Service - Generates personalized fitness tasks using neural network
Uses the trained model to predict tasks based on user profile
"""

import pickle
import numpy as np
import json
import sys
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

class MLTaskGenerator:
    """Generates personalized fitness tasks using neural network predictions"""
    
    def __init__(self):
        """Initialize with loaded model and preprocessor"""
        try:
            # Build paths relative to this file
            backend_dir = Path(__file__).parent.parent
            ml_models_dir = backend_dir.parent / 'ml_models'
            
            # Load model
            model_path = ml_models_dir / 'fitness_model.pkl'
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            
            # Load preprocessor
            preprocessor_path = ml_models_dir / 'feature_preprocessor.pkl'
            with open(preprocessor_path, 'rb') as f:
                self.preprocessor = pickle.load(f)
            
            print("✓ Model and preprocessor loaded successfully", file=sys.stderr)
        except Exception as e:
            print(f"✗ Error loading model: {e}", file=sys.stderr)
            raise
        
        # Constants
        self.STAT_NAMES = ['strength', 'constitution', 'dexterity', 'wisdom', 'charisma']
        self.CATEGORY_CLASSES = ['strength', 'cardio', 'flexibility', 'health', 'hiit']
        self.DIFFICULTY_CLASSES = ['easy', 'medium', 'hard']
        
        # Exercise database - comprehensive list
        self.EXERCISES = self._load_exercises()
    
    def _load_exercises(self):
        """Load complete exercise database organized by category and difficulty"""
        return {
            'strength': {
                'easy': [
                    {'name': 'Plank Hold', 'description': 'Static plank position for core stability', 'reps': '30-60 seconds'},
                    {'name': 'Bodyweight Squats', 'description': 'Bodyweight squats for leg strength', 'reps': '10-15 reps'},
                    {'name': 'Dumbbell Rows', 'description': 'Light dumbbell single-arm rows (5-10 lbs)', 'reps': '10-12 reps'},
                    {'name': 'Kettlebell Swings', 'description': 'Light kettlebell swings for hip drive (8-15 lbs)', 'reps': '15-20 reps'},
                    {'name': 'Push-ups', 'description': 'Standard push-ups with full range of motion', 'reps': '8-15 reps'},
                    {'name': 'Glute Bridges', 'description': 'Bodyweight glute bridge for posterior chain', 'reps': '12-15 reps'},
                    {'name': 'Wall Sits', 'description': 'Wall sit for isometric leg strength', 'reps': '30-45 seconds'},
                    {'name': 'Dumbbell Curls', 'description': 'Light dumbbell bicep curls (8-12 lbs)', 'reps': '10-12 reps'},
                ],
                'medium': [
                    {'name': 'Barbell Squats', 'description': 'Barbell back squats (155-185 lbs)', 'reps': '6-8 reps'},
                    {'name': 'Bench Press', 'description': 'Barbell bench press (135-185 lbs)', 'reps': '5-8 reps'},
                    {'name': 'Bent Over Rows', 'description': 'Barbell bent over rows (155-185 lbs)', 'reps': '5-8 reps'},
                    {'name': 'Dumbbell Chest Press', 'description': 'Dumbbell chest press (40-60 lbs each)', 'reps': '8-10 reps'},
                    {'name': 'Pull-ups', 'description': 'Moderate weight pull-ups or assisted', 'reps': '6-12 reps'},
                    {'name': 'Leg Press', 'description': 'Machine leg press (400-600 lbs)', 'reps': '8-12 reps'},
                    {'name': 'Dumbbell Flyes', 'description': 'Chest flyes with dumbbells (30-50 lbs each)', 'reps': '10-12 reps'},
                    {'name': 'Incline Push-ups', 'description': 'Elevated push-ups for chest and shoulders', 'reps': '12-15 reps'},
                ],
                'hard': [
                    {'name': 'Heavy Deadlifts', 'description': 'Near-maximal deadlifts (80-90% 1RM, 405+ lbs)', 'reps': '1-3 reps'},
                    {'name': 'Weighted Dips', 'description': 'Dips with 45-90 lb added weight', 'reps': '5-8 reps'},
                    {'name': 'Front Barbell Squats', 'description': 'Heavy front barbell squats (305-365 lbs)', 'reps': '3-5 reps'},
                    {'name': 'Muscle-ups', 'description': 'Advanced gymnastics movement combining pull-up and dip', 'reps': '3-5 reps'},
                    {'name': 'Heavy Cleans', 'description': 'Power clean at 85-95% max weight (275-315 lbs)', 'reps': '2-4 reps'},
                    {'name': 'Close-Grip Bench', 'description': 'Heavy close-grip bench press (225-275 lbs)', 'reps': '3-5 reps'},
                    {'name': 'Weighted Pull-ups', 'description': 'Pull-ups with 45-90 lb added weight', 'reps': '3-6 reps'},
                    {'name': 'Back Squat Max Effort', 'description': 'Back squat at 85-95% max (405-495 lbs)', 'reps': '2-4 reps'},
                ],
            },
            'cardio': {
                'easy': [
                    {'name': 'Brisk Walking', 'description': 'Moderate pace outdoor walking at 3-4 mph', 'duration': '25-30 min'},
                    {'name': 'Easy Stationary Cycling', 'description': 'Stationary bike at easy resistance, conversational pace', 'duration': '25-30 min'},
                    {'name': 'Light Jog', 'description': 'Slow jog at conversational pace (5-6 mph)', 'duration': '20-25 min'},
                    {'name': 'Swimming Laps', 'description': 'Easy swimming with frequent breaks', 'duration': '20-25 min'},
                    {'name': 'Elliptical Training', 'description': 'Elliptical machine at easy resistance setting', 'duration': '25-30 min'},
                    {'name': 'Moderate Jump Rope', 'description': 'Moderate pace jump rope with breaks', 'duration': '12-15 min'},
                    {'name': 'Light Rowing', 'description': 'Light rowing machine at steady pace', 'duration': '20-25 min'},
                    {'name': 'Stair Machine', 'description': 'Slow stair climbing on stair machine', 'duration': '15-20 min'},
                ],
                'medium': [
                    {'name': 'Steady State Running', 'description': 'Moderate pace steady run (6-8 mph)', 'duration': '25-30 min'},
                    {'name': 'HIIT Training', 'description': 'High-intensity intervals: 1 min hard / 1 min easy', 'duration': '22-28 min'},
                    {'name': 'Tempo Run', 'description': 'Running at threshold pace with warm-up/cool-down', 'duration': '25-35 min'},
                    {'name': 'Moderate Cycling', 'description': 'Cycling at moderate intensity (14-16 mph)', 'duration': '35-45 min'},
                    {'name': 'CrossFit Metcon', 'description': 'Metabolic conditioning CrossFit workout', 'duration': '30-40 min'},
                    {'name': 'Heavy Battle Ropes', 'description': 'Intense heavy rope training', 'duration': '15-20 min'},
                    {'name': 'Box Jump Circuit', 'description': 'Explosive box jump circuits with rest', 'duration': '15-20 min'},
                    {'name': 'Speed Intervals', 'description': 'Sprint intervals: 45 sec hard / 45 sec recovery', 'duration': '22-28 min'},
                ],
                'hard': [
                    {'name': 'Long Distance Run', 'description': 'Extended endurance run (10+ miles)', 'duration': '50-75 min'},
                    {'name': 'Speed Work Sessions', 'description': 'High-speed interval repeats at 8-10 mph', 'duration': '35-45 min'},
                    {'name': 'Competitive Cycling', 'description': 'High-intensity cycling at race pace (18+ mph)', 'duration': '60-90 min'},
                    {'name': 'Metcon Training', 'description': 'Intense metabolic conditioning circuits', 'duration': '35-50 min'},
                    {'name': 'Maximum Effort Rowing', 'description': 'High-intensity rowing intervals at max pace', 'duration': '25-35 min'},
                    {'name': 'Trail Running', 'description': 'Off-road endurance run with elevation changes', 'duration': '50-75 min'},
                    {'name': 'Boxing/MMA Sparring', 'description': 'Intense sparring or combat conditioning', 'duration': '35-45 min'},
                    {'name': 'Triathlon Session', 'description': 'Multi-sport endurance: swim/bike/run combo', 'duration': '75-120 min'},
                ],
            },
            'flexibility': {
                'easy': [
                    {'name': 'Full Body Stretching', 'description': 'Guided static stretching routine', 'duration': '12-15 min'},
                    {'name': 'Beginner Yoga', 'description': 'Basic yoga poses for flexibility', 'duration': '20-25 min'},
                    {'name': 'Foam Rolling Session', 'description': 'Self-myofascial release with foam roller', 'duration': '12-18 min'},
                    {'name': 'Joint Mobility Routine', 'description': 'Joint mobility circles and dynamic movement', 'duration': '12-15 min'},
                    {'name': 'Gentle Tai Chi', 'description': 'Slow flowing tai chi movements', 'duration': '25-30 min'},
                    {'name': 'Light Yoga Flow', 'description': 'Gentle vinyasa flow with modifications', 'duration': '20-25 min'},
                    {'name': 'Hip Opener Routine', 'description': 'Targeted hip stretching and mobility', 'duration': '12-15 min'},
                    {'name': 'Spinal Stretching', 'description': 'Spinal mobility and back flexibility', 'duration': '12-15 min'},
                ],
                'medium': [
                    {'name': 'Traditional Hatha Yoga', 'description': 'Classic hatha yoga class', 'duration': '40-50 min'},
                    {'name': 'Pilates Session', 'description': 'Core strength and flexibility pilates', 'duration': '35-45 min'},
                    {'name': 'Vinyasa Yoga', 'description': 'Dynamic flowing vinyasa sequences', 'duration': '50-60 min'},
                    {'name': 'Advanced Stretching', 'description': 'Deep stretching and PNF techniques', 'duration': '35-45 min'},
                    {'name': 'Gymnastics Mobility', 'description': 'Mobility training for gymnastics skills', 'duration': '35-45 min'},
                    {'name': 'Barre Fitness Class', 'description': 'Ballet-inspired body conditioning', 'duration': '50-60 min'},
                    {'name': 'Dance Flexibility', 'description': 'Flexibility through dynamic dance', 'duration': '35-45 min'},
                    {'name': 'Active Recovery Session', 'description': 'Gentle movement and thorough stretching', 'duration': '35-45 min'},
                ],
                'hard': [
                    {'name': 'Advanced Yoga Practice', 'description': 'Advanced asana practice with arm balances', 'duration': '70-90 min'},
                    {'name': 'Contortion Training', 'description': 'Extreme flexibility and contortion work', 'duration': '50-65 min'},
                    {'name': 'Martial Arts Splits', 'description': 'High kicks and maximum splits training', 'duration': '50-60 min'},
                    {'name': 'Acro Yoga', 'description': 'Partner-assisted advanced yoga poses', 'duration': '65-90 min'},
                    {'name': 'Power Yoga Intensive', 'description': 'Intense strength-building yoga practice', 'duration': '70-85 min'},
                    {'name': 'Deep Yin Yoga', 'description': 'Deep connective tissue work, 3-5 min holds', 'duration': '70-90 min'},
                    {'name': 'Parkour Mobility', 'description': 'Movement and maximum flexibility integration', 'duration': '50-65 min'},
                    {'name': 'Extreme Flexibility Push', 'description': 'Maximum range of motion training', 'duration': '70-90 min'},
                ],
            },
            'health': {
                'easy': [
                    {'name': 'Nature Walking', 'description': 'Leisurely outdoor nature walk', 'duration': '25-30 min'},
                    {'name': 'Mindfulness Meditation', 'description': 'Guided mindfulness meditation session', 'duration': '12-20 min'},
                    {'name': 'Deep Breathing Work', 'description': 'Diaphragmatic breathing exercises', 'duration': '10-15 min'},
                    {'name': 'Office Stretching', 'description': 'Desk and posture correction stretches', 'duration': '10-15 min'},
                    {'name': 'Postural Alignment', 'description': 'Posture correction and alignment work', 'duration': '12-18 min'},
                    {'name': 'Guided Relaxation', 'description': 'Guided relaxation and body scan', 'duration': '15-20 min'},
                    {'name': 'Beginner Core Work', 'description': 'Basic core stabilization exercises', 'duration': '12-15 min'},
                    {'name': 'Balance & Proprioception', 'description': 'Balance board and stability training', 'duration': '12-15 min'},
                ],
                'medium': [
                    {'name': 'Mindful Walking', 'description': 'Mindful outdoor walking in nature', 'duration': '35-45 min'},
                    {'name': 'Functional Movement', 'description': 'Functional movement pattern training', 'duration': '35-45 min'},
                    {'name': 'Intermediate Core', 'description': 'Intermediate core strengthening routine', 'duration': '25-35 min'},
                    {'name': 'Corrective Exercise', 'description': 'Physical therapy corrective exercise session', 'duration': '35-45 min'},
                    {'name': 'Cardio for Heart Health', 'description': 'Heart health focused cardiovascular work', 'duration': '35-45 min'},
                    {'name': 'Injury Prevention', 'description': 'Prehab and injury prevention exercises', 'duration': '35-45 min'},
                    {'name': 'Wellness Yoga', 'description': 'Yoga and meditation combined wellness', 'duration': '35-45 min'},
                    {'name': 'Sleep Quality Routine', 'description': 'Evening relaxation routine for sleep', 'duration': '25-30 min'},
                ],
                'hard': [
                    {'name': 'Advanced Functional Training', 'description': 'Complex functional movement patterns', 'duration': '50-65 min'},
                    {'name': 'Physical Therapy Program', 'description': 'Intensive rehabilitation program', 'duration': '50-65 min'},
                    {'name': 'Advanced Core Intensive', 'description': 'Advanced core stabilization and strength', 'duration': '45-60 min'},
                    {'name': 'Athletic Performance', 'description': 'Sport-specific performance enhancement', 'duration': '50-65 min'},
                    {'name': 'Full Body Conditioning', 'description': 'Comprehensive full-body fitness assessment', 'duration': '50-65 min'},
                    {'name': 'Deep Tissue Mobility', 'description': 'Advanced deep tissue mobility work', 'duration': '50-65 min'},
                    {'name': 'Advanced Recovery', 'description': 'Advanced recovery and regeneration techniques', 'duration': '50-65 min'},
                    {'name': 'Wellness Evaluation', 'description': 'Comprehensive wellness evaluation session', 'duration': '70-90 min'},
                ],
            },
            'hiit': {
                'easy': [
                    {'name': 'Beginner HIIT', 'description': '30 sec work / 30 sec rest bodyweight intervals', 'duration': '18-22 min'},
                    {'name': 'Light Circuits', 'description': 'Bodyweight circuit training with adequate rest', 'duration': '18-22 min'},
                    {'name': 'Tabata Basics', 'description': '20 sec on / 10 sec off basic exercises', 'duration': '18 min'},
                    {'name': 'Jump Training', 'description': 'Jumping exercises with recovery intervals', 'duration': '18-22 min'},
                    {'name': 'Stair Sprints', 'description': 'Stair runs with walk-down recovery periods', 'duration': '18-22 min'},
                    {'name': 'Modified Burpees', 'description': 'Step-back burpee circuit with rest', 'duration': '18-22 min'},
                    {'name': 'Mountain Climber Intervals', 'description': 'Mountain climber intervals 40 sec / 20 sec', 'duration': '12-16 min'},
                    {'name': 'Agility Ladder Drills', 'description': 'Footwork agility drills with breaks', 'duration': '18-22 min'},
                ],
                'medium': [
                    {'name': 'HIIT Treadmill Running', 'description': '1 min hard sprint / 1 min easy alternates', 'duration': '25-30 min'},
                    {'name': 'Strength Circuit HIIT', 'description': 'Compound movement circuit 45 sec / 15 sec', 'duration': '28-35 min'},
                    {'name': 'Battle Rope HIIT', 'description': 'Rope training 40 sec work / 20 sec rest', 'duration': '22-28 min'},
                    {'name': 'Stationary Bike Sprints', 'description': 'Bike sprint intervals with recovery', 'duration': '25-30 min'},
                    {'name': 'Rowing Machine Intervals', 'description': 'High-intensity rowing bursts with recovery', 'duration': '25-30 min'},
                    {'name': 'CrossFit Metcon', 'description': 'Fast-paced CrossFit workout of the day', 'duration': '25-32 min'},
                    {'name': 'Plyometric Circuit', 'description': 'Explosive movement circuit 50 sec / 10 sec', 'duration': '28-32 min'},
                    {'name': 'Boxing Combinations', 'description': 'High-intensity boxing combo drills', 'duration': '25-32 min'},
                ],
                'hard': [
                    {'name': 'Extreme HIIT Protocol', 'description': 'Maximal effort 45 sec / 15 sec intervals', 'duration': '30-40 min'},
                    {'name': 'Murph Benchmark', 'description': 'Bodyweight CrossFit benchmark Murph', 'duration': '35-65 min'},
                    {'name': 'Assault Bike Maximum', 'description': 'Maximum effort sprint intervals', 'duration': '25-35 min'},
                    {'name': 'Olympic Lift Circuit', 'description': 'Power Olympic lifts HIIT combination', 'duration': '35-50 min'},
                    {'name': 'Equipment Circuits', 'description': 'Heavy rope and sled HIIT circuits', 'duration': '30-40 min'},
                    {'name': 'Distance Repeat Circuit', 'description': 'Maximum distance repeat intervals', 'duration': '35-50 min'},
                    {'name': 'Mixed Modality', 'description': 'Multi-modality HIIT combination', 'duration': '40-50 min'},
                    {'name': 'Elite Conditioning', 'description': 'Elite-level conditioning benchmark', 'duration': '45-65 min'},
                ],
            },
        }
    
    def generate_task(self, user_data):
        """Generate a single personalized task"""
        try:
            # Prepare features
            features = self._prepare_features(user_data)
            
            # Get model predictions
            predictions = self.model.predict(features.reshape(1, -1), verbose=0)
            y_cat, y_diff, y_xp, y_dur, y_stats = predictions
            
            # Process category and difficulty
            category_idx = np.argmax(y_cat[0])
            difficulty_idx = np.argmax(y_diff[0])
            
            category = self.CATEGORY_CLASSES[category_idx]
            difficulty = self.DIFFICULTY_CLASSES[difficulty_idx]
            
            # Denormalize XP and duration
            xp = self._denormalize_xp(y_xp[0][0])
            duration = self._denormalize_duration(y_dur[0][0])
            
            # Convert stats to simple integers (1/2/3 based on difficulty)
            stat_values = np.round(y_stats[0] * 3.0).astype(int)
            stat_values = np.clip(stat_values, 1, 3)
            
            stat_rewards = {
                stat_name: int(stat_values[i]) 
                for i, stat_name in enumerate(self.STAT_NAMES)
            }
            
            # Select exercise
            exercise = self._select_exercise(category, difficulty)
            
            return {
                'exercise_name': exercise['name'],
                'exercise_description': exercise['description'],
                'exercise_target': exercise.get('reps', exercise.get('duration', 'N/A')),
                'category': category,
                'difficulty': difficulty,
                'xp': int(xp),
                'duration': int(duration),
                'stat_rewards': stat_rewards
            }
        except Exception as e:
            print(f"✗ Error generating task: {e}", file=sys.stderr)
            raise
    
    def _prepare_features(self, user_data):
        """Prepare user data for model - 19 features in specific order"""
        features = np.array([
            float(user_data.get('age', 30)),
            float(user_data.get('height', 175)),
            float(user_data.get('weight', 75)),
            float(user_data.get('strength', 100)),
            float(user_data.get('constitution', 100)),
            float(user_data.get('dexterity', 100)),
            float(user_data.get('wisdom', 100)),
            float(user_data.get('charisma', 100)),
            float(user_data.get('total_xp', 0)),
            float(user_data.get('level', 1)),
            float(user_data.get('weekly_xp', 0)),
            float(user_data.get('bmi', 24)),
            float(user_data.get('sleep_quality', 70)),
            float(user_data.get('stress_level', 50)),
            self._encode_gender(user_data.get('gender', 'M')),
            self._encode_fitness_level(user_data.get('fitness_level', 'Intermediate')),
            self._encode_activity_level(user_data.get('activity_level', 'Moderate')),
            self._encode_rank(user_data.get('rank', 'C')),
            self._encode_goal(user_data.get('primary_goal', 'balanced')),
        ], dtype=np.float32)
        
        # Normalize using preprocessor
        return self.preprocessor.transform(features.reshape(1, -1))[0]
    
    def _denormalize_xp(self, xp_norm):
        """Convert normalized XP (0-1) to actual range (10-200)"""
        return xp_norm * 190 + 10
    
    def _denormalize_duration(self, dur_norm):
        """Convert normalized duration (0-1) to actual range (10-120 min)"""
        return dur_norm * 110 + 10
    
    def _select_exercise(self, category, difficulty):
        """Select random exercise from database"""
        exercises = self.EXERCISES[category][difficulty]
        idx = np.random.randint(0, len(exercises))
        return exercises[idx]
    
    @staticmethod
    def _encode_gender(val):
        mapping = {'M': 0, 'F': 1, 'Other': 2}
        return float(mapping.get(val, 0))
    
    @staticmethod
    def _encode_fitness_level(val):
        mapping = {'Beginner': 0, 'Intermediate': 1, 'Advanced': 2, 'Expert': 3}
        return float(mapping.get(val, 1))
    
    @staticmethod
    def _encode_activity_level(val):
        mapping = {'Sedentary': 0, 'Light': 1, 'Moderate': 2, 'Very Active': 3}
        return float(mapping.get(val, 1))
    
    @staticmethod
    def _encode_rank(val):
        mapping = {'E': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5}
        return float(mapping.get(val, 2))
    
    @staticmethod
    def _encode_goal(val):
        mapping = {'strength': 0, 'cardio': 1, 'flexibility': 2, 'health': 3, 'balanced': 4}
        return float(mapping.get(val, 4))


def main():
    """Main entry point - read user data from stdin and output task as JSON"""
    try:
        # Read user data from command line argument
        if len(sys.argv) < 2:
            print("Error: User data not provided", file=sys.stderr)
            sys.exit(1)
        
        user_data = json.loads(sys.argv[1])
        
        # Initialize generator
        generator = MLTaskGenerator()
        
        # Generate task
        task = generator.generate_task(user_data)
        
        # Output as JSON
        print(json.dumps(task))
        sys.exit(0)
    
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

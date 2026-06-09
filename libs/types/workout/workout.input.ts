import { WorkoutDifficulty } from '../../enums/workout.enum';
import { Direction } from '../../enums/common.enum';

export interface WorkoutExerciseInput {
	exerciseName: string;
	sets: number;
	reps: number;
	duration?: number;
}

export interface WorkoutInput {
	memberId?: string;
	workoutTitle: string;
	workoutDesc?: string;
	workoutDifficulty: WorkoutDifficulty;
	targetMuscle: string;
	estimatedCaloriesBurned?: number;
	exercises?: WorkoutExerciseInput[];
	videoUrl?: string;
	workoutThumbnail?: string;
	isFree?: boolean;
	courseId?: string;
}

export interface WorkoutUpdate {
	_id: string;
	workoutTitle?: string;
	workoutDesc?: string;
	workoutDifficulty?: WorkoutDifficulty;
	targetMuscle?: string;
	estimatedCaloriesBurned?: number;
	workoutThumbnail?: string;
	videoUrl?: string;
	isFree?: boolean;
	courseId?: string;
	exercises?: WorkoutExerciseInput[];
}

interface WorkoutSearch {
	workoutDifficulty?: WorkoutDifficulty;
	targetMuscle?: string;
	text?: string;
	isFree?: boolean;
}

export interface WorkoutsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: WorkoutSearch;
}

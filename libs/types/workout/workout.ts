import { WorkoutDifficulty } from '../../enums/workout.enum';
import { MeLiked, TotalCounter } from '../common';

export interface WorkoutExercise {
	exerciseName: string;
	sets: number;
	reps: number;
	duration?: number;
}

export interface Workout {
	_id: string;
	memberId: string;
	workoutTitle: string;
	workoutDesc?: string;
	workoutDifficulty: WorkoutDifficulty;
	targetMuscle: string;
	estimatedCaloriesBurned: number;
	exercises: WorkoutExercise[];
	videoUrl?: string;
	workoutThumbnail?: string;
	workoutRating?: number;
	workoutRatingCount?: number;
	isFree: boolean;
	courseId?: string;
	workoutViews?: number;
	workoutLikes?: number;
	workoutRank?: number;
	meLiked?: MeLiked[];
	createdAt: Date;
	updatedAt: Date;
}

export interface WorkoutCounter {
	total: number;
}

export interface Workouts {
	list: Workout[];
	metaCounter: WorkoutCounter[];
}

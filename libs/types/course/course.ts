import { CourseDifficulty, CourseCategory } from '../../enums/course.enum';

export interface Lesson {
	_id: string;
	courseId: string;
	title: string;
	description?: string;
	videoUrl?: string;
	weekNumber: number;
	order: number;
	duration: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface Course {
	_id: string;
	trainerId: string;
	courseTitle: string;
	courseDesc?: string;
	courseDifficulty: CourseDifficulty;
	courseCategory: CourseCategory;
	coursePrice: number;
	courseDuration: number;
	courseThumbnail?: string;
	courseVideos: string[];
	purchasedMembers: string[];
	lessons?: Lesson[];
	courseRating?: number;
	courseRatingCount?: number;
	courseLikes?: number;
	meLiked?: { memberId: string; likeRefId: string; myFavorite: boolean }[];
	courseRank?: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface CourseCounter {
	total: number;
}

export interface Courses {
	list: Course[];
	metaCounter: CourseCounter[];
}

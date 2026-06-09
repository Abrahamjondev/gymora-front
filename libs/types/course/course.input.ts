import { CourseDifficulty, CourseCategory } from '../../enums/course.enum';
import { Direction } from '../../enums/common.enum';

export interface CourseInput {
	trainerId?: string;
	courseTitle: string;
	courseDesc?: string;
	courseDifficulty: CourseDifficulty;
	courseCategory: CourseCategory;
	coursePrice?: number;
	courseDuration: number;
	courseThumbnail?: string;
	courseVideos?: string[];
}

export interface CourseUpdate {
	_id: string;
	courseTitle?: string;
	courseDesc?: string;
	courseDifficulty?: CourseDifficulty;
	courseCategory?: CourseCategory;
	coursePrice?: number;
	courseDuration?: number;
	courseThumbnail?: string;
	courseVideos?: string[];
}

interface CourseSearch {
	courseCategory?: CourseCategory;
	courseDifficulty?: CourseDifficulty;
	text?: string;
}

export interface CoursesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: CourseSearch;
}

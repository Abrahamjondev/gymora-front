import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const UPDATE_MEMBER_BY_ADMIN = gql`
	mutation UpdateMemberByAdmin($input: MemberUpdateByAdmin!) {
		updateMemberByAdmin(input: $input) {
			_id
			memberType
			memberStatus
			memberAuthType
			memberPhone
			memberNick
			memberFullName
			memberImage
			memberAddress
			memberDesc
			memberCourses
			memberWorkouts
			memberRank
			memberArticles
			memberPoints
			memberLikes
			memberViews
			memberWarnings
			memberBlocks
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

/**************************
 *        WORKOUT        *
 *************************/

export const UPDATE_WORKOUT_BY_ADMIN = gql`
	mutation UpdateWorkoutByAdmin($input: WorkoutUpdate!) {
		updateWorkoutByAdmin(input: $input) {
			_id
			memberId
			workoutTitle
			workoutDesc
			workoutDifficulty
			targetMuscle
			estimatedCaloriesBurned
			isFree
			courseId
			workoutViews
			workoutLikes
			createdAt
			updatedAt
		}
	}
`;

export const DELETE_WORKOUT_BY_ADMIN = gql`
	mutation DeleteWorkoutByAdmin($input: String!) {
		deleteWorkoutByAdmin(workoutId: $input) {
			_id
			workoutTitle
			workoutDifficulty
			createdAt
		}
	}
`;

/**************************
 *        TRAINER        *
 *************************/

export const UPDATE_TRAINER_BY_ADMIN = gql`
	mutation UpdateTrainerByAdmin($input: TrainerUpdate!) {
		updateTrainerByAdmin(input: $input) {
			_id
			memberId
			trainerBio
			trainerSpecializations
			trainerExperience
			trainerRating
			trainerVerificationStatus
			trainerRank
			createdAt
			updatedAt
		}
	}
`;

export const DELETE_TRAINER_BY_ADMIN = gql`
	mutation DeleteTrainerByAdmin($input: String!) {
		deleteTrainerByAdmin(trainerId: $input) {
			_id
			memberId
			trainerBio
			createdAt
		}
	}
`;

/**************************
 *        COURSE         *
 *************************/

export const UPDATE_COURSE_BY_ADMIN = gql`
	mutation UpdateCourseByAdmin($input: CourseUpdate!) {
		updateCourseByAdmin(input: $input) {
			_id
			trainerId
			courseTitle
			courseDesc
			courseDifficulty
			courseCategory
			coursePrice
			courseDuration
			courseRating
			courseRank
			createdAt
			updatedAt
		}
	}
`;

export const DELETE_COURSE_BY_ADMIN = gql`
	mutation DeleteCourseByAdmin($input: String!) {
		deleteCourseByAdmin(courseId: $input) {
			_id
			courseTitle
			courseCategory
			createdAt
		}
	}
`;

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const DELETE_BOARD_ARTICLE_BY_ADMIN = gql`
	mutation DeleteBoardArticleByAdmin($input: String!) {
		deleteBoardArticleByAdmin(articleId: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			memberId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const REMOVE_COMMENT_BY_ADMIN = gql`
	mutation RemoveCommentByAdmin($input: String!) {
		removeCommentByAdmin(commentId: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *       LESSONS          *
 *************************/

export const DELETE_LESSON_BY_ADMIN = gql`
	mutation DeleteLessonByAdmin($input: String!) {
		deleteLessonByAdmin(lessonId: $input) {
			_id
			title
		}
	}
`;

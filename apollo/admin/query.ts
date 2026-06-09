import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_ALL_MEMBERS_BY_ADMIN = gql`
	query GetAllMembersByAdmin($input: MembersInquiry!) {
		getAllMembersByAdmin(input: $input) {
			list {
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
				memberWarnings
				memberBlocks
				memberCourses
				memberWorkouts
				memberRank
				memberArticles
				memberPoints
				memberLikes
				memberViews
				deletedAt
				createdAt
				updatedAt
				accessToken
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *        WORKOUT        *
 *************************/

export const GET_ALL_WORKOUTS_BY_ADMIN = gql`
	query GetAllWorkoutsByAdmin($input: WorkoutsInquiry!) {
		getAllWorkoutsByAdmin(input: $input) {
			list {
				_id
				memberId
				workoutTitle
				workoutDesc
				workoutDifficulty
				targetMuscle
				estimatedCaloriesBurned
				exercises {
					exerciseName
					sets
					reps
					duration
				}
				videoUrl
				workoutThumbnail
				workoutRating
				workoutRatingCount
				isFree
				courseId
				workoutViews
				workoutLikes
				workoutRank
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *        TRAINER        *
 *************************/

export const GET_ALL_TRAINERS_BY_ADMIN = gql`
	query GetAllTrainersByAdmin($input: TrainersListInquiry!) {
		getAllTrainersByAdmin(input: $input) {
			list {
				_id
				memberId
				trainerBio
				trainerSpecializations
				trainerExperience
				trainerRating
				trainerRatingCount
				trainerSocialLinks
				trainerVerificationStatus
				trainerRank
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *        COURSE         *
 *************************/

export const GET_ALL_COURSES_BY_ADMIN = gql`
	query GetAllCoursesByAdmin($input: CoursesInquiry!) {
		getAllCoursesByAdmin(input: $input) {
			list {
				_id
				trainerId
				courseTitle
				courseDesc
				courseDifficulty
				courseCategory
				coursePrice
				courseDuration
				courseThumbnail
				courseVideos
				courseRating
				courseRatingCount
				courseRank
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const GET_BOARD_ARTICLES_BY_ADMIN = gql`
	query GetBoardArticlesByAdmin($input: BoardArticlesInquiry!) {
		getBoardArticles(input: $input) {
			list {
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
				memberData {
					_id
					memberNick
					memberImage
					memberType
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const GET_COMMENTS = gql`
	query GetComments($input: CommentsInquiry!) {
		getComments(input: $input) {
			list {
				_id
				commentStatus
				commentGroup
				commentContent
				commentRefId
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberNick
					memberImage
					memberType
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

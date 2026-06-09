import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const SIGN_UP = gql`
	mutation Signup($input: MemberInput!) {
		signup(input: $input) {
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
	}
`;

export const LOGIN = gql`
	mutation Login($input: LoginInput!) {
		login(input: $input) {
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
			memberPoints
			memberLikes
			memberViews
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const UPDATE_MEMBER = gql`
	mutation UpdateMember($input: MemberUpdate!) {
		updateMember(input: $input) {
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

export const LIKE_TARGET_MEMBER = gql`
	mutation LikeTargetMember($input: String!) {
		likeTargetMember(memberId: $input) {
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
			memberPoints
			memberLikes
			memberViews
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

export const CREATE_WORKOUT = gql`
	mutation CreateWorkout($input: WorkoutInput!) {
		createWorkout(input: $input) {
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
			isFree
			courseId
			workoutViews
			workoutLikes
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_WORKOUT = gql`
	mutation UpdateWorkout($input: WorkoutUpdate!) {
		updateWorkout(input: $input) {
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
			isFree
			courseId
			workoutViews
			workoutLikes
			createdAt
			updatedAt
		}
	}
`;

export const LIKE_WORKOUT = gql`
	mutation LikeWorkout($input: String!) {
		likeWorkout(workoutId: $input) {
			_id
			memberId
			workoutTitle
			workoutDifficulty
			targetMuscle
			workoutThumbnail
			isFree
			workoutViews
			workoutLikes
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const CREATE_BOARD_ARTICLE = gql`
	mutation CreateBoardArticle($input: BoardArticleInput!) {
		createBoardArticle(input: $input) {
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

export const UPDATE_BOARD_ARTICLE = gql`
	mutation UpdateBoardArticle($input: BoardArticleUpdate!) {
		updateBoardArticle(input: $input) {
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

export const LIKE_TARGET_BOARD_ARTICLE = gql`
	mutation LikeBoardArticle($input: String!) {
		likeBoardArticle(articleId: $input) {
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

export const CREATE_COMMENT = gql`
	mutation CreateComment($input: CommentInput!) {
		createComment(input: $input) {
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

export const UPDATE_COMMENT = gql`
	mutation UpdateComment($input: CommentUpdate!) {
		updateComment(input: $input) {
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
 *         FOLLOW        *
 *************************/

export const SUBSCRIBE = gql`
	mutation Subscribe($input: String!) {
		subscribe(input: $input) {
			_id
			followingId
			followerId
			createdAt
			updatedAt
		}
	}
`;

export const UNSUBSCRIBE = gql`
	mutation Unsubscribe($input: String!) {
		unsubscribe(input: $input) {
			_id
			followingId
			followerId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *       NUTRITION        *
 *************************/

export const ADD_MEAL_LOG = gql`
	mutation AddMealLog($input: MealLogInput!) {
		addMealLog(input: $input) {
			_id
			memberId
			mealType
			mealName
			calories
			protein
			carbs
			fats
			mealDate
			mealImage
			createdAt
			updatedAt
		}
	}
`;

export const DELETE_MEAL_LOG = gql`
	mutation DeleteMealLog($input: String!) {
		deleteMealLog(mealLogId: $input) {
			_id
			mealName
		}
	}
`;

/**************************
 *       PROGRESS         *
 *************************/

export const ADD_PROGRESS = gql`
	mutation AddProgress($input: ProgressInput!) {
		addProgress(input: $input) {
			_id
			memberId
			progressDate
			weight
			chest
			waist
			hips
			bodyFat
			progressPhotos
			progressNote
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *     NOTIFICATIONS      *
 *************************/

export const MARK_NOTIFICATION_READ = gql`
	mutation MarkNotificationRead($input: String!) {
		markNotificationRead(notificationId: $input) {
			_id
			isRead
		}
	}
`;

/**************************
 *       TRAINER          *
 *************************/

export const CREATE_TRAINER = gql`
	mutation CreateTrainer($input: TrainerInput!) {
		createTrainer(input: $input) {
			_id
			memberId
			trainerBio
			trainerSpecializations
			trainerExperience
			trainerVerificationStatus
			createdAt
		}
	}
`;


/**************************
 *        REVIEW          *
 *************************/

export const CREATE_REVIEW = gql`
	mutation CreateReview($input: ReviewInput!) {
		createReview(input: $input) {
			_id
			memberId
			trainerId
			courseId
			workoutId
			reviewRating
			reviewText
			createdAt
		}
	}
`;

/**************************
 *    COURSE PURCHASE     *
 *************************/

export const PURCHASE_COURSE = gql`
	mutation PurchaseCourse($input: String!) {
		purchaseCourse(courseId: $input) {
			_id
			courseTitle
			purchasedMembers
		}
	}
`;

/**************************
 *         CHAT           *
 *************************/

export const SEND_MESSAGE = gql`
	mutation SendMessage($input: ChatInput!) {
		sendMessage(input: $input) {
			_id
			senderId
			receiverId
			message
			isRead
			createdAt
		}
	}
`;

import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_TRAINER_MEMBERS = gql`
	query GetTrainerMembers($input: TrainersInquiry!) {
		getTrainerMembers(input: $input) {
			list {
				_id
				memberType
				memberStatus
				memberNick
				memberFullName
				memberImage
				memberDesc
				memberCourses
				memberWorkouts
				memberRank
				memberPoints
				memberLikes
				memberViews
				memberFollowers
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MEMBER = gql(`
query GetMember($input: String!) {
    getMember(memberId: $input) {
        _id
        memberType
        memberStatus
        memberNick
        memberFullName
        memberImage
        memberDesc
        memberCourses
        memberWorkouts
        memberArticles
        memberPoints
        memberLikes
        memberViews
        memberFollowings
				memberFollowers
        memberRank
        createdAt
        updatedAt
        meLiked {
					memberId
					likeRefId
					myFavorite
				}
        meFollowed {
					followingId
					followerId
					myFollowing
				}
    }
}
`);

/**************************
 *        TRAINER        *
 *************************/

/**************************
 *        COURSE         *
 *************************/

export const GET_COURSES = gql`
	query GetCourses($input: CoursesInquiry!) {
		getCourses(input: $input) {
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
				courseLikes
				purchasedMembers
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
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

export const GET_COURSE = gql`
	query GetCourse($input: String!) {
		getCourse(courseId: $input) {
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
			purchasedMembers
			lessons {
				_id
				courseId
				title
				description
				videoUrl
				weekNumber
				order
				duration
				createdAt
				updatedAt
			}
			courseRating
			courseRatingCount
			courseLikes
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
			courseRank
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *        WORKOUT        *
 *************************/

export const GET_WORKOUT = gql`
	query GetWorkout($input: String!) {
		getWorkout(workoutId: $input) {
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
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
			createdAt
			updatedAt
		}
	}
`;

export const GET_WORKOUTS = gql`
	query GetWorkouts($input: WorkoutsInquiry!) {
		getWorkouts(input: $input) {
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
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MEMBER_WORKOUTS = gql`
	query GetMemberWorkouts {
		getMemberWorkouts {
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
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
			createdAt
			updatedAt
		}
	}
`;

export const GET_WORKOUTS_BY_MEMBER_ID = gql`
	query GetWorkoutsByMemberId($input: String!) {
		getWorkoutsByMemberId(memberId: $input) {
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
	}
`;

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const GET_BOARD_ARTICLE = gql`
	query GetBoardArticle($input: String!) {
		getBoardArticle(articleId: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			articleComments
			memberId
			createdAt
			updatedAt
			memberData {
				_id
				memberNick
				memberImage
				memberType
			}
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
		}
	}
`;

export const GET_BOARD_ARTICLES = gql`
	query GetBoardArticles($input: BoardArticlesInquiry!) {
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
				articleComments
				memberId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
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
					memberType
					memberStatus
					memberNick
					memberFullName
					memberImage
					memberDesc
					memberCourses
					memberWorkouts
					memberRank
					memberPoints
					memberLikes
					memberViews
					createdAt
					updatedAt
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         FOLLOW        *
 *************************/
export const GET_MEMBER_FOLLOWERS = gql`
	query GetMemberFollowers($input: FollowInquiry!) {
		getMemberFollowers(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
				}
				followerData {
					_id
					memberType
					memberStatus
					memberNick
					memberFullName
					memberImage
					memberDesc
					memberCourses
					memberWorkouts
					memberArticles
					memberPoints
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
					createdAt
					updatedAt
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MEMBER_FOLLOWINGS = gql`
	query GetMemberFollowings($input: FollowInquiry!) {
		getMemberFollowings(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
				followingData {
					_id
					memberType
					memberStatus
					memberNick
					memberFullName
					memberImage
					memberDesc
					memberCourses
					memberWorkouts
					memberArticles
					memberPoints
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
					createdAt
					updatedAt
				}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *       NUTRITION        *
 *************************/

export const GET_MEAL_HISTORY = gql`
	query GetMealHistory {
		getMealHistory {
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

export const GET_NUTRITION_HISTORY = gql`
	query GetNutritionHistory {
		getNutritionHistory {
			_id
			memberId
			nutritionDate
			totalCalories
			totalProtein
			totalCarbs
			totalFats
			createdAt
			updatedAt
		}
	}
`;

export const GET_NUTRITION_RECOMMENDATION = gql`
	query GetNutritionRecommendation($input: NutritionRecommendationInput!) {
		getNutritionRecommendation(input: $input) {
			bmr
			tdee
			dailyCalories
			dailyProtein
			dailyCarbs
			dailyFats
			bmi
			bmiCategory
			goal
			mealsPerDay
			mealPlan {
				mealType
				suggestedFoods
				targetCalories
				targetProtein
				targetCarbs
				targetFats
			}
			tips
		}
	}
`;

export const GET_DASHBOARD_STATS = gql`
	query GetDashboardStats {
		getDashboardStats {
			memberId
			totalCalories
			workoutCount
			progressEntries
			subscriptionSummary
		}
	}
`;

export const GET_PROGRESS_TIMELINE = gql`
	query GetProgressTimeline {
		getProgressTimeline {
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

export const GET_NOTIFICATIONS = gql`
	query GetNotifications {
		getNotifications {
			_id
			memberId
			notificationType
			notificationTitle
			notificationMessage
			isRead
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *   MEMBER COURSES       *
 *************************/

export const GET_TRAINER_COURSES = gql`
	query GetTrainerCourses {
		getTrainerCourses {
			_id
			trainerId
			courseTitle
			courseDesc
			courseDifficulty
			courseCategory
			coursePrice
			courseDuration
			courseThumbnail
			courseRating
			courseRatingCount
			createdAt
			updatedAt
		}
	}
`;

export const GET_MEMBER_PURCHASED_COURSES = gql`
	query GetMemberPurchasedCourses {
		getMemberPurchasedCourses {
			_id
			trainerId
			courseTitle
			courseDesc
			courseDifficulty
			courseCategory
			coursePrice
			courseDuration
			courseThumbnail
			courseRating
			courseRatingCount
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *    TRAINER DETAIL      *
 *************************/

export const GET_TRAINER = gql`
	query GetTrainer($input: String!) {
		getTrainer(trainerId: $input) {
			_id
			memberId
			trainerBio
			trainerSpecializations
			trainerExperience
			trainerRating
			trainerRatingCount
			trainerVerificationStatus
		}
	}
`;

export const GET_TRAINER_BY_MEMBER_ID = gql`
	query GetTrainerByMemberId($input: String!) {
		getTrainerByMemberId(memberId: $input) {
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
	}
`;

export const GET_COURSES_BY_TRAINER_ID = gql`
	query GetCoursesByTrainerId($input: String!) {
		getCoursesByTrainerId(trainerId: $input) {
			_id
			courseTitle
			courseDesc
			courseDifficulty
			courseCategory
			coursePrice
			courseDuration
			courseThumbnail
			courseRating
			createdAt
		}
	}
`;

export const GET_TRAINER_REVIEWS = gql`
	query GetTrainerReviews($input: String!) {
		getTrainerReviews(trainerId: $input) {
			_id
			memberId
			trainerId
			reviewRating
			reviewText
			memberData {
				_id
				memberNick
				memberImage
			}
			createdAt
		}
	}
`;

export const GET_WORKOUT_REVIEWS = gql`
	query GetWorkoutReviews($input: String!) {
		getWorkoutReviews(workoutId: $input) {
			_id
			memberId
			workoutId
			reviewRating
			reviewText
			memberData {
				_id
				memberNick
				memberImage
			}
			createdAt
		}
	}
`;

export const GET_COURSE_REVIEWS = gql`
	query GetCourseReviews($input: String!) {
		getCourseReviews(courseId: $input) {
			_id
			memberId
			courseId
			reviewRating
			reviewText
			memberData {
				_id
				memberNick
				memberImage
			}
			createdAt
		}
	}
`;

/**************************
 *    SUBSCRIPTION        *
 *************************/

export const GET_MEMBER_SUBSCRIPTIONS = gql`
	query GetMemberSubscriptions {
		getMemberSubscriptions {
			_id
			memberId
			paymentId
			subscriptionPlan
			subscriptionStatus
			startedAt
			expiresAt
			price
			createdAt
			updatedAt
		}
	}
`;

export const GET_PAYMENT_HISTORY = gql`
	query GetPaymentHistory {
		getPaymentHistory {
			_id
			memberId
			paymentAmount
			paymentCurrency
			paymentStatus
			subscriptionPlan
			transactionId
			paymentProvider
			paymentNote
			createdAt
		}
	}
`;

/**************************
 *         CHAT           *
 *************************/

export const GET_CONVERSATIONS = gql`
	query GetConversations {
		getConversations {
			partnerId
			partnerNick
			partnerImage
			lastMessage
			lastMessageAt
			isRead
			isOnline
		}
	}
`;

export const GET_MESSAGE_HISTORY = gql`
	query GetMessageHistory($input: String!) {
		getMessageHistory(partnerId: $input) {
			_id
			senderId
			receiverId
			message
			isRead
			createdAt
		}
	}
`;

/**************************
 *       LESSONS          *
 *************************/

export const GET_LESSONS_BY_COURSE = gql`
	query GetLessonsByCourse($input: String!) {
		getLessonsByCourse(courseId: $input) {
			_id
			courseId
			title
			description
			videoUrl
			weekNumber
			order
			duration
			createdAt
			updatedAt
		}
	}
`;

export const GET_LESSON_PROGRESS = gql`
	query GetLessonProgress($input: String!) {
		getLessonProgress(courseId: $input) {
			_id
			memberId
			courseId
			lessonId
			isCompleted
			completedAt
			unlockedAt
			createdAt
		}
	}
`;

export const GET_FREE_WORKOUT_COUNT = gql`
	query GetFreeWorkoutCount {
		getFreeWorkoutCount
	}
`;

/**************************
 *    AI / ANALYTICS      *
 *************************/

export const GET_AI_ANALYZE_HISTORY = gql`
	query GetAIAnalyzeHistory {
		getAIAnalyzeHistory {
			_id
			memberId
			imageUrl
			foodName
			estimatedCalories
			protein
			carbs
			fats
			aiProvider
			createdAt
		}
	}
`;

export const GET_RECOMMENDATIONS = gql`
	query GetRecommendations($input: RecommendationInput!) {
		getRecommendations(input: $input) {
			target
			items
			reason
		}
	}
`;

/**************************
 *     ONLINE STATUS      *
 *************************/

export const GET_PARTNER_ONLINE_STATUS = gql`
	query GetPartnerOnlineStatus($input: String!) {
		getPartnerOnlineStatus(partnerId: $input) {
			memberId
			isOnline
			lastSeen
		}
	}
`;

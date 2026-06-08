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
        memberAuthType
        memberPhone
        memberNick
        memberFullName
        memberImage
        memberAddress
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
        memberWarnings
        memberBlocks
        deletedAt
        createdAt
        updatedAt
        accessToken
        meFollowed {
					followingId
					followerId
					myFollowing
				}
    }
}
`);

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
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
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
					memberWarnings
					memberBlocks
					deletedAt
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
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
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
					memberWarnings
					memberBlocks
					deletedAt
					createdAt
					updatedAt
					accessToken
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

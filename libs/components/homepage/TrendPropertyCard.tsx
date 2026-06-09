import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Workout } from '../../types/workout/workout';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { REACT_APP_API_URL } from '../../config';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';

interface TrendPropertyCardProps {
	property: Workout;
	likePropertyHandler: any;
}

const TrendPropertyCard = (props: TrendPropertyCardProps) => {
	const { property, likePropertyHandler } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);

	/** HANDLERS **/
	const pushDetailHandler = async (workoutId: string) => {
		await router.push({ pathname: '/workout/detail', query: { id: workoutId } });
	};

	if (device === 'mobile') {
		return (
			<Stack className="trend-card-box" key={property._id}>
				<Box
					component={'div'}
					className={'card-img'}
					style={{ backgroundImage: `url(${REACT_APP_API_URL}/${property?.workoutThumbnail})` }}
					onClick={() => pushDetailHandler(property._id)}
				>
					<div>{property.isFree ? 'Free' : 'Paid'}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'} onClick={() => pushDetailHandler(property._id)}>
						{property.workoutTitle}
					</strong>
					<p className={'desc'}>{property.workoutDesc ?? 'no description'}</p>
					<div className={'options'}>
						<div>
							<img src="/img/icons/expand.svg" alt="" />
							<span>{property.estimatedCaloriesBurned} cal</span>
						</div>
						<div>
							<img src="/img/icons/room.svg" alt="" />
							<span>{property.workoutDifficulty}</span>
						</div>
						<div>
							<img src="/img/icons/bed.svg" alt="" />
							<span>{property.targetMuscle}</span>
						</div>
					</div>
					<Divider sx={{ mt: '15px', mb: '17px' }} />
					<div className={'bott'}>
						<p>{property.isFree ? 'Free' : 'Paid'}</p>
						<div className="view-like-box">
							<IconButton color={'default'}>
								<RemoveRedEyeIcon />
							</IconButton>
							<Typography className="view-cnt">{property?.workoutViews}</Typography>
							<IconButton color={'default'} onClick={() => likePropertyHandler(user, property?._id)}>
								{property?.meLiked && property?.meLiked[0]?.myFavorite ? (
									<FavoriteIcon style={{ color: 'red' }} />
								) : (
									<FavoriteIcon />
								)}
							</IconButton>
							<Typography className="view-cnt">{property?.workoutLikes}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
	} else {
		return (
			<Stack className="trend-card-box" key={property._id}>
				<Box
					component={'div'}
					className={'card-img'}
					style={{ backgroundImage: `url(${REACT_APP_API_URL}/${property?.workoutThumbnail})` }}
					onClick={() => pushDetailHandler(property._id)}
				>
					<div>{property.isFree ? 'Free' : 'Paid'}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'} onClick={() => pushDetailHandler(property._id)}>
						{property.workoutTitle}
					</strong>
					<p className={'desc'}>{property.workoutDesc ?? 'no description'}</p>
					<div className={'options'}>
						<div>
							<img src="/img/icons/expand.svg" alt="" />
							<span>{property.estimatedCaloriesBurned} cal</span>
						</div>
						<div>
							<img src="/img/icons/room.svg" alt="" />
							<span>{property.workoutDifficulty}</span>
						</div>
						<div>
							<img src="/img/icons/bed.svg" alt="" />
							<span>{property.targetMuscle}</span>
						</div>
					</div>
					<Divider sx={{ mt: '15px', mb: '17px' }} />
					<div className={'bott'}>
						<p>{property.isFree ? 'Free' : 'Paid'}</p>
						<div className="view-like-box">
							<IconButton color={'default'}>
								<RemoveRedEyeIcon />
							</IconButton>
							<Typography className="view-cnt">{property?.workoutViews}</Typography>
							<IconButton color={'default'} onClick={() => likePropertyHandler(user, property?._id)}>
								{property?.meLiked && property?.meLiked[0]?.myFavorite ? (
									<FavoriteIcon style={{ color: 'red' }} />
								) : (
									<FavoriteIcon />
								)}
							</IconButton>
							<Typography className="view-cnt">{property?.workoutLikes}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
	}
};

export default TrendPropertyCard;

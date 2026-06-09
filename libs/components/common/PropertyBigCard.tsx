import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Workout } from '../../types/workout/workout';
import { REACT_APP_API_URL, topWorkoutRank } from '../../config';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { useRouter } from 'next/router';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

interface PropertyBigCardProps {
	property: Workout;
	likePropertyHandler?: any;
}

const PropertyBigCard = (props: PropertyBigCardProps) => {
	const { property, likePropertyHandler } = props;
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const router = useRouter();

	/** HANDLERS **/
	const goPropertyDetatilPage = (workoutId: string) => {
		router.push(`/workout/detail?id=${workoutId}`);
	};

	if (device === 'mobile') {
		return <div>WORKOUT BIG CARD</div>;
	} else {
		return (
			<Stack className="property-big-card-box" onClick={() => goPropertyDetatilPage(property?._id)}>
				<Box
					component={'div'}
					className={'card-img'}
					style={{ backgroundImage: `url(${REACT_APP_API_URL}/${property?.workoutThumbnail})` }}
				>
					{property && (property?.workoutRank ?? 0) >= topWorkoutRank && (
						<div className={'status'}>
							<img src="/img/icons/electricity.svg" alt="" />
							<span>top</span>
						</div>
					)}

					<div className={'price'}>{property?.isFree ? 'Free' : 'Paid'}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'}>{property?.workoutTitle}</strong>
					<p className={'desc'}>{property?.targetMuscle}</p>
					<div className={'options'}>
						<div>
							<img src="/img/icons/expand.svg" alt="" />
							<span>{property?.estimatedCaloriesBurned} cal</span>
						</div>
						<div>
							<img src="/img/icons/room.svg" alt="" />
							<span>{property?.workoutDifficulty}</span>
						</div>
						<div>
							<img src="/img/icons/bed.svg" alt="" />
							<span>{property?.targetMuscle}</span>
						</div>
					</div>
					<Divider sx={{ mt: '15px', mb: '17px' }} />
					<div className={'bott'}>
						<div>
							<p>{property?.isFree ? 'Free' : 'Paid'}</p>
						</div>
						<div className="buttons-box">
							<IconButton color={'default'}>
								<RemoveRedEyeIcon />
							</IconButton>
							<Typography className="view-cnt">{property?.workoutViews}</Typography>
							<IconButton
								color={'default'}
								onClick={(e: any) => {
									e.stopPropagation();
									likePropertyHandler(user, property?._id);
								}}
							>
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

export default PropertyBigCard;

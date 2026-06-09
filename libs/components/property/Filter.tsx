import React, { useCallback, useEffect, useState } from 'react';
import {
	Stack,
	Typography,
	Checkbox,
	Button,
	OutlinedInput,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Tooltip,
	IconButton,
} from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { WorkoutDifficulty } from '../../enums/workout.enum';
import { WorkoutsInquiry } from '../../types/workout/workout.input';
import { useRouter } from 'next/router';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import RefreshIcon from '@mui/icons-material/Refresh';

interface FilterType {
	searchFilter: WorkoutsInquiry;
	setSearchFilter: any;
	initialInput: WorkoutsInquiry;
}

const Filter = (props: FilterType) => {
	const { searchFilter, setSearchFilter, initialInput } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const [workoutDifficulties] = useState<WorkoutDifficulty[]>(Object.values(WorkoutDifficulty));
	const [searchText, setSearchText] = useState<string>('');

	/** LIFECYCLES **/
	useEffect(() => {
		// No-op: simplified for workout filters
	}, [searchFilter]);

	/** HANDLERS **/
	const difficultySelectHandler = useCallback(
		async (e: any) => {
			try {
				const value = e.target.value as WorkoutDifficulty;
				await router.push(
					`/workout?input=${JSON.stringify({
						...searchFilter,
						search: { ...searchFilter.search, workoutDifficulty: value || undefined },
					})}`,
					`/workout?input=${JSON.stringify({
						...searchFilter,
						search: { ...searchFilter.search, workoutDifficulty: value || undefined },
					})}`,
					{ scroll: false },
				);
			} catch (err: any) {
			}
		},
		[searchFilter],
	);

	const targetMuscleHandler = useCallback(
		async (value: string) => {
			try {
				await router.push(
					`/workout?input=${JSON.stringify({
						...searchFilter,
						search: { ...searchFilter.search, targetMuscle: value || undefined },
					})}`,
					`/workout?input=${JSON.stringify({
						...searchFilter,
						search: { ...searchFilter.search, targetMuscle: value || undefined },
					})}`,
					{ scroll: false },
				);
			} catch (err: any) {
			}
		},
		[searchFilter],
	);

	const isFreeHandler = useCallback(
		async (e: any) => {
			try {
				const isChecked = e.target.checked;
				await router.push(
					`/workout?input=${JSON.stringify({
						...searchFilter,
						search: { ...searchFilter.search, isFree: isChecked ? true : undefined },
					})}`,
					`/workout?input=${JSON.stringify({
						...searchFilter,
						search: { ...searchFilter.search, isFree: isChecked ? true : undefined },
					})}`,
					{ scroll: false },
				);
			} catch (err: any) {
			}
		},
		[searchFilter],
	);

	const refreshHandler = async () => {
		try {
			setSearchText('');
			await router.push(
				`/workout?input=${JSON.stringify(initialInput)}`,
				`/workout?input=${JSON.stringify(initialInput)}`,
				{ scroll: false },
			);
		} catch (err: any) {
		}
	};

	if (device === 'mobile') {
		return <div>WORKOUTS FILTER</div>;
	} else {
		return (
			<Stack className={'filter-main'}>
				<Stack className={'find-your-home'} mb={'40px'}>
					<Typography className={'title-main'}>Find Your Workout</Typography>
					<Stack className={'input-box'}>
						<OutlinedInput
							value={searchText}
							type={'text'}
							className={'search-input'}
							placeholder={'What are you looking for?'}
							onChange={(e: any) => setSearchText(e.target.value)}
							onKeyDown={(event: any) => {
								if (event.key == 'Enter') {
									setSearchFilter({
										...searchFilter,
										search: { ...searchFilter.search, text: searchText },
									});
								}
							}}
							endAdornment={
								<>
									<CancelRoundedIcon
										onClick={() => {
											setSearchText('');
											setSearchFilter({
												...searchFilter,
												search: { ...searchFilter.search, text: '' },
											});
										}}
									/>
								</>
							}
						/>
						<img src={'/img/icons/search_icon.png'} alt={''} />
						<Tooltip title="Reset">
							<IconButton onClick={refreshHandler}>
								<RefreshIcon />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Difficulty</Typography>
					<FormControl fullWidth>
						<Select
							value={searchFilter?.search?.workoutDifficulty ?? ''}
							onChange={difficultySelectHandler}
							displayEmpty
						>
							<MenuItem value={''}>All Difficulties</MenuItem>
							{workoutDifficulties.map((diff: string) => (
								<MenuItem value={diff} key={diff}>
									{diff}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Target Muscle</Typography>
					<OutlinedInput
						value={searchFilter?.search?.targetMuscle ?? ''}
						type={'text'}
						className={'search-input'}
						placeholder={'e.g. Chest, Back, Legs'}
						onChange={(e: any) => targetMuscleHandler(e.target.value)}
					/>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Options</Typography>
					<Stack className={'input-box'}>
						<Checkbox
							id={'isFree'}
							className="property-checkbox"
							color="default"
							size="small"
							checked={searchFilter?.search?.isFree ?? false}
							onChange={isFreeHandler}
						/>
						<label htmlFor={'isFree'} style={{ cursor: 'pointer' }}>
							<Typography className="propert-type">Free Workouts Only</Typography>
						</label>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default Filter;

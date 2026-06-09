import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Stack, Box, Modal, Divider, Button } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { WorkoutDifficulty } from '../../enums/workout.enum';
import { WorkoutsInquiry } from '../../types/workout/workout.input';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

const style = {
	position: 'absolute' as 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 'auto',
	bgcolor: 'background.paper',
	borderRadius: '12px',
	outline: 'none',
	boxShadow: 24,
};

interface HeaderFilterProps {
	initialInput: WorkoutsInquiry;
}

const HeaderFilter = (props: HeaderFilterProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const { t, i18n } = useTranslation('common');
	const [searchFilter, setSearchFilter] = useState<WorkoutsInquiry>(initialInput);
	const difficultyRef: any = useRef();
	const router = useRouter();
	const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);
	const [openDifficulty, setOpenDifficulty] = useState(false);
	const [workoutDifficulties] = useState<WorkoutDifficulty[]>(Object.values(WorkoutDifficulty));

	/** LIFECYCLES **/
	useEffect(() => {
		const clickHandler = (event: MouseEvent) => {
			if (!difficultyRef?.current?.contains(event.target)) {
				setOpenDifficulty(false);
			}
		};

		document.addEventListener('mousedown', clickHandler);

		return () => {
			document.removeEventListener('mousedown', clickHandler);
		};
	}, []);

	/** HANDLERS **/
	const advancedFilterHandler = (status: boolean) => {
		setOpenDifficulty(false);
		setOpenAdvancedFilter(status);
	};

	const difficultyStateChangeHandler = () => {
		setOpenDifficulty((prev) => !prev);
	};

	const difficultySelectHandler = useCallback(
		async (value: WorkoutDifficulty) => {
			try {
				setSearchFilter({
					...searchFilter,
					search: {
						...searchFilter.search,
						workoutDifficulty: value,
					},
				});
				setOpenDifficulty(false);
			} catch (err: any) {
				console.log('ERROR, difficultySelectHandler:', err);
			}
		},
		[searchFilter],
	);

	const resetFilterHandler = () => {
		setSearchFilter(initialInput);
	};

	const pushSearchHandler = async () => {
		try {
			await router.push(
				`/workout?input=${JSON.stringify(searchFilter)}`,
				`/workout?input=${JSON.stringify(searchFilter)}`,
			);
		} catch (err: any) {
			console.log('ERROR, pushSearchHandler:', err);
		}
	};

	if (device === 'mobile') {
		return <div>HEADER FILTER MOBILE</div>;
	} else {
		return (
			<>
				<Stack className={'search-box'}>
					<Stack className={'select-box'}>
						<Box component={'div'} className={`box ${openDifficulty ? 'on' : ''}`} onClick={difficultyStateChangeHandler}>
							<span>
								{searchFilter?.search?.workoutDifficulty
									? searchFilter?.search?.workoutDifficulty
									: t('Difficulty')}{' '}
							</span>
							<ExpandMoreIcon />
						</Box>
					</Stack>
					<Stack className={'search-box-other'}>
						<Box className={'advanced-filter'} onClick={() => advancedFilterHandler(true)}>
							<img src="/img/icons/tune.svg" alt="" />
							<span>{t('Advanced')}</span>
						</Box>
						<Box className={'search-btn'} onClick={pushSearchHandler}>
							<img src="/img/icons/search_white.svg" alt="" />
						</Box>
					</Stack>

					{/*MENU */}
					<div className={`filter-location ${openDifficulty ? 'on' : ''}`} ref={difficultyRef}>
						{workoutDifficulties.map((difficulty: string) => {
							return (
								<div onClick={() => difficultySelectHandler(difficulty as WorkoutDifficulty)} key={difficulty}>
									<span>{difficulty}</span>
								</div>
							);
						})}
					</div>
				</Stack>

				{/* ADVANCED FILTER MODAL */}
				<Modal
					open={openAdvancedFilter}
					onClose={() => advancedFilterHandler(false)}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					{/* @ts-ignore */}
					<Box sx={style}>
						<Box className={'advanced-filter-modal'}>
							<div className={'close'} onClick={() => advancedFilterHandler(false)}>
								<CloseIcon />
							</div>
							<div className={'top'}>
								<span>Find your workout</span>
								<div className={'search-input-box'}>
									<img src="/img/icons/search.svg" alt="" />
									<input
										value={searchFilter?.search?.text ?? ''}
										type="text"
										placeholder={'What are you looking for?'}
										onChange={(e: any) => {
											setSearchFilter({
												...searchFilter,
												search: { ...searchFilter.search, text: e.target.value },
											});
										}}
									/>
								</div>
							</div>
							<Divider sx={{ mt: '30px', mb: '35px' }} />
							<div className={'middle'}>
								<div className={'row-box'}>
									<div className={'box'}>
										<span>Difficulty</span>
										<div className={'inside'}>
											<FormControl sx={{ width: '250px' }}>
												<Select
													value={searchFilter?.search?.workoutDifficulty ?? ''}
													onChange={(e: any) => {
														setSearchFilter({
															...searchFilter,
															search: {
																...searchFilter.search,
																workoutDifficulty: e.target.value || undefined,
															},
														});
													}}
													displayEmpty
													inputProps={{ 'aria-label': 'Without label' }}
												>
													<MenuItem value={''}>All Difficulties</MenuItem>
													{workoutDifficulties.map((diff) => (
														<MenuItem value={diff} key={diff}>
															{diff}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										</div>
									</div>
									<div className={'box'}>
										<span>Target Muscle</span>
										<div className={'inside'}>
											<input
												type="text"
												placeholder="e.g. Chest, Back, Legs"
												value={searchFilter?.search?.targetMuscle ?? ''}
												onChange={(e: any) => {
													setSearchFilter({
														...searchFilter,
														search: {
															...searchFilter.search,
															targetMuscle: e.target.value || undefined,
														},
													});
												}}
												style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '8px', width: '100%' }}
											/>
										</div>
									</div>
								</div>
								<div className={'row-box'} style={{ marginTop: '44px' }}>
									<div className={'box'}>
										<span>Free Workouts Only</span>
										<div className={'inside'}>
											<FormControlLabel
												control={
													<Checkbox
														checked={searchFilter?.search?.isFree ?? false}
														onChange={(e: any) => {
															setSearchFilter({
																...searchFilter,
																search: {
																	...searchFilter.search,
																	isFree: e.target.checked ? true : undefined,
																},
															});
														}}
													/>
												}
												label="Show free workouts only"
											/>
										</div>
									</div>
								</div>
							</div>
							<Divider sx={{ mt: '60px', mb: '18px' }} />
							<div className={'bottom'}>
								<div onClick={resetFilterHandler}>
									<img src="/img/icons/reset.svg" alt="" />
									<span>Reset all filters</span>
								</div>
								<Button
									startIcon={<img src={'/img/icons/search.svg'} />}
									className={'search-btn'}
									onClick={pushSearchHandler}
								>
									Search
								</Button>
							</div>
						</Box>
					</Box>
				</Modal>
			</>
		);
	}
};

HeaderFilter.defaultProps = {
	initialInput: {
		page: 1,
		limit: 9,
		search: {},
	},
};

export default HeaderFilter;

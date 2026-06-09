import React, { useEffect, useState } from 'react';
import { CircularProgress, Stack } from '@mui/material';
import { useLazyQuery, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_MEAL_HISTORY, GET_NUTRITION_RECOMMENDATION, GET_AI_ANALYZE_HISTORY } from '../../../apollo/user/query';
import { ADD_MEAL_LOG, DELETE_MEAL_LOG, ANALYZE_FOOD_IMAGE } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { Messages, REACT_APP_API_URL } from '../../config';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';

const mealTypeColors: Record<string, string> = {
	BREAKFAST: '#ff8a00',
	LUNCH: '#00dce5',
	DINNER: '#ddb7ff',
	SNACK: '#66daba',
};

const inputStyle: React.CSSProperties = {
	padding: '12px', background: '#1a1a1c', border: '1px solid rgba(255,255,255,0.1)',
	borderRadius: '10px', color: '#e9feff', fontFamily: 'Hanken Grotesk', fontSize: '14px',
	outline: 'none', width: '100%', transition: 'border-color 0.2s ease',
};

const selectStyle: React.CSSProperties = {
	...inputStyle, appearance: 'none' as const,
	backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23849495' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
	backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
	paddingRight: '32px',
};

const labelStyle: React.CSSProperties = {
	fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab',
	textTransform: 'uppercase', display: 'block', marginBottom: '6px', letterSpacing: '0.06em',
};

const STORAGE_KEY_FORM = 'gymora_nutrition_form';
const STORAGE_KEY_RESULT = 'gymora_nutrition_result';

const loadSaved = (key: string, fallback: any) => {
	if (typeof window === 'undefined') return fallback;
	try {
		const raw = localStorage.getItem(key);
		return raw ? JSON.parse(raw) : fallback;
	} catch { return fallback; }
};

const NutritionContent = () => {
	const user = useReactiveVar(userVar);

	const defaultForm = { gender: 'MALE', age: '', heightCm: '', weightKg: '', activityLevel: 'MODERATELY_ACTIVE', goal: 'MAINTENANCE' };

	// Nutrition plan form — restore from localStorage
	const [planForm, setPlanForm] = useState(() => loadSaved(STORAGE_KEY_FORM, defaultForm));
	const [recommendation, setRecommendation] = useState<any>(() => loadSaved(STORAGE_KEY_RESULT, null));
	const [planCalculated, setPlanCalculated] = useState(() => loadSaved(STORAGE_KEY_RESULT, null) !== null);

	// Persist form whenever it changes
	useEffect(() => { localStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(planForm)); }, [planForm]);

	// Meals
	const [meals, setMeals] = useState<any[]>([]);
	const [showAddMeal, setShowAddMeal] = useState(false);
	const [newMeal, setNewMeal] = useState({ mealType: 'BREAKFAST', mealName: '', calories: 0, protein: 0, carbs: 0, fats: 0, mealDate: new Date().toISOString() });

	// AI history
	const [aiHistory, setAiHistory] = useState<any[]>([]);

	// Apollo
	const { loading: mealsLoading, refetch: mealsRefetch } = useQuery(GET_MEAL_HISTORY, {
		fetchPolicy: 'network-only', skip: !user?._id,
		onCompleted: (data: T) => setMeals(data?.getMealHistory ?? []),
	});

	const [fetchRecommendation, { loading: recLoading }] = useLazyQuery(GET_NUTRITION_RECOMMENDATION, {
		fetchPolicy: 'network-only',
		onCompleted: (data: T) => {
			const rec = data?.getNutritionRecommendation;
			setRecommendation(rec);
			setPlanCalculated(true);
			if (rec) localStorage.setItem(STORAGE_KEY_RESULT, JSON.stringify(rec));
		},
	});

	useQuery(GET_AI_ANALYZE_HISTORY, {
		fetchPolicy: 'network-only', skip: !user?._id,
		onCompleted: (d: T) => setAiHistory(d?.getAIAnalyzeHistory ?? []),
	});

	const [addMealLog] = useMutation(ADD_MEAL_LOG);
	const [deleteMealLog] = useMutation(DELETE_MEAL_LOG);
	const [analyzeFoodImage] = useMutation(ANALYZE_FOOD_IMAGE);

	// AI scan state
	const [scanResult, setScanResult] = useState<any>(null);
	const [scanning, setScanning] = useState(false);
	const [scanPreview, setScanPreview] = useState<string | null>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const handleScanFood = async (file: File) => {
		try {
			setScanning(true);
			setScanResult(null);
			// Preview
			const reader = new FileReader();
			reader.onload = (e) => setScanPreview(e.target?.result as string);
			reader.readAsDataURL(file);

			const { data } = await analyzeFoodImage({
				variables: { file },
				context: { headers: { 'apollo-require-preflight': 'true' } },
			});
			const result = data?.analyzeFoodImage;
			if (result) {
				setScanResult(result);
				// Refresh AI history
				setAiHistory((prev) => [result, ...prev]);
			}
		} catch (err: any) {
			sweetMixinErrorAlert(err?.graphQLErrors?.[0]?.message || err.message || 'Analysis failed').then();
		} finally {
			setScanning(false);
		}
	};

	const logScanAsMeal = async (mealType: string) => {
		if (!scanResult) return;
		try {
			if (!user?._id) throw new Error(Messages.error2);
			await addMealLog({
				variables: {
					input: {
						mealType,
						mealName: scanResult.foodName,
						calories: Math.round(scanResult.estimatedCalories),
						protein: Math.round(scanResult.protein),
						carbs: Math.round(scanResult.carbs),
						fats: Math.round(scanResult.fats),
						mealDate: new Date().toISOString(),
					},
				},
			});
			await mealsRefetch();
			await sweetMixinSuccessAlert(`Logged as ${mealType.toLowerCase()}!`);
			setScanResult(null);
			setScanPreview(null);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const clearScan = () => {
		setScanResult(null);
		setScanPreview(null);
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	const calculatePlan = () => {
		if (!planForm.age || !planForm.heightCm || !planForm.weightKg) {
			sweetMixinErrorAlert('Please fill in age, height, and weight').then();
			return;
		}
		fetchRecommendation({
			variables: {
				input: {
					gender: planForm.gender,
					age: Number(planForm.age),
					heightCm: Number(planForm.heightCm),
					weightKg: Number(planForm.weightKg),
					activityLevel: planForm.activityLevel,
					goal: planForm.goal,
				},
			},
		});
	};

	const resetPlan = () => {
		setPlanCalculated(false);
		setRecommendation(null);
		localStorage.removeItem(STORAGE_KEY_RESULT);
	};

	const addMealHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!newMeal.mealName) throw new Error('Meal name required');
			await addMealLog({ variables: { input: { ...newMeal, calories: Number(newMeal.calories), protein: Number(newMeal.protein), carbs: Number(newMeal.carbs), fats: Number(newMeal.fats) } } });
			await mealsRefetch();
			setShowAddMeal(false);
			setNewMeal({ mealType: 'BREAKFAST', mealName: '', calories: 0, protein: 0, carbs: 0, fats: 0, mealDate: new Date().toISOString() });
			await sweetMixinSuccessAlert('Meal logged!');
		} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
	};

	const deleteMealHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Delete this meal?')) {
				await deleteMealLog({ variables: { input: id } });
				await mealsRefetch();
			}
		} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
	};

	const totalCalories = meals.reduce((a: number, m: any) => a + (m.calories || 0), 0);
	const totalProtein = meals.reduce((a: number, m: any) => a + (m.protein || 0), 0);
	const totalCarbs = meals.reduce((a: number, m: any) => a + (m.carbs || 0), 0);
	const totalFats = meals.reduce((a: number, m: any) => a + (m.fats || 0), 0);

	const goalLabels: Record<string, string> = { WEIGHT_LOSS: 'Weight Loss', MAINTENANCE: 'Maintenance', MUSCLE_GAIN: 'Muscle Gain' };
	const activityLabels: Record<string, string> = {
		SEDENTARY: 'Sedentary', LIGHTLY_ACTIVE: 'Lightly Active',
		MODERATELY_ACTIVE: 'Moderately Active', VERY_ACTIVE: 'Very Active', EXTRA_ACTIVE: 'Extra Active',
	};

	return (
		<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
			{/* Header */}
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
				<div>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#ff8a00', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
						{planCalculated ? 'Your Plan' : 'Get Started'}
					</span>
					<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 800, color: '#e5e2e3' }}>Nutrition</h2>
				</div>
				<div style={{ display: 'flex', gap: '10px' }}>
					{planCalculated && (
						<button onClick={resetPlan} style={{ background: 'transparent', color: '#9aabab', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
							Recalculate
						</button>
					)}
					<button onClick={() => fileInputRef.current?.click()} disabled={scanning} style={{
						background: 'linear-gradient(135deg, rgba(102,218,186,0.15), rgba(0,220,229,0.1))',
						color: '#7ae8c8', border: '1px solid rgba(102,218,186,0.3)',
						borderRadius: '8px', padding: '10px 20px',
						fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, cursor: scanning ? 'wait' : 'pointer',
					}}>
						{scanning ? 'Scanning...' : 'Scan Food'}
					</button>
					<input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
						onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScanFood(f); }} />
					<button onClick={() => setShowAddMeal(!showAddMeal)} style={{ background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
						+ Log Meal
					</button>
				</div>
			</div>

			{/* ─── AI SCAN RESULT ─── */}
			{(scanning || scanResult) && (
				<div style={{
					background: 'linear-gradient(135deg, rgba(102,218,186,0.06), rgba(0,220,229,0.03))',
					border: '1px solid rgba(102,218,186,0.2)', borderRadius: '16px',
					padding: '24px', marginBottom: '24px',
				}}>
					{scanning && !scanResult && (
						<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
							{scanPreview && (
								<img src={scanPreview} alt="" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
							)}
							<div>
								<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e9feff', marginBottom: '6px' }}>Analyzing food...</h4>
								<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: '#9aabab' }}>AI is identifying nutritional content</p>
								<CircularProgress sx={{ color: '#66daba', mt: 1 }} size={20} />
							</div>
						</div>
					)}

					{scanResult && (
						<div>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
								<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
									{scanPreview && (
										<img src={scanPreview} alt="" style={{ width: '72px', height: '72px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
									)}
									<div>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#66daba', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>AI Detected</span>
										<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 700, color: '#e9feff' }}>{scanResult.foodName}</h3>
									</div>
								</div>
								<button onClick={clearScan} style={{ background: 'transparent', border: 'none', color: '#9aabab', cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}>×</button>
							</div>

							{/* Nutrition breakdown */}
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
								{[
									{ label: 'Calories', value: Math.round(scanResult.estimatedCalories), unit: 'kcal', color: '#e9feff' },
									{ label: 'Protein', value: `${Math.round(scanResult.protein)}g`, unit: '', color: '#00dce5' },
									{ label: 'Carbs', value: `${Math.round(scanResult.carbs)}g`, unit: '', color: '#ff8a00' },
									{ label: 'Fats', value: `${Math.round(scanResult.fats)}g`, unit: '', color: '#ddb7ff' },
								].map((s) => (
									<div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: '#9aabab', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{s.label}</span>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</span>
										{s.unit && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', marginLeft: '2px' }}>{s.unit}</span>}
									</div>
								))}
							</div>

							{/* Log as meal buttons */}
							<div>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '10px' }}>Log as</span>
								<div style={{ display: 'flex', gap: '8px' }}>
									{(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map((type) => (
										<button key={type} onClick={() => logScanAsMeal(type)} style={{
											flex: 1, padding: '12px 8px', borderRadius: '10px', cursor: 'pointer',
											fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600,
											background: 'rgba(255,255,255,0.04)',
											border: `1px solid ${mealTypeColors[type]}30`,
											color: mealTypeColors[type],
											transition: 'all 0.2s ease',
											textAlign: 'center',
										}}>
											{type.charAt(0) + type.slice(1).toLowerCase()}
										</button>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* ─── NUTRITION PLAN FORM ─── */}
			{!planCalculated && (
				<div style={{
					background: 'linear-gradient(135deg, rgba(255,138,0,0.04), rgba(0,220,229,0.03))',
					border: '1px solid rgba(255,138,0,0.12)', borderRadius: '16px',
					padding: '32px', marginBottom: '32px',
				}}>
					<div style={{ marginBottom: '24px' }}>
						<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 700, color: '#e9feff', marginBottom: '6px' }}>
							Calculate Your Nutrition Plan
						</h3>
						<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#9aabab' }}>
							Enter your details to get personalized daily calorie and macro targets
						</p>
					</div>

					{/* Row 1: Gender + Age */}
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
						<div>
							<span style={labelStyle}>Gender</span>
							<div style={{ display: 'flex', gap: '8px' }}>
								{(['MALE', 'FEMALE'] as const).map((g) => (
									<button key={g} onClick={() => setPlanForm({ ...planForm, gender: g })} style={{
										flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
										fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600,
										border: planForm.gender === g ? '1.5px solid rgba(0,220,229,0.5)' : '1px solid rgba(255,255,255,0.1)',
										background: planForm.gender === g ? 'rgba(0,220,229,0.1)' : '#1a1a1c',
										color: planForm.gender === g ? '#e9feff' : '#9aabab',
										transition: 'all 0.2s ease',
									}}>
										{g === 'MALE' ? 'Male' : 'Female'}
									</button>
								))}
							</div>
						</div>
						<div>
							<span style={labelStyle}>Age</span>
							<input type="number" placeholder="e.g. 25" value={planForm.age}
								onChange={(e) => setPlanForm({ ...planForm, age: e.target.value })} style={inputStyle} />
						</div>
					</div>

					{/* Row 2: Height + Weight */}
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
						<div>
							<span style={labelStyle}>Height (cm)</span>
							<input type="number" placeholder="e.g. 175" value={planForm.heightCm}
								onChange={(e) => setPlanForm({ ...planForm, heightCm: e.target.value })} style={inputStyle} />
						</div>
						<div>
							<span style={labelStyle}>Weight (kg)</span>
							<input type="number" placeholder="e.g. 75" value={planForm.weightKg}
								onChange={(e) => setPlanForm({ ...planForm, weightKg: e.target.value })} style={inputStyle} />
						</div>
					</div>

					{/* Row 3: Activity Level */}
					<div style={{ marginBottom: '16px' }}>
						<span style={labelStyle}>Activity Level</span>
						<select value={planForm.activityLevel}
							onChange={(e) => setPlanForm({ ...planForm, activityLevel: e.target.value })} style={selectStyle}>
							{Object.entries(activityLabels).map(([val, label]) => (
								<option key={val} value={val}>{label}</option>
							))}
						</select>
					</div>

					{/* Row 4: Goal */}
					<div style={{ marginBottom: '24px' }}>
						<span style={labelStyle}>Goal</span>
						<div style={{ display: 'flex', gap: '8px' }}>
							{Object.entries(goalLabels).map(([val, label]) => {
								const isActive = planForm.goal === val;
								const goalColors: Record<string, string> = {
									WEIGHT_LOSS: '#ff6b6b', MAINTENANCE: '#00dce5', MUSCLE_GAIN: '#ff8a00',
								};
								return (
									<button key={val} onClick={() => setPlanForm({ ...planForm, goal: val })} style={{
										flex: 1, padding: '14px 12px', borderRadius: '12px', cursor: 'pointer',
										fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600,
										border: isActive ? `1.5px solid ${goalColors[val]}40` : '1px solid rgba(255,255,255,0.08)',
										background: isActive ? `${goalColors[val]}12` : '#1a1a1c',
										color: isActive ? goalColors[val] : '#9aabab',
										transition: 'all 0.25s ease',
										textAlign: 'center',
									}}>
										<div style={{ fontSize: '18px', marginBottom: '4px' }}>
											{val === 'WEIGHT_LOSS' ? '↓' : val === 'MAINTENANCE' ? '⟷' : '↑'}
										</div>
										{label}
									</button>
								);
							})}
						</div>
					</div>

					{/* Calculate button */}
					<button onClick={calculatePlan} disabled={recLoading} style={{
						width: '100%', padding: '16px', borderRadius: '12px', cursor: recLoading ? 'wait' : 'pointer',
						fontFamily: 'Hanken Grotesk', fontSize: '15px', fontWeight: 700,
						background: recLoading ? 'rgba(0,220,229,0.2)' : 'linear-gradient(135deg, #00dce5, #e9feff)',
						color: '#003739', border: 'none',
						boxShadow: '0 0 24px rgba(0,220,229,0.15)',
						transition: 'all 0.3s ease',
					}}>
						{recLoading ? 'Calculating...' : 'Calculate My Plan'}
					</button>
				</div>
			)}

			{/* ─── RESULTS ─── */}
			{planCalculated && recommendation && (
				<div style={{ marginBottom: '32px' }}>
					{/* Overview cards */}
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
						{[
							{ label: 'Daily Calories', value: Math.round(recommendation.dailyCalories), unit: 'kcal', color: '#e9feff' },
							{ label: 'Protein', value: `${Math.round(recommendation.dailyProtein)}g`, unit: '/day', color: '#00dce5' },
							{ label: 'Carbs', value: `${Math.round(recommendation.dailyCarbs)}g`, unit: '/day', color: '#ff8a00' },
							{ label: 'Fats', value: `${Math.round(recommendation.dailyFats)}g`, unit: '/day', color: '#ddb7ff' },
						].map((s) => (
							<div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>{s.label}</span>
								<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '26px', fontWeight: 800, color: s.color }}>{s.value}</span>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', marginLeft: '4px' }}>{s.unit}</span>
							</div>
						))}
					</div>

					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
						{/* Body metrics */}
						<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '24px' }}>
							<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e9feff', marginBottom: '16px' }}>Body Metrics</h4>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
								{[
									{ label: 'BMI', value: recommendation.bmi?.toFixed(1), sub: recommendation.bmiCategory },
									{ label: 'BMR', value: `${Math.round(recommendation.bmr)}`, sub: 'kcal/day' },
									{ label: 'TDEE', value: `${Math.round(recommendation.tdee)}`, sub: 'kcal/day' },
									{ label: 'Goal', value: goalLabels[recommendation.goal] || recommendation.goal, sub: `${recommendation.mealsPerDay} meals/day` },
								].map((s) => (
									<div key={s.label}>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{s.label}</span>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 700, color: '#e9feff', display: 'block' }}>{s.value}</span>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495' }}>{s.sub}</span>
									</div>
								))}
							</div>
						</div>

						{/* Tips */}
						{recommendation.tips?.length > 0 && (
							<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '24px' }}>
								<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e9feff', marginBottom: '16px' }}>Tips</h4>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
									{recommendation.tips.map((tip: string, i: number) => (
										<div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
											<span style={{ color: '#00dce5', fontSize: '11px', marginTop: '2px', flexShrink: 0 }}>✓</span>
											<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: '#c8d6d6', lineHeight: '19px' }}>{tip}</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Meal Plan */}
					{recommendation.mealPlan?.length > 0 && (
						<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '24px', marginBottom: '20px' }}>
							<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e9feff', marginBottom: '16px' }}>Suggested Meal Plan</h4>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
								{recommendation.mealPlan.map((meal: any, i: number) => (
									<div key={i} style={{
										background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
										borderRadius: '12px', padding: '18px',
									}}>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
											<span style={{
												fontFamily: 'JetBrains Mono', fontSize: '10px', fontWeight: 600,
												color: mealTypeColors[meal.mealType] || '#00dce5',
												textTransform: 'uppercase', letterSpacing: '0.06em',
											}}>
												{meal.mealType}
											</span>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495' }}>
												{Math.round(meal.targetCalories)} kcal
											</span>
										</div>
										<div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00dce5' }}>P:{Math.round(meal.targetProtein)}g</span>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#ff8a00' }}>C:{Math.round(meal.targetCarbs)}g</span>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#ddb7ff' }}>F:{Math.round(meal.targetFats)}g</span>
										</div>
										{meal.suggestedFoods?.length > 0 && (
											<div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
												{meal.suggestedFoods.map((food: string, j: number) => (
													<span key={j} style={{
														fontFamily: 'Hanken Grotesk', fontSize: '12px', color: '#c8d6d6',
														background: 'rgba(255,255,255,0.04)', padding: '4px 10px',
														borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)',
													}}>
														{food}
													</span>
												))}
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* ─── TODAY'S INTAKE ─── */}
			<div style={{ display: 'grid', gridTemplateColumns: planCalculated && aiHistory.length > 0 ? '1fr 280px' : '1fr', gap: '24px' }}>
				<div>
					{/* Macro summary (today's eaten) */}
					{planCalculated && recommendation && (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
							{[
								{ label: 'Eaten', value: Math.round(totalCalories), target: Math.round(recommendation.dailyCalories), unit: 'kcal', color: '#e9feff' },
								{ label: 'Protein', value: Math.round(totalProtein), target: Math.round(recommendation.dailyProtein), unit: 'g', color: '#00dce5' },
								{ label: 'Carbs', value: Math.round(totalCarbs), target: Math.round(recommendation.dailyCarbs), unit: 'g', color: '#ff8a00' },
								{ label: 'Fats', value: Math.round(totalFats), target: Math.round(recommendation.dailyFats), unit: 'g', color: '#ddb7ff' },
							].map((s) => {
								const pct = s.target > 0 ? Math.min((s.value / s.target) * 100, 100) : 0;
								return (
									<div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{s.label}</span>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</span>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495' }}> / {s.target}{s.unit}</span>
										<div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
											<div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
										</div>
									</div>
								);
							})}
						</div>
					)}

					{!planCalculated && (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
							{[
								{ label: 'Calories', value: `${Math.round(totalCalories)}`, unit: 'kcal', color: '#e9feff' },
								{ label: 'Protein', value: `${Math.round(totalProtein)}g`, unit: '', color: '#00dce5' },
								{ label: 'Carbs', value: `${Math.round(totalCarbs)}g`, unit: '', color: '#ff8a00' },
								{ label: 'Fats', value: `${Math.round(totalFats)}g`, unit: '', color: '#ddb7ff' },
							].map((s) => (
								<div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>{s.label}</span>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</span>
									{s.unit && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', marginLeft: '4px' }}>{s.unit}</span>}
								</div>
							))}
						</div>
					)}

					{/* Add meal form */}
					{showAddMeal && (
						<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,220,229,0.3)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
							<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', fontWeight: 600, color: '#e5e2e3', marginBottom: '16px' }}>Log a Meal</h4>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
								<select value={newMeal.mealType} onChange={(e) => setNewMeal({ ...newMeal, mealType: e.target.value })} style={selectStyle}>
									{['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map((t) => <option key={t} value={t}>{t}</option>)}
								</select>
								<input placeholder="Meal name" value={newMeal.mealName} onChange={(e) => setNewMeal({ ...newMeal, mealName: e.target.value })} style={inputStyle} />
							</div>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
								{['calories', 'protein', 'carbs', 'fats'].map((f) => (
									<input key={f} type="number" placeholder={f} value={(newMeal as any)[f] || ''} onChange={(e) => setNewMeal({ ...newMeal, [f]: e.target.value })} style={{ ...inputStyle, fontFamily: 'JetBrains Mono', fontSize: '13px' }} />
								))}
							</div>
							<button onClick={addMealHandler} style={{ background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', padding: '12px 32px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Save Meal</button>
						</div>
					)}

					{/* Meal list */}
					<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 600, color: '#e5e2e3', marginBottom: '16px' }}>Recent Meals</h3>
					{mealsLoading ? (
						<Stack sx={{ py: 4, alignItems: 'center' }}><CircularProgress sx={{ color: '#00dce5' }} /></Stack>
					) : meals.length === 0 ? (
						<p style={{ color: '#9aabab', fontFamily: 'Hanken Grotesk', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>No meals logged yet. Start tracking!</p>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
							{meals.slice(0, 10).map((meal: any) => (
								<div key={meal._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
										{meal.mealImage && (
											<img src={`${REACT_APP_API_URL}/${meal.mealImage}`} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
										)}
										<div>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: mealTypeColors[meal.mealType] || '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>{meal.mealType}</span>
											<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', fontWeight: 600, color: '#e5e2e3' }}>{meal.mealName}</h4>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#9aabab' }}>{meal.protein}g P • {meal.calories} kcal</span>
										</div>
									</div>
									<button onClick={() => deleteMealHandler(meal._id)} style={{ background: 'transparent', border: 'none', color: '#9aabab', cursor: 'pointer', fontSize: '16px' }}>×</button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* AI Analysis History sidebar */}
				{aiHistory.length > 0 && (
					<div>
						<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
							<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e5e2e3', marginBottom: '12px' }}>AI Food Analysis</h4>
							{aiHistory.slice(0, 5).map((ai: any) => (
								<div key={ai._id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(58,73,74,0.3)' }}>
									<div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
										{ai.imageUrl && (
											<img src={`${REACT_APP_API_URL}/${ai.imageUrl}`} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
										)}
										<div style={{ flex: 1 }}>
											<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, color: '#e5e2e3', display: 'block', marginBottom: '2px' }}>{ai.foodName}</span>
											<div style={{ display: 'flex', gap: '8px' }}>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00dce5' }}>{Math.round(ai.estimatedCalories)} kcal</span>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab' }}>P:{Math.round(ai.protein)}g</span>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab' }}>C:{Math.round(ai.carbs)}g</span>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab' }}>F:{Math.round(ai.fats)}g</span>
											</div>
										</div>
									</div>
									<div style={{ display: 'flex', gap: '4px' }}>
										{(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map((type) => (
											<button key={type} onClick={async () => {
												try {
													if (!user?._id) throw new Error(Messages.error2);
													await addMealLog({
														variables: {
															input: {
																mealType: type, mealName: ai.foodName,
																calories: Math.round(ai.estimatedCalories),
																protein: Math.round(ai.protein),
																carbs: Math.round(ai.carbs),
																fats: Math.round(ai.fats),
																mealDate: new Date().toISOString(),
															},
														},
													});
													await mealsRefetch();
													await sweetMixinSuccessAlert(`Logged as ${type.toLowerCase()}!`);
												} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
											}} style={{
												flex: 1, padding: '4px', borderRadius: '5px', cursor: 'pointer',
												fontFamily: 'JetBrains Mono', fontSize: '8px', fontWeight: 600,
												background: 'transparent', border: `1px solid ${mealTypeColors[type]}25`,
												color: mealTypeColors[type], textTransform: 'uppercase',
											}}>
												{type.slice(0, 1)}
											</button>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default NutritionContent;

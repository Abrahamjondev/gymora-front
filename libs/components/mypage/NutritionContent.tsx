import React, { useEffect, useState } from 'react';
import { CircularProgress, Stack } from '@mui/material';
import { useLazyQuery, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../../apollo/store';
import { GET_MEAL_HISTORY, GET_NUTRITION_RECOMMENDATION, GET_AI_ANALYZE_HISTORY, GET_NUTRITION_HISTORY } from '../../../apollo/user/query';
import { ADD_MEAL_LOG, DELETE_MEAL_LOG, ANALYZE_FOOD_IMAGE } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { Messages, REACT_APP_API_URL, appLocale } from '../../config';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';

const mealTypeColors: Record<string, string> = {
	BREAKFAST: '#ff8a00',
	LUNCH: '#00dce5',
	DINNER: '#ddb7ff',
	SNACK: '#66daba',
};

const MACRO_FIELDS = ['calories', 'protein', 'carbs', 'fats'];

const inputStyle: React.CSSProperties = {
	padding: '13px 15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
	borderRadius: '11px', color: '#e9eeee', fontFamily: 'Hanken Grotesk', fontSize: '14px',
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

const NutritionContent = ({ view = 'plan' }: { view?: 'plan' | 'tracker' }) => {
	const { t } = useTranslation('mypage');
	const user = useReactiveVar(userVar);

	const defaultForm = { gender: 'MALE', age: '', heightCm: '', weightKg: '', activityLevel: 'MODERATELY_ACTIVE', goal: 'MAINTENANCE' };

	// Plan form + result are persisted PER USER — keys are namespaced with the
	// member id so plans never leak between accounts on the same browser.
	const formKey = user?._id ? `${STORAGE_KEY_FORM}_${user._id}` : null;
	const resultKey = user?._id ? `${STORAGE_KEY_RESULT}_${user._id}` : null;

	const [planForm, setPlanForm] = useState(defaultForm);
	const [recommendation, setRecommendation] = useState<any>(null);
	const [planCalculated, setPlanCalculated] = useState(false);
	const [storageReady, setStorageReady] = useState(false);

	// Restore this account's saved plan when the logged-in user is known/changes
	useEffect(() => {
		if (!formKey || !resultKey) return;
		const savedResult = loadSaved(resultKey, null);
		setPlanForm(loadSaved(formKey, defaultForm));
		setRecommendation(savedResult);
		setPlanCalculated(savedResult !== null);
		setStorageReady(true);
		// drop legacy global keys that leaked between accounts
		localStorage.removeItem(STORAGE_KEY_FORM);
		localStorage.removeItem(STORAGE_KEY_RESULT);
	}, [formKey]);

	// Persist form whenever it changes (after this user's data is loaded)
	useEffect(() => {
		if (!formKey || !storageReady) return;
		localStorage.setItem(formKey, JSON.stringify(planForm));
	}, [planForm, formKey, storageReady]);

	// Meals
	const [meals, setMeals] = useState<any[]>([]);
	const [showAddMeal, setShowAddMeal] = useState(false);
	const [newMeal, setNewMeal] = useState({ mealType: 'BREAKFAST', mealName: '', calories: 0, protein: 0, carbs: 0, fats: 0, mealDate: new Date().toISOString() });

	// AI history
	const [aiHistory, setAiHistory] = useState<any[]>([]);

	// Daily nutrition documents (kept in sync by backend on every meal log)
	const [nutritionHistory, setNutritionHistory] = useState<any[]>([]);
	const [historyPeriod, setHistoryPeriod] = useState<'WEEK' | 'MONTH' | 'YEAR'>('WEEK');

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
			if (rec && resultKey) localStorage.setItem(resultKey, JSON.stringify(rec));
		},
	});

	useQuery(GET_AI_ANALYZE_HISTORY, {
		fetchPolicy: 'network-only', skip: !user?._id,
		onCompleted: (d: T) => setAiHistory(d?.getAIAnalyzeHistory ?? []),
	});

	const { refetch: nutritionHistoryRefetch } = useQuery(GET_NUTRITION_HISTORY, {
		fetchPolicy: 'network-only', skip: !user?._id,
		onCompleted: (d: T) => setNutritionHistory(d?.getNutritionHistory ?? []),
	});

	const [addMealLog] = useMutation(ADD_MEAL_LOG);
	const [deleteMealLog] = useMutation(DELETE_MEAL_LOG);
	const [analyzeFoodImage] = useMutation(ANALYZE_FOOD_IMAGE);

	// refetch() alone doesn't reliably re-fire onCompleted — the lists must be
	// re-set manually from the refetch results or the UI only updates on reload.
	const reloadMeals = async () => {
		await mealsRefetch()
			.then(({ data }: any) => data?.getMealHistory && setMeals(data.getMealHistory))
			.catch(() => {});
		await nutritionHistoryRefetch()
			.then(({ data }: any) => data?.getNutritionHistory && setNutritionHistory(data.getNutritionHistory))
			.catch(() => {});
	};

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
			sweetMixinErrorAlert(err?.graphQLErrors?.[0]?.message || err.message || t('nutrition.alerts.analysisFailed')).then();
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
			await reloadMeals();
			await sweetMixinSuccessAlert(t('nutrition.alerts.loggedAs', { type: mealTypeLabels[mealType] || mealType }));
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
			sweetMixinErrorAlert(t('nutrition.alerts.fillBasics')).then();
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
		if (resultKey) localStorage.removeItem(resultKey);
	};

	const addMealHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!newMeal.mealName) throw new Error(t('nutrition.alerts.mealNameRequired'));
			await addMealLog({ variables: { input: { ...newMeal, calories: Number(newMeal.calories), protein: Number(newMeal.protein), carbs: Number(newMeal.carbs), fats: Number(newMeal.fats) } } });
			await reloadMeals();
			setShowAddMeal(false);
			setNewMeal({ mealType: 'BREAKFAST', mealName: '', calories: 0, protein: 0, carbs: 0, fats: 0, mealDate: new Date().toISOString() });
			await sweetMixinSuccessAlert(t('nutrition.alerts.mealLogged'));
		} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
	};

	const deleteMealHandler = async (id: string) => {
		if (!(await sweetConfirmAlert(t('nutrition.alerts.deleteMealConfirm')))) return;
		// Optimistically drop the row so the UI feels instant and stale rows can't
		// be deleted twice.
		setMeals((prev: any[]) => prev.filter((m: any) => m._id !== id));
		try {
			await deleteMealLog({ variables: { input: id }, context: { skipGlobalError: true } });
		} catch (err: any) {
			// Already gone (e.g. deleted in another tab / stale list) — treat as success
			const msg = err?.graphQLErrors?.[0]?.message || err?.message || '';
			if (!/not found|access denied/i.test(msg)) {
				sweetMixinErrorAlert(msg || t('nutrition.alerts.deleteMealFailed')).then();
			}
		}
		await reloadMeals();
	};

	// "Today's intake" must only count TODAY — getMealHistory returns the full history
	const todayStr = new Date().toDateString();
	const todayMeals = meals.filter((m: any) => m.mealDate && new Date(m.mealDate).toDateString() === todayStr);
	const totalCalories = todayMeals.reduce((a: number, m: any) => a + (m.calories || 0), 0);
	const totalProtein = todayMeals.reduce((a: number, m: any) => a + (m.protein || 0), 0);
	const totalCarbs = todayMeals.reduce((a: number, m: any) => a + (m.carbs || 0), 0);
	const totalFats = todayMeals.reduce((a: number, m: any) => a + (m.fats || 0), 0);

	// ── History aggregation: week = last 7 days (daily), month = last 30 days
	// (daily), year = last 12 months (monthly sums). All from real daily docs.
	const historyData = (() => {
		const docs = [...nutritionHistory].sort(
			(a, b) => new Date(a.nutritionDate).getTime() - new Date(b.nutritionDate).getTime(),
		);
		const now = new Date();
		if (historyPeriod === 'YEAR') {
			const buckets: Record<string, { label: string; calories: number; protein: number }> = {};
			for (let i = 11; i >= 0; i--) {
				const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
				const key = `${d.getFullYear()}-${d.getMonth()}`;
				buckets[key] = { label: d.toLocaleDateString(appLocale(), { month: 'short' }), calories: 0, protein: 0 };
			}
			docs.forEach((doc) => {
				const d = new Date(doc.nutritionDate);
				const key = `${d.getFullYear()}-${d.getMonth()}`;
				if (buckets[key]) {
					buckets[key].calories += doc.totalCalories || 0;
					buckets[key].protein += doc.totalProtein || 0;
				}
			});
			return Object.values(buckets);
		}
		const days = historyPeriod === 'WEEK' ? 7 : 30;
		const out: { label: string; calories: number; protein: number }[] = [];
		for (let i = days - 1; i >= 0; i--) {
			const d = new Date(now);
			d.setDate(now.getDate() - i);
			const doc = docs.find((x) => new Date(x.nutritionDate).toDateString() === d.toDateString());
			out.push({
				label: d.toLocaleDateString(appLocale(), historyPeriod === 'WEEK' ? { weekday: 'short' } : { day: 'numeric' }),
				calories: doc?.totalCalories || 0,
				protein: doc?.totalProtein || 0,
			});
		}
		return out;
	})();
	const historyMax = Math.max(1, ...historyData.map((d) => d.calories));
	const historyTotal = historyData.reduce((a, d) => a + d.calories, 0);
	const historyActiveDays = historyData.filter((d) => d.calories > 0).length;
	const historyAvg = historyActiveDays > 0 ? Math.round(historyTotal / historyActiveDays) : 0;

	const goalLabels: Record<string, string> = {
		WEIGHT_LOSS: t('nutrition.calc.goals.WEIGHT_LOSS'),
		MAINTENANCE: t('nutrition.calc.goals.MAINTENANCE'),
		MUSCLE_GAIN: t('nutrition.calc.goals.MUSCLE_GAIN'),
	};
	const activityLabels: Record<string, string> = {
		SEDENTARY: t('nutrition.calc.activity.SEDENTARY'), LIGHTLY_ACTIVE: t('nutrition.calc.activity.LIGHTLY_ACTIVE'),
		MODERATELY_ACTIVE: t('nutrition.calc.activity.MODERATELY_ACTIVE'), VERY_ACTIVE: t('nutrition.calc.activity.VERY_ACTIVE'), EXTRA_ACTIVE: t('nutrition.calc.activity.EXTRA_ACTIVE'),
	};
	const mealTypeLabels: Record<string, string> = {
		BREAKFAST: t('nutrition.mealTypes.BREAKFAST'),
		LUNCH: t('nutrition.mealTypes.LUNCH'),
		DINNER: t('nutrition.mealTypes.DINNER'),
		SNACK: t('nutrition.mealTypes.SNACK'),
	};

	// Stat card definitions are built OUTSIDE the JSX below (display data only)
	const scanStats = scanResult
		? [
				{ label: t('nutrition.macros.calories'), value: Math.round(scanResult.estimatedCalories), unit: t('nutrition.units.kcal'), color: '#e9feff' },
				{ label: t('nutrition.macros.protein'), value: `${Math.round(scanResult.protein)}${t('nutrition.units.g')}`, unit: '', color: '#00dce5' },
				{ label: t('nutrition.macros.carbs'), value: `${Math.round(scanResult.carbs)}${t('nutrition.units.g')}`, unit: '', color: '#ff8a00' },
				{ label: t('nutrition.macros.fats'), value: `${Math.round(scanResult.fats)}${t('nutrition.units.g')}`, unit: '', color: '#ddb7ff' },
		  ]
		: [];
	const planStats = recommendation
		? [
				{ label: t('nutrition.results.dailyCalories'), value: Math.round(recommendation.dailyCalories), unit: t('nutrition.units.kcal'), color: '#e9feff' },
				{ label: t('nutrition.macros.protein'), value: `${Math.round(recommendation.dailyProtein)}${t('nutrition.units.g')}`, unit: t('nutrition.units.perDay'), color: '#00dce5' },
				{ label: t('nutrition.macros.carbs'), value: `${Math.round(recommendation.dailyCarbs)}${t('nutrition.units.g')}`, unit: t('nutrition.units.perDay'), color: '#ff8a00' },
				{ label: t('nutrition.macros.fats'), value: `${Math.round(recommendation.dailyFats)}${t('nutrition.units.g')}`, unit: t('nutrition.units.perDay'), color: '#ddb7ff' },
		  ]
		: [];
	const bodyMetricStats = recommendation
		? [
				{ label: t('nutrition.results.bmi'), value: recommendation.bmi?.toFixed(1), sub: recommendation.bmiCategory },
				{ label: t('nutrition.results.bmr'), value: `${Math.round(recommendation.bmr)}`, sub: t('nutrition.units.kcalPerDay') },
				{ label: t('nutrition.results.tdee'), value: `${Math.round(recommendation.tdee)}`, sub: t('nutrition.units.kcalPerDay') },
				{ label: t('nutrition.results.goal'), value: goalLabels[recommendation.goal] || recommendation.goal, sub: t('nutrition.results.mealsPerDay', { n: recommendation.mealsPerDay }) },
		  ]
		: [];
	const eatenStats = recommendation
		? [
				{ label: t('nutrition.tracker.eaten'), value: Math.round(totalCalories), target: Math.round(recommendation.dailyCalories), unit: t('nutrition.units.kcal'), color: '#e9feff' },
				{ label: t('nutrition.macros.protein'), value: Math.round(totalProtein), target: Math.round(recommendation.dailyProtein), unit: t('nutrition.units.g'), color: '#00dce5' },
				{ label: t('nutrition.macros.carbs'), value: Math.round(totalCarbs), target: Math.round(recommendation.dailyCarbs), unit: t('nutrition.units.g'), color: '#ff8a00' },
				{ label: t('nutrition.macros.fats'), value: Math.round(totalFats), target: Math.round(recommendation.dailyFats), unit: t('nutrition.units.g'), color: '#ddb7ff' },
		  ]
		: [];
	const todayStats = [
		{ label: t('nutrition.macros.calories'), value: `${Math.round(totalCalories)}`, unit: t('nutrition.units.kcal'), color: '#e9feff' },
		{ label: t('nutrition.macros.protein'), value: `${Math.round(totalProtein)}${t('nutrition.units.g')}`, unit: '', color: '#00dce5' },
		{ label: t('nutrition.macros.carbs'), value: `${Math.round(totalCarbs)}${t('nutrition.units.g')}`, unit: '', color: '#ff8a00' },
		{ label: t('nutrition.macros.fats'), value: `${Math.round(totalFats)}${t('nutrition.units.g')}`, unit: '', color: '#ddb7ff' },
	];

	return (
		<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
			{/* Header */}
			<div className="nt-head">
				<div>
					<span className="lp-eyebrow lp-eyebrow--orange" style={{ marginBottom: '6px' }}>
						{view === 'plan' ? (planCalculated ? t('nutrition.eyebrowYourPlan') : t('nutrition.eyebrowPlan')) : t('nutrition.eyebrowTracker')}
					</span>
					<h2>{view === 'plan' ? t('nutrition.planTitle') : t('nutrition.trackerTitle')}</h2>
				</div>
				<div className="nt-tools">
					{view === 'plan' && planCalculated && (
						<button className="nt-markall" onClick={resetPlan}>
							{t('nutrition.recalculate')}
						</button>
					)}
					{view === 'tracker' && (
						<>
							<button className="nm-scan-btn" onClick={() => fileInputRef.current?.click()} disabled={scanning}>
								<span className="nm-scan-dot" />
								{scanning ? t('nutrition.scanning') : t('nutrition.scanFood')}
							</button>
							<input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
								onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScanFood(f); }} />
							<button className="wd-btn" style={{ padding: '11px 20px', fontSize: '13.5px' }} onClick={() => setShowAddMeal(!showAddMeal)}>
								{t('nutrition.logMealBtn')}
							</button>
						</>
					)}
				</div>
			</div>

			{/* ─── AI SCAN RESULT (tracker) ─── */}
			{view === 'tracker' && (scanning || scanResult) && (
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
								<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e9feff', marginBottom: '6px' }}>{t('nutrition.analyzing')}</h4>
								<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: '#9aabab' }}>{t('nutrition.analyzingSub')}</p>
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
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#66daba', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>{t('nutrition.aiDetected')}</span>
										<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 700, color: '#e9feff' }}>{scanResult.foodName}</h3>
									</div>
								</div>
								<button onClick={clearScan} style={{ background: 'transparent', border: 'none', color: '#9aabab', cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}>×</button>
							</div>

							{/* Nutrition breakdown */}
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
								{scanStats.map((s) => (
									<div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: '#9aabab', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{s.label}</span>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</span>
										{s.unit && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', marginLeft: '2px' }}>{s.unit}</span>}
									</div>
								))}
							</div>

							{/* Log as meal buttons */}
							<div>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '10px' }}>{t('nutrition.logAs')}</span>
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
											{mealTypeLabels[type]}
										</button>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* ─── NUTRITION PLAN FORM (plan) ─── */}
			{view === 'plan' && !planCalculated && (
				<div style={{
					background: 'linear-gradient(135deg, rgba(255,138,0,0.04), rgba(0,220,229,0.03))',
					border: '1px solid rgba(255,138,0,0.12)', borderRadius: '16px',
					padding: '32px', marginBottom: '32px',
				}}>
					<div style={{ marginBottom: '24px' }}>
						<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 700, color: '#e9feff', marginBottom: '6px' }}>
							{t('nutrition.calc.title')}
						</h3>
						<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#9aabab' }}>
							{t('nutrition.calc.subtitle')}
						</p>
					</div>

					{/* Row 1: Gender + Age */}
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
						<div>
							<span style={labelStyle}>{t('nutrition.calc.gender')}</span>
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
										{g === 'MALE' ? t('nutrition.calc.male') : t('nutrition.calc.female')}
									</button>
								))}
							</div>
						</div>
						<div>
							<span style={labelStyle}>{t('nutrition.calc.age')}</span>
							<input type="number" placeholder={t('nutrition.calc.agePlaceholder')} value={planForm.age}
								onChange={(e) => setPlanForm({ ...planForm, age: e.target.value })} style={inputStyle} />
						</div>
					</div>

					{/* Row 2: Height + Weight */}
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
						<div>
							<span style={labelStyle}>{t('nutrition.calc.height')}</span>
							<input type="number" placeholder={t('nutrition.calc.heightPlaceholder')} value={planForm.heightCm}
								onChange={(e) => setPlanForm({ ...planForm, heightCm: e.target.value })} style={inputStyle} />
						</div>
						<div>
							<span style={labelStyle}>{t('nutrition.calc.weight')}</span>
							<input type="number" placeholder={t('nutrition.calc.weightPlaceholder')} value={planForm.weightKg}
								onChange={(e) => setPlanForm({ ...planForm, weightKg: e.target.value })} style={inputStyle} />
						</div>
					</div>

					{/* Row 3: Activity Level */}
					<div style={{ marginBottom: '16px' }}>
						<span style={labelStyle}>{t('nutrition.calc.activityLevel')}</span>
						<select value={planForm.activityLevel}
							onChange={(e) => setPlanForm({ ...planForm, activityLevel: e.target.value })} style={selectStyle}>
							{Object.entries(activityLabels).map(([val, label]) => (
								<option key={val} value={val}>{label}</option>
							))}
						</select>
					</div>

					{/* Row 4: Goal */}
					<div style={{ marginBottom: '24px' }}>
						<span style={labelStyle}>{t('nutrition.calc.goal')}</span>
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
						{recLoading ? t('nutrition.calc.calculating') : t('nutrition.calc.calculate')}
					</button>
				</div>
			)}

			{/* ─── RESULTS (plan) ─── */}
			{view === 'plan' && planCalculated && recommendation && (
				<div style={{ marginBottom: '32px' }}>
					{/* Overview cards */}
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
						{planStats.map((s) => (
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
							<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e9feff', marginBottom: '16px' }}>{t('nutrition.results.bodyMetrics')}</h4>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
								{bodyMetricStats.map((s) => (
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
								<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e9feff', marginBottom: '16px' }}>{t('nutrition.results.tips')}</h4>
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
							<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e9feff', marginBottom: '16px' }}>{t('nutrition.results.suggestedMealPlan')}</h4>
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
												{mealTypeLabels[meal.mealType] || meal.mealType}
											</span>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495' }}>
												{t('nutrition.units.kcalValue', { n: Math.round(meal.targetCalories) })}
											</span>
										</div>
										<div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00dce5' }}>{t('nutrition.macroShort.protein', { n: Math.round(meal.targetProtein) })}</span>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#ff8a00' }}>{t('nutrition.macroShort.carbs', { n: Math.round(meal.targetCarbs) })}</span>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#ddb7ff' }}>{t('nutrition.macroShort.fats', { n: Math.round(meal.targetFats) })}</span>
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

			{/* ─── TODAY'S INTAKE + HISTORY + MEALS (tracker) ─── */}
			{view === 'tracker' && (
			<div style={{ display: 'grid', gridTemplateColumns: planCalculated && aiHistory.length > 0 ? '1fr 280px' : '1fr', gap: '24px' }}>
				<div>
					{/* Macro summary (today's eaten) */}
					{planCalculated && recommendation && (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
							{eatenStats.map((s) => {
								const pct = s.target > 0 ? Math.min((s.value / s.target) * 100, 100) : 0;
								return (
									<div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{s.label}</span>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</span>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495' }}> / {s.target}{s.unit}</span>
										<div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
											<div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${s.color}99, ${s.color})`, borderRadius: '3px', transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)', boxShadow: `0 0 8px ${s.color}40` }} />
										</div>
									</div>
								);
							})}
						</div>
					)}

					{!planCalculated && (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
							{todayStats.map((s) => (
								<div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>{s.label}</span>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</span>
									{s.unit && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', marginLeft: '4px' }}>{s.unit}</span>}
								</div>
							))}
						</div>
					)}

					{/* ─── NUTRITION HISTORY (week / month / year) ─── */}
				{nutritionHistory.length > 0 && (
					<div className="pg-chart" style={{ marginBottom: '24px' }}>
						<div className="pg-chart-head" style={{ alignItems: 'center' }}>
							<span>{t('nutrition.history.title')}</span>
							<div className="wl-seg" style={{ padding: '2px' }}>
								{(['WEEK', 'MONTH', 'YEAR'] as const).map((p) => (
									<button
										key={p}
										className={historyPeriod === p ? 'is-active' : ''}
										style={{ padding: '6px 13px', fontSize: '11.5px' }}
										onClick={() => setHistoryPeriod(p)}
									>
										{p === 'WEEK' ? t('nutrition.history.week') : p === 'MONTH' ? t('nutrition.history.month') : t('nutrition.history.year')}
									</button>
								))}
							</div>
						</div>

						{/* Bar chart */}
						<div style={{ display: 'flex', alignItems: 'flex-end', gap: historyPeriod === 'MONTH' ? '3px' : '6px', height: '110px', marginTop: '14px' }}>
							{historyData.map((d, i) => {
								const h = Math.max(d.calories > 0 ? 6 : 2, Math.round((d.calories / historyMax) * 100));
								const isToday = historyPeriod !== 'YEAR' && i === historyData.length - 1;
								return (
									<div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: 0 }} title={t('nutrition.history.barTitle', { label: d.label, n: Math.round(d.calories) })}>
										<div
											style={{
												width: '100%',
												maxWidth: '26px',
												height: `${h}%`,
												borderRadius: '4px 4px 2px 2px',
												background: d.calories > 0
													? isToday
														? 'linear-gradient(180deg, #00dce5, rgba(0,220,229,0.4))'
														: 'linear-gradient(180deg, rgba(0,220,229,0.55), rgba(0,220,229,0.15))'
													: 'rgba(255,255,255,0.06)',
												boxShadow: isToday && d.calories > 0 ? '0 0 10px rgba(0,220,229,0.4)' : 'none',
												transition: 'height 0.5s cubic-bezier(0.22,1,0.36,1)',
											}}
										/>
										{(historyPeriod !== 'MONTH' || i % 5 === 0) && (
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '8px', color: 'rgba(185,202,202,0.45)', whiteSpace: 'nowrap' }}>{d.label}</span>
										)}
									</div>
								);
							})}
						</div>

						{/* Period summary */}
						<div style={{ display: 'flex', gap: '22px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
							<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'rgba(213,226,226,0.75)' }}>
								<b style={{ color: '#ffffff' }}>{Math.round(historyTotal).toLocaleString()}</b> {t('nutrition.history.kcalTotal')}
							</span>
							<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'rgba(213,226,226,0.75)' }}>
								<b style={{ color: '#00dce5' }}>{historyAvg.toLocaleString()}</b> {t('nutrition.history.avgPerActiveDay')}
							</span>
							<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'rgba(213,226,226,0.75)' }}>
								<b style={{ color: '#66daba' }}>{historyActiveDays}</b> {historyPeriod === 'YEAR' ? t('nutrition.history.activeMonths') : t('nutrition.history.daysLogged')}
							</span>
						</div>
					</div>
				)}

				{/* Add meal form */}
					{showAddMeal && (
						<div className="wd-form-card" style={{ borderColor: 'rgba(0,220,229,0.25)' }}>
							<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '17px', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>{t('nutrition.form.title')}</h4>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
								<select value={newMeal.mealType} onChange={(e) => setNewMeal({ ...newMeal, mealType: e.target.value })} style={selectStyle}>
									{['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map((mt) => <option key={mt} value={mt}>{mealTypeLabels[mt]}</option>)}
								</select>
								<input placeholder={t('nutrition.form.mealNamePlaceholder')} value={newMeal.mealName} onChange={(e) => setNewMeal({ ...newMeal, mealName: e.target.value })} style={inputStyle} />
							</div>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
								{MACRO_FIELDS.map((f) => (
									<input key={f} type="number" placeholder={t(`nutrition.macros.${f}`)} value={(newMeal as any)[f] || ''} onChange={(e) => setNewMeal({ ...newMeal, [f]: e.target.value })} style={{ ...inputStyle, fontFamily: 'JetBrains Mono', fontSize: '13px' }} />
								))}
							</div>
							<button className="wd-btn" onClick={addMealHandler}>{t('nutrition.form.save')}</button>
						</div>
					)}

					{/* Meal list */}
					<div className="wd-section-head" style={{ marginBottom: '14px' }}>
						<h3 style={{ fontSize: '20px' }}>{t('nutrition.recentMeals')}</h3>
						<span className="wd-section-count">{meals.length === 1 ? t('nutrition.loggedCountOne', { count: meals.length }) : t('nutrition.loggedCount', { count: meals.length })}</span>
					</div>
					{mealsLoading ? (
						<Stack sx={{ py: 4, alignItems: 'center' }}><CircularProgress sx={{ color: '#00dce5' }} /></Stack>
					) : meals.length === 0 ? (
						<div className="nt-empty" style={{ padding: '40px 0' }}>
							<div className="nt-empty-ic">◑</div>
							<h4>{t('nutrition.emptyTitle')}</h4>
							<p>{t('nutrition.emptyDesc')}</p>
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
							{meals.slice(0, 10).map((meal: any) => (
								<div key={meal._id} className="nm-row">
									<div style={{ display: 'flex', alignItems: 'center', gap: '13px', minWidth: 0 }}>
										{meal.mealImage && (
											<img src={`${REACT_APP_API_URL}/${meal.mealImage}`} alt="" style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }} />
										)}
										<div style={{ minWidth: 0 }}>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '9.5px', fontWeight: 700, color: mealTypeColors[meal.mealType] || '#849495', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '3px' }}>{mealTypeLabels[meal.mealType] || meal.mealType}</span>
											<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meal.mealName}</h4>
										</div>
									</div>
									<div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'rgba(213,226,226,0.75)' }}>
											<b style={{ color: '#ffffff' }}>{meal.calories}</b> {t('nutrition.units.kcal')} · {t('nutrition.units.proteinGrams', { n: meal.protein })}
										</span>
										<button className="nm-del" onClick={() => deleteMealHandler(meal._id)}>✕</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* AI Analysis History sidebar */}
				{aiHistory.length > 0 && (
					<div>
						<div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(102,218,186,0.15)', borderRadius: '16px', padding: '22px', position: 'sticky', top: '86px' }}>
							<h4 style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(102,218,186,0.8)', marginBottom: '14px' }}>{t('nutrition.aiHistoryTitle')}</h4>
							{aiHistory.slice(0, 5).map((ai: any) => (
								<div key={ai._id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(58,73,74,0.3)' }}>
									<div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
										{ai.imageUrl && (
											<img src={`${REACT_APP_API_URL}/${ai.imageUrl}`} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
										)}
										<div style={{ flex: 1 }}>
											<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, color: '#e5e2e3', display: 'block', marginBottom: '2px' }}>{ai.foodName}</span>
											<div style={{ display: 'flex', gap: '8px' }}>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00dce5' }}>{t('nutrition.units.kcalValue', { n: Math.round(ai.estimatedCalories) })}</span>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab' }}>{t('nutrition.macroShort.protein', { n: Math.round(ai.protein) })}</span>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab' }}>{t('nutrition.macroShort.carbs', { n: Math.round(ai.carbs) })}</span>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#9aabab' }}>{t('nutrition.macroShort.fats', { n: Math.round(ai.fats) })}</span>
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
													await reloadMeals();
													await sweetMixinSuccessAlert(t('nutrition.alerts.loggedAs', { type: mealTypeLabels[type] }));
												} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
											}} style={{
												flex: 1, padding: '4px', borderRadius: '5px', cursor: 'pointer',
												fontFamily: 'JetBrains Mono', fontSize: '8px', fontWeight: 600,
												background: 'transparent', border: `1px solid ${mealTypeColors[type]}25`,
												color: mealTypeColors[type], textTransform: 'uppercase',
											}}>
												{mealTypeLabels[type].slice(0, 1)}
											</button>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
			)}
		</div>
	);
};

export default NutritionContent;

import React, { useState } from 'react';
import { NextPage } from 'next';
import { CircularProgress, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { GET_MEAL_HISTORY, GET_NUTRITION_RECOMMENDATION, GET_AI_ANALYZE_HISTORY } from '../../apollo/user/query';
import { ADD_MEAL_LOG, DELETE_MEAL_LOG } from '../../apollo/user/mutation';
import { T } from '../../libs/types/common';
import { Messages, REACT_APP_API_URL } from '../../libs/config';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const mealTypeColors: Record<string, string> = {
	BREAKFAST: '#ff8a00',
	LUNCH: '#00dce5',
	DINNER: '#ddb7ff',
	SNACK: '#66daba',
};

const NutritionPage: NextPage = () => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const [meals, setMeals] = useState<any[]>([]);
	const [recommendation, setRecommendation] = useState<any>(null);
	const [showAddMeal, setShowAddMeal] = useState(false);
	const [newMeal, setNewMeal] = useState({ mealType: 'BREAKFAST', mealName: '', calories: 0, protein: 0, carbs: 0, fats: 0, mealDate: new Date().toISOString() });

	/** APOLLO **/
	const { loading: mealsLoading, refetch: mealsRefetch } = useQuery(GET_MEAL_HISTORY, {
		fetchPolicy: 'network-only',
		skip: !user?._id,
		onCompleted: (data: T) => setMeals(data?.getMealHistory ?? []),
	});

	const { loading: recLoading } = useQuery(GET_NUTRITION_RECOMMENDATION, {
		fetchPolicy: 'cache-and-network',
		skip: !user?._id,
		variables: { input: { gender: 'MALE', age: 25, heightCm: 175, weightKg: 75, activityLevel: 'MODERATELY_ACTIVE', goal: 'MAINTENANCE' } },
		onCompleted: (data: T) => setRecommendation(data?.getNutritionRecommendation),
	});

	const [aiHistory, setAiHistory] = useState<any[]>([]);

	useQuery(GET_AI_ANALYZE_HISTORY, {
		fetchPolicy: 'network-only',
		skip: !user?._id,
		onCompleted: (d: T) => setAiHistory(d?.getAIAnalyzeHistory ?? []),
	});

	const [addMealLog] = useMutation(ADD_MEAL_LOG);
	const [deleteMealLog] = useMutation(DELETE_MEAL_LOG);

	const addMealHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!newMeal.mealName) throw new Error('Meal name required');
			await addMealLog({ variables: { input: { ...newMeal, calories: Number(newMeal.calories), protein: Number(newMeal.protein), carbs: Number(newMeal.carbs), fats: Number(newMeal.fats) } } });
			await mealsRefetch();
			setShowAddMeal(false);
			setNewMeal({ mealType: 'BREAKFAST', mealName: '', calories: 0, protein: 0, carbs: 0, fats: 0, mealDate: new Date().toISOString() });
			await sweetMixinSuccessAlert('Meal logged!');
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const deleteMealHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Delete this meal?')) {
				await deleteMealLog({ variables: { input: id } });
				await mealsRefetch();
			}
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const totalCalories = meals.reduce((a: number, m: any) => a + (m.calories || 0), 0);
	const totalProtein = meals.reduce((a: number, m: any) => a + (m.protein || 0), 0);
	const totalCarbs = meals.reduce((a: number, m: any) => a + (m.carbs || 0), 0);
	const totalFats = meals.reduce((a: number, m: any) => a + (m.fats || 0), 0);

	if (!user?._id) {
		return (
			<div style={{ background: '#131314', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<p style={{ color: '#b9caca', fontFamily: 'Hanken Grotesk', fontSize: '18px' }}>Please login to access nutrition tracking.</p>
			</div>
		);
	}

	if (device === 'mobile') return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>GYMORA NUTRITION MOBILE</div>;

	return (
		<div style={{ background: '#131314', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
				{/* Header */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
					<div>
						<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#ff8a00', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Daily Overview</span>
						<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '40px', fontWeight: 800, color: '#e5e2e3' }}>Nutrition Dashboard</h2>
					</div>
					<button onClick={() => setShowAddMeal(!showAddMeal)} style={{ background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
						+ Log Meal
					</button>
				</div>

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
					{/* Left */}
					<div>
						{/* Macro summary */}
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
							{[
								{ label: 'Calories', value: `${Math.round(totalCalories)}`, unit: 'kcal', color: '#e9feff' },
								{ label: 'Protein', value: `${Math.round(totalProtein)}g`, unit: `/ ${recommendation?.dailyProtein ? Math.round(recommendation.dailyProtein) + 'g' : '—'}`, color: '#00dce5' },
								{ label: 'Carbs', value: `${Math.round(totalCarbs)}g`, unit: `/ ${recommendation?.dailyCarbs ? Math.round(recommendation.dailyCarbs) + 'g' : '—'}`, color: '#ff8a00' },
								{ label: 'Fats', value: `${Math.round(totalFats)}g`, unit: `/ ${recommendation?.dailyFats ? Math.round(recommendation.dailyFats) + 'g' : '—'}`, color: '#ddb7ff' },
							].map((s) => (
								<div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>{s.label}</span>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</span>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495', marginLeft: '4px' }}>{s.unit}</span>
								</div>
							))}
						</div>

						{/* Add meal form */}
						{showAddMeal && (
							<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,220,229,0.3)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
								<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', fontWeight: 600, color: '#e5e2e3', marginBottom: '16px' }}>Log a Meal</h4>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
									<select value={newMeal.mealType} onChange={(e) => setNewMeal({ ...newMeal, mealType: e.target.value })} style={{ padding: '12px', background: '#201f20', border: '1px solid #3a494a', borderRadius: '8px', color: '#e5e2e3', fontFamily: 'Hanken Grotesk', fontSize: '14px' }}>
										{['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map((t) => <option key={t} value={t}>{t}</option>)}
									</select>
									<input placeholder="Meal name" value={newMeal.mealName} onChange={(e) => setNewMeal({ ...newMeal, mealName: e.target.value })} style={{ padding: '12px', background: '#201f20', border: '1px solid #3a494a', borderRadius: '8px', color: '#e5e2e3', fontFamily: 'Hanken Grotesk', fontSize: '14px', outline: 'none' }} />
								</div>
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
									{['calories', 'protein', 'carbs', 'fats'].map((f) => (
										<input key={f} type="number" placeholder={f} value={(newMeal as any)[f] || ''} onChange={(e) => setNewMeal({ ...newMeal, [f]: e.target.value })} style={{ padding: '12px', background: '#201f20', border: '1px solid #3a494a', borderRadius: '8px', color: '#e5e2e3', fontFamily: 'JetBrains Mono', fontSize: '13px', outline: 'none' }} />
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
							<p style={{ color: '#849495', fontFamily: 'Hanken Grotesk', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>No meals logged yet. Start tracking!</p>
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
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>{meal.protein}g P • {meal.calories} kcal</span>
											</div>
										</div>
										<button onClick={() => deleteMealHandler(meal._id)} style={{ background: 'transparent', border: 'none', color: '#849495', cursor: 'pointer', fontSize: '16px' }}>×</button>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Right sidebar — Recommendation */}
					<div>
						{recommendation && (
							<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
								<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Your Recommendation</h4>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
									{[
										{ label: 'BMI', value: recommendation.bmi?.toFixed(1) },
										{ label: 'BMR', value: `${Math.round(recommendation.bmr)}` },
										{ label: 'TDEE', value: `${Math.round(recommendation.tdee)}` },
										{ label: 'Goal', value: recommendation.goal?.replace('_', ' ') },
									].map((s) => (
										<div key={s.label}>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{s.label}</span>
											<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', fontWeight: 700, color: '#e9feff' }}>{s.value}</span>
										</div>
									))}
								</div>
								<p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495', marginBottom: '8px' }}>Category: {recommendation.bmiCategory}</p>
							</div>
						)}

						{recommendation?.tips && recommendation.tips.length > 0 && (
							<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
								<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e5e2e3', marginBottom: '12px' }}>Tips</h4>
								{recommendation.tips.map((tip: string, i: number) => (
									<div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
										<span style={{ color: '#00dce5', fontSize: '12px' }}>✓</span>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: '#b9caca', lineHeight: '18px' }}>{tip}</span>
									</div>
								))}
							</div>
						)}
						{/* AI Analysis History */}
						{aiHistory.length > 0 && (
							<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', marginTop: '20px' }}>
								<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e5e2e3', marginBottom: '12px' }}>AI Food Analysis</h4>
								{aiHistory.slice(0, 5).map((ai: any) => (
									<div key={ai._id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(58,73,74,0.3)' }}>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, color: '#e5e2e3', display: 'block', marginBottom: '4px' }}>{ai.foodName}</span>
										<div style={{ display: 'flex', gap: '10px' }}>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00dce5' }}>{Math.round(ai.estimatedCalories)} kcal</span>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495' }}>P:{Math.round(ai.protein)}g</span>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495' }}>C:{Math.round(ai.carbs)}g</span>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495' }}>F:{Math.round(ai.fats)}g</span>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(NutritionPage);

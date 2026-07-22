import React from 'react';
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';

export interface FilterSelectOption {
	value: string;
	label: string;
}

interface FilterSelectProps {
	value: string;
	options: FilterSelectOption[];
	ariaLabel: string;
	onChange: (value: string) => void;
}

const FilterSelect = ({ value, options, ariaLabel, onChange }: FilterSelectProps) => {
	const handleChange = (event: SelectChangeEvent<string>) => onChange(event.target.value);

	return (
		<Select
			value={value}
			onChange={handleChange}
			size="small"
			variant="outlined"
			inputProps={{ 'aria-label': ariaLabel }}
			MenuProps={{
				PaperProps: {
					sx: {
						mt: 1,
						background: '#17191a',
						border: '1px solid rgba(0, 220, 229, 0.18)',
						borderRadius: '12px',
						boxShadow: '0 18px 44px rgba(0, 0, 0, 0.48)',
						'& .MuiMenuItem-root': {
							minHeight: '42px',
							color: '#d9e5e5',
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontSize: '13px',
							fontWeight: 600,
							'&:hover': { background: 'rgba(0, 220, 229, 0.08)' },
							'&.Mui-selected': {
								background: 'rgba(0, 220, 229, 0.14)',
								color: '#00eaf4',
							},
							'&.Mui-selected:hover': { background: 'rgba(0, 220, 229, 0.19)' },
						},
					},
				},
			}}
			sx={{
				width: { xs: '100%', sm: 'auto' },
				minWidth: { xs: '100%', sm: 184 },
				borderRadius: '11px',
				background: 'linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018))',
				color: '#e9eeee',
				fontFamily: 'Hanken Grotesk, sans-serif',
				fontSize: '13.5px',
				fontWeight: 700,
				'& .MuiSelect-select': { padding: '12px 42px 12px 16px' },
				'& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
				'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,220,229,0.38)' },
				'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
					borderColor: '#00dce5',
					boxShadow: '0 0 0 3px rgba(0,220,229,0.1)',
				},
				'& .MuiSelect-icon': { color: '#849495', right: '12px' },
			}}
		>
			{options.map((option) => (
				<MenuItem key={option.value} value={option.value}>
					{option.label}
				</MenuItem>
			))}
		</Select>
	);
};

export default FilterSelect;

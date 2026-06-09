import { TrainerVerificationStatus } from '../../enums/trainer.enum';
import { Direction } from '../../enums/common.enum';

export interface TrainerInput {
	memberId?: string;
	trainerBio: string;
	trainerSpecializations?: string[];
	trainerExperience?: number;
	trainerSocialLinks?: string[];
	trainerVerificationStatus?: TrainerVerificationStatus;
}

export interface TrainerUpdate {
	_id: string;
	trainerBio?: string;
	trainerSpecializations?: string[];
	trainerExperience?: number;
	trainerSocialLinks?: string[];
	trainerVerificationStatus?: TrainerVerificationStatus;
}

interface TrainersSearch {
	text?: string;
}

export interface TrainersListInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: TrainersSearch;
}

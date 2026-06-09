import { TrainerVerificationStatus } from '../../enums/trainer.enum';
import { MeLiked } from '../common';

export interface Trainer {
	_id: string;
	memberId: string;
	trainerBio: string;
	trainerSpecializations: string[];
	trainerExperience: number;
	trainerRating: number;
	trainerRatingCount?: number;
	trainerSocialLinks: string[];
	trainerVerificationStatus: TrainerVerificationStatus;
	trainerRank?: number;
	meLiked?: MeLiked[];
	createdAt: Date;
	updatedAt: Date;
}

export interface TrainerCounter {
	total: number;
}

export interface Trainers {
	list: Trainer[];
	metaCounter: TrainerCounter[];
}

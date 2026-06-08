export enum PaymentStatus {
	PENDING = 'PENDING',
	PAID = 'PAID',
	FAILED = 'FAILED',
	REFUNDED = 'REFUNDED',
}

export enum PaymentProvider {
	STRIPE = 'STRIPE',
	PAYME = 'PAYME',
}

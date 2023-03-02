function checkEquality(a: any, b: any) {
	return Object.is(JSON.stringify(a), JSON.stringify(b));
}

export type EqualityCheck = (a: any, b: any) => boolean;

export const isEqual: EqualityCheck = checkEquality;

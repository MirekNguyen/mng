const SHORTS_MAX_SECONDS = 60;
const VOD_MIN_SECONDS = 180 * 60;

export const isShort = (durationSeconds: number): boolean =>
	durationSeconds > 0 && durationSeconds <= SHORTS_MAX_SECONDS;

export const isVod = (durationSeconds: number): boolean =>
	durationSeconds >= VOD_MIN_SECONDS;

export const isRegularVideo = (durationSeconds: number): boolean =>
	!isShort(durationSeconds) && !isVod(durationSeconds);

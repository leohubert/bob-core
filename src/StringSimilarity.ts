export interface SimilarityResult {
	rating: number;
	target: string;
}

export interface BestMatchResult {
	bestMatch: SimilarityResult;
	bestMatchIndex: number;
	ratings: SimilarityResult[];
}

const PREFIX_SCALE = 0.1;
const PREFIX_MAX = 4;
const LENGTH_GUARD_RATIO = 0.5;

/**
 * String similarity calculator using the Jaro-Winkler distance.
 *
 * Jaro-Winkler favors strings that share a common prefix, which matches the
 * shape of CLI typos ("migrat" → "migrate", "user:lis" → "user:list") better
 * than bigram-based metrics like Dice's Coefficient.
 */
export class StringSimilarity {
	/**
	 * Calculate Jaro-Winkler similarity between two strings (0-1 scale).
	 *
	 * A length-ratio guard scales the score down when the inputs differ
	 * significantly in length, so that a short query cannot incidentally match
	 * a much longer candidate just because a few characters line up.
	 */
	calculateSimilarity(str1: string, str2: string): number {
		if (str1 === str2) return 1;

		const a = str1.toLowerCase();
		const b = str2.toLowerCase();
		if (a === b) return 1;
		if (a.length === 0 || b.length === 0) return 0;

		const jaro = this.jaro(a, b);
		if (jaro === 0) return 0;

		let prefix = 0;
		const maxPrefix = Math.min(PREFIX_MAX, a.length, b.length);
		while (prefix < maxPrefix && a[prefix] === b[prefix]) prefix++;

		const jaroWinkler = jaro + prefix * PREFIX_SCALE * (1 - jaro);

		const ratio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
		const lengthPenalty = ratio < LENGTH_GUARD_RATIO ? ratio / LENGTH_GUARD_RATIO : 1;

		return jaroWinkler * lengthPenalty;
	}

	private jaro(a: string, b: string): number {
		const matchWindow = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
		const aMatches = new Array<boolean>(a.length).fill(false);
		const bMatches = new Array<boolean>(b.length).fill(false);

		let matches = 0;
		for (let i = 0; i < a.length; i++) {
			const start = Math.max(0, i - matchWindow);
			const end = Math.min(i + matchWindow + 1, b.length);
			for (let j = start; j < end; j++) {
				if (bMatches[j]) continue;
				if (a[i] !== b[j]) continue;
				aMatches[i] = true;
				bMatches[j] = true;
				matches++;
				break;
			}
		}

		if (matches === 0) return 0;

		let transpositions = 0;
		let k = 0;
		for (let i = 0; i < a.length; i++) {
			if (!aMatches[i]) continue;
			while (!bMatches[k]) k++;
			if (a[i] !== b[k]) transpositions++;
			k++;
		}
		transpositions /= 2;

		return (matches / a.length + matches / b.length + (matches - transpositions) / matches) / 3;
	}

	/**
	 * Find best matching string and ratings for all candidates
	 */
	findBestMatch(target: string, candidates: string[]): BestMatchResult {
		const ratings = candidates.map(candidate => ({
			target: candidate,
			rating: this.calculateSimilarity(target, candidate),
		}));

		let bestMatchIndex = 0;
		let bestRating = ratings[0]?.rating ?? 0;

		for (let i = 1; i < ratings.length; i++) {
			if (ratings[i].rating > bestRating) {
				bestRating = ratings[i].rating;
				bestMatchIndex = i;
			}
		}

		return {
			ratings,
			bestMatch: ratings[bestMatchIndex],
			bestMatchIndex,
		};
	}
}

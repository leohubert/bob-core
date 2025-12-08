export interface SimilarityResult {
	rating: number;
	target: string;
}

export interface BestMatchResult {
	bestMatch: SimilarityResult;
	bestMatchIndex: number;
	ratings: SimilarityResult[];
}

/**
 * String similarity calculator using Dice's Coefficient algorithm
 */
export class StringSimilarity {
	/**
	 * Generate bigrams (character pairs) from a string
	 */
	private getBigrams(str: string): string[] {
		const bigrams: string[] = [];
		const normalized = str.toLowerCase();
		for (let i = 0; i < normalized.length - 1; i++) {
			bigrams.push(normalized.slice(i, i + 2));
		}
		return bigrams;
	}

	/**
	 * Calculate Dice's Coefficient similarity between two strings (0-1 scale)
	 */
	calculateSimilarity(str1: string, str2: string): number {
		if (str1 === str2) return 1;
		if (str1.length < 2 || str2.length < 2) return 0;

		const bigrams1 = this.getBigrams(str1);
		const bigrams2 = this.getBigrams(str2);
		const bigrams2Set = new Set(bigrams2);

		let matches = 0;
		for (const bigram of bigrams1) {
			if (bigrams2Set.has(bigram)) {
				matches++;
				bigrams2Set.delete(bigram); // Count each bigram only once
			}
		}

		return (2 * matches) / (bigrams1.length + bigrams2.length);
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

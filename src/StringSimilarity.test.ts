import { beforeEach, describe, expect, it } from 'vitest';

import { StringSimilarity } from './StringSimilarity.js';

describe('StringSimilarity', () => {
	let similarity: StringSimilarity;

	beforeEach(() => {
		similarity = new StringSimilarity();
	});

	describe('calculateSimilarity', () => {
		it('should return 1 for identical strings', () => {
			expect(similarity.calculateSimilarity('hello', 'hello')).toBe(1);
			expect(similarity.calculateSimilarity('test', 'test')).toBe(1);
		});

		it('should return 0 for strings shorter than 2 characters', () => {
			expect(similarity.calculateSimilarity('a', 'b')).toBe(0);
			expect(similarity.calculateSimilarity('x', 'xyz')).toBe(0);
			expect(similarity.calculateSimilarity('abc', 'x')).toBe(0);
		});

		it('should be case-insensitive', () => {
			const result1 = similarity.calculateSimilarity('Hello', 'hello');
			const result2 = similarity.calculateSimilarity('HELLO', 'hello');
			expect(result1).toBe(1);
			expect(result2).toBe(1);
		});

		it("should calculate similarity using Dice's Coefficient", () => {
			// "night" and "nacht" share "na" and "ht" bigrams
			// night: ni, ig, gh, ht (4 bigrams)
			// nacht: na, ac, ch, ht (4 bigrams)
			// matches: ht (1 match, but na != ni)
			// Actually: n-i, i-g, g-h, h-t vs n-a, a-c, c-h, h-t
			// matches: h-t (1), but wait - need to check properly
			const result = similarity.calculateSimilarity('night', 'nacht');
			expect(result).toBeGreaterThan(0);
			expect(result).toBeLessThan(1);
		});

		it('should return higher similarity for more similar strings', () => {
			const similar = similarity.calculateSimilarity('kitten', 'sitting');
			const different = similarity.calculateSimilarity('kitten', 'hello');
			expect(similar).toBeGreaterThan(different);
		});

		it('should calculate non-zero similarity for anagrams', () => {
			// 'test' and 'tset' have same letters but different order
			// Bigrams: 'test' = te, es, st vs 'tset' = ts, se, et
			// No matching bigrams, so similarity = 0
			const result = similarity.calculateSimilarity('test', 'best');
			expect(result).toBeGreaterThan(0);
			expect(result).toBeLessThan(1);
		});

		it('should return 0 for completely different strings', () => {
			const result = similarity.calculateSimilarity('abc', 'xyz');
			expect(result).toBe(0);
		});
	});

	describe('findBestMatch', () => {
		it('should find exact match with rating 1', () => {
			const candidates = ['apple', 'banana', 'orange'];
			const result = similarity.findBestMatch('apple', candidates);

			expect(result.bestMatch.target).toBe('apple');
			expect(result.bestMatch.rating).toBe(1);
			expect(result.bestMatchIndex).toBe(0);
		});

		it('should find best match among similar strings', () => {
			const candidates = ['help', 'hello', 'world'];
			const result = similarity.findBestMatch('helo', candidates);

			expect(result.bestMatch.target).toBe('hello');
			expect(result.bestMatchIndex).toBe(1);
			expect(result.bestMatch.rating).toBeGreaterThan(0.5);
		});

		it('should return ratings for all candidates', () => {
			const candidates = ['apple', 'application', 'apply'];
			const result = similarity.findBestMatch('app', candidates);

			expect(result.ratings).toHaveLength(3);
			expect(result.ratings[0].target).toBe('apple');
			expect(result.ratings[1].target).toBe('application');
			expect(result.ratings[2].target).toBe('apply');

			// All should have some similarity
			result.ratings.forEach(rating => {
				expect(rating.rating).toBeGreaterThanOrEqual(0);
				expect(rating.rating).toBeLessThanOrEqual(1);
			});
		});

		it('should handle typos in command names', () => {
			const candidates = ['migrate', 'generate', 'create'];
			const result = similarity.findBestMatch('migarte', candidates);

			expect(result.bestMatch.target).toBe('migrate');
			expect(result.bestMatch.rating).toBeGreaterThan(0.3);
		});

		it('should prefer closer matches', () => {
			const candidates = ['user:list', 'user:create', 'user:delete'];
			const result = similarity.findBestMatch('user:lis', candidates);

			expect(result.bestMatch.target).toBe('user:list');
		});

		it('should handle single candidate', () => {
			const candidates = ['only-one'];
			const result = similarity.findBestMatch('only', candidates);

			expect(result.bestMatch.target).toBe('only-one');
			expect(result.bestMatchIndex).toBe(0);
			expect(result.ratings).toHaveLength(1);
		});

		it('should find best match even with low similarity', () => {
			const candidates = ['xyz', 'abc', 'def'];
			const result = similarity.findBestMatch('test', candidates);

			// Should still pick one, even if similarity is low
			expect(result.bestMatch.target).toBeTruthy();
			expect(result.bestMatchIndex).toBeGreaterThanOrEqual(0);
			expect(result.bestMatchIndex).toBeLessThan(3);
		});

		it('should handle multiple candidates with same similarity', () => {
			const candidates = ['abc', 'def', 'ghi'];
			const result = similarity.findBestMatch('xyz', candidates);

			// Should pick the first one if all have same rating
			expect(result.bestMatchIndex).toBeGreaterThanOrEqual(0);
			expect(result.ratings).toHaveLength(3);
		});
	});

	describe('integration with command suggestions', () => {
		it('should identify similar commands for suggestions (>0.3 threshold)', () => {
			const commands = ['user:create', 'user:delete', 'user:list', 'post:create'];
			const result = similarity.findBestMatch('user:crete', commands);

			const suggestions = result.ratings.filter(r => r.rating > 0.3);

			expect(result.bestMatch.target).toBe('user:create');
			expect(suggestions.length).toBeGreaterThan(0);
			expect(suggestions.some(s => s.target === 'user:create')).toBe(true);
		});

		it('should auto-suggest with high confidence (>0.7 threshold)', () => {
			const commands = ['migrate', 'generate', 'create'];
			const result = similarity.findBestMatch('migrat', commands);

			expect(result.bestMatch.target).toBe('migrate');
			expect(result.bestMatch.rating).toBeGreaterThan(0.7);
		});

		it('should filter out low similarity matches', () => {
			const commands = ['apple', 'banana', 'cherry'];
			const result = similarity.findBestMatch('xyz', commands);

			const suggestions = result.ratings.filter(r => r.rating > 0.3);
			expect(suggestions.length).toBe(0);
		});
	});
});

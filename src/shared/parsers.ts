import fs from 'node:fs';

import { ValidationError } from '@/src/errors/ValidationError.js';

export function parseString(value: string | boolean): string {
	if (typeof value === 'boolean') {
		throw new ValidationError(`Expected a string, got boolean "${value}"`);
	}
	return String(value);
}

export function parseNumber(value: string | number, constraints?: { min?: number; max?: number }): number {
	const num = typeof value === 'number' ? value : Number(value);
	if (isNaN(num)) {
		throw new ValidationError('must be a valid number');
	}
	if (constraints?.min !== undefined && num < constraints.min) {
		throw new ValidationError(`is below minimum ${constraints.min}`);
	}
	if (constraints?.max !== undefined && num > constraints.max) {
		throw new ValidationError(`exceeds maximum ${constraints.max}`);
	}
	return num;
}

export function parseBoolean(value: string | boolean): boolean {
	if (typeof value === 'boolean') return value;
	const val = String(value).toLowerCase();
	if (val === 'true' || val === '1') return true;
	if (val === 'false' || val === '0') return false;
	throw new ValidationError(`Invalid boolean value: "${value}". Expected true, false, 1, or 0.`);
}

export function parseOption<T extends readonly string[]>(value: string, options: T): T[number] {
	const str = String(value);
	if (!options.includes(str as T[number])) {
		throw new ValidationError(`must be one of: ${options.map(o => `"${o}"`).join(', ')}`);
	}
	return str as T[number];
}

export function parseFile(input: string, constraints?: { exists?: boolean }): string {
	const path = String(input);
	if (constraints?.exists) {
		try {
			fs.accessSync(path, fs.constants.F_OK);
		} catch (e) {
			const code = (e as NodeJS.ErrnoException).code;
			if (code === 'ENOENT') throw new ValidationError('file does not exist');
			if (code === 'EACCES') throw new ValidationError('file is not accessible (permission denied)');
			throw new ValidationError(`file is not accessible (${code ?? (e as Error).message})`);
		}
	}
	return path;
}

export function parseDirectory(input: string, constraints?: { exists?: boolean }): string {
	const path = String(input);
	if (constraints?.exists) {
		let stat: fs.Stats;
		try {
			stat = fs.lstatSync(path);
		} catch (e) {
			const code = (e as NodeJS.ErrnoException).code;
			if (code === 'ENOENT') throw new ValidationError('directory does not exist');
			if (code === 'EACCES') throw new ValidationError('directory is not accessible (permission denied)');
			if (code === 'ELOOP') throw new ValidationError('symlink loop detected');
			throw new ValidationError(`directory is not accessible (${code ?? (e as Error).message})`);
		}
		if (!stat.isDirectory()) {
			throw new ValidationError('path is not a directory');
		}
	}
	return path;
}

export function parseUrl(input: string): URL {
	try {
		return new URL(String(input));
	} catch (e) {
		const reason = e instanceof Error ? e.message : String(e);
		throw new ValidationError(`Invalid URL "${input}": ${reason}`);
	}
}

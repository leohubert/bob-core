import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import {CommandIO} from '@/src/CommandIO.js';
import {newTestLogger, TestLogger} from '@/src/testFixtures.js';
import {faker} from '@faker-js/faker';
import prompts from 'prompts';

vi.mock('prompts');

describe('CommandIO', () => {
	let logger: TestLogger;
	let io: CommandIO;

	beforeEach(() => {
		logger = newTestLogger();
		io = new CommandIO(logger);
	});

	describe('Logger delegation', () => {
		it('should delegate log() to logger', () => {
			const message = faker.lorem.sentence();
			const data = faker.number.int();

			io.log(message, data);

			expect(logger.log).toHaveBeenCalledWith(message, data);
		});

		it('should delegate info() to logger', () => {
			const message = faker.lorem.sentence();

			io.info(message);

			expect(logger.info).toHaveBeenCalledWith(message);
		});

		it('should delegate warn() to logger', () => {
			const message = faker.lorem.sentence();

			io.warn(message);

			expect(logger.warn).toHaveBeenCalledWith(message);
		});

		it('should delegate error() to logger', () => {
			const message = faker.lorem.sentence();

			io.error(message);

			expect(logger.error).toHaveBeenCalledWith(message);
		});

		it('should delegate debug() to logger', () => {
			const message = faker.lorem.sentence();

			io.debug(message);

			expect(logger.debug).toHaveBeenCalledWith(message);
		});


		it('should pass multiple arguments to logger methods', () => {
			const args = ['msg1', 'msg2', {key: 'value'}, 123];

			io.info(...args);

			expect(logger.info).toHaveBeenCalledWith(...args);
		});
	});

	describe('Prompt methods', () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		describe('askForConfirmation()', () => {
			it('should prompt for confirmation with default message', async () => {
				const mockResult = {value: true};
				vi.mocked(prompts).mockResolvedValue(mockResult);

				const result = await io.askForConfirmation();

				expect(prompts).toHaveBeenCalledWith({
					type: 'confirm',
					name: 'value',
					message: 'Do you want to continue?',
					initial: false,
				});
				expect(result).toBe(true);
			});

			it('should prompt for confirmation with custom message', async () => {
				const message = faker.lorem.sentence();
				const mockResult = {value: false};
				vi.mocked(prompts).mockResolvedValue(mockResult);

				const result = await io.askForConfirmation(message);

				expect(prompts).toHaveBeenCalledWith({
					type: 'confirm',
					name: 'value',
					message,
					initial: false,
				});
				expect(result).toBe(false);
			});

			it('should use default value when provided', async () => {
				const mockResult = {value: true};
				vi.mocked(prompts).mockResolvedValue(mockResult);

				await io.askForConfirmation('Confirm?', true);

				expect(prompts).toHaveBeenCalledWith({
					type: 'confirm',
					name: 'value',
					message: 'Confirm?',
					initial: true,
				});
			});
		});

		describe('askForInput()', () => {
			it('should prompt for text input', async () => {
				const message = faker.lorem.sentence();
				const value = faker.lorem.word();
				vi.mocked(prompts).mockResolvedValue({value});

				const result = await io.askForInput(message);

				expect(prompts).toHaveBeenCalledWith({
					type: 'text',
					name: 'value',
					message,
					initial: undefined,
				});
				expect(result).toBe(value);
			});

			it('should use default value when provided', async () => {
				const defaultValue = faker.lorem.word();
				vi.mocked(prompts).mockResolvedValue({value: defaultValue});

				await io.askForInput('Enter name', defaultValue);

				expect(prompts).toHaveBeenCalledWith(
					expect.objectContaining({
						initial: defaultValue,
					})
				);
			});

			it('should pass custom options', async () => {
				const validate = vi.fn();
				vi.mocked(prompts).mockResolvedValue({value: 'test'});

				await io.askForInput('Enter', undefined, {
					type: 'password',
					validate,
					min: 5,
					max: 10,
				});

				expect(prompts).toHaveBeenCalledWith(
					expect.objectContaining({
						type: 'password',
						validate,
						min: 5,
						max: 10,
					})
				);
			});

			it('should return null when no value provided', async () => {
				vi.mocked(prompts).mockResolvedValue({});

				const result = await io.askForInput('Enter');

				expect(result).toBeNull();
			});
		});

		describe('askForToggle()', () => {
			it('should prompt for toggle', async () => {
				const message = faker.lorem.sentence();
				vi.mocked(prompts).mockResolvedValue({value: true});

				const result = await io.askForToggle(message);

				expect(prompts).toHaveBeenCalledWith({
					type: 'toggle',
					name: 'value',
					message,
					initial: undefined,
				});
				expect(result).toBe(true);
			});

			it('should use default value when provided', async () => {
				vi.mocked(prompts).mockResolvedValue({value: false});

				await io.askForToggle('Enable?', true);

				expect(prompts).toHaveBeenCalledWith(
					expect.objectContaining({
						initial: true,
					})
				);
			});

			it('should pass custom active/inactive labels', async () => {
				vi.mocked(prompts).mockResolvedValue({value: true});

				await io.askForToggle('Enable?', false, {
					active: 'Yes',
					inactive: 'No',
				});

				expect(prompts).toHaveBeenCalledWith(
					expect.objectContaining({
						active: 'Yes',
						inactive: 'No',
					})
				);
			});

			it('should return null when no value provided', async () => {
				vi.mocked(prompts).mockResolvedValue({});

				const result = await io.askForToggle('Enable?');

				expect(result).toBeNull();
			});
		});

		describe('askForSelect()', () => {
			it('should prompt for selection with string options', async () => {
				const message = faker.lorem.sentence();
				const options = ['Option 1', 'Option 2', 'Option 3'];
				vi.mocked(prompts).mockResolvedValue({value: 'Option 1'});

				const result = await io.askForSelect(message, options);

				expect(prompts).toHaveBeenCalledWith({
					type: 'select',
					name: 'value',
					message,
					choices: [
						{title: 'Option 1', value: 'Option 1'},
						{title: 'Option 2', value: 'Option 2'},
						{title: 'Option 3', value: 'Option 3'},
					],
				});
				expect(result).toBe('Option 1');
			});

			it('should prompt for selection with SelectOption objects', async () => {
				const options = [
					{title: 'First', value: 1},
					{title: 'Second', value: 2, disabled: true},
				];
				vi.mocked(prompts).mockResolvedValue({value: 1});

				const result = await io.askForSelect('Choose', options);

				expect(prompts).toHaveBeenCalledWith(
					expect.objectContaining({
						choices: options,
					})
				);
				expect(result).toBe(1);
			});

			it('should handle mixed string and object options', async () => {
				const options = [
					'String option',
					{title: 'Object option', value: 'obj'},
				];
				vi.mocked(prompts).mockResolvedValue({value: 'String option'});

				await io.askForSelect('Choose', options);

				expect(prompts).toHaveBeenCalledWith(
					expect.objectContaining({
						choices: [
							{title: 'String option', value: 'String option'},
							{title: 'Object option', value: 'obj'},
						],
					})
				);
			});

			it('should throw error when no options provided', async () => {
				await expect(io.askForSelect('Choose', [])).rejects.toThrow(
					'No options provided'
				);
			});

			it('should pass custom options', async () => {
				const suggest = vi.fn();
				const validate = vi.fn();
				vi.mocked(prompts).mockResolvedValue({value: 'test'});

				await io.askForSelect('Choose', ['Option 1'], {
					type: 'autocomplete',
					initial: 0,
					validate,
					suggest,
				});

				expect(prompts).toHaveBeenCalledWith(
					expect.objectContaining({
						type: 'autocomplete',
						initial: 0,
						validate,
						suggest,
					})
				);
			});

			it('should return null when no value provided', async () => {
				vi.mocked(prompts).mockResolvedValue({});

				const result = await io.askForSelect('Choose', ['Option 1']);

				expect(result).toBeNull();
			});
		});
	});

	describe('Loader functionality', () => {
		let stdoutSpy: any;

		beforeEach(() => {
			vi.useFakeTimers();
			stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		});

		afterEach(() => {
			stdoutSpy.mockRestore();
			vi.useRealTimers();
		});

		it('should create a loader with default settings', () => {
			const loader = io.newLoader();

			expect(loader).toHaveProperty('stop');
			expect(loader).toHaveProperty('updateText');
			expect(loader[Symbol.dispose]).toBeDefined();
			expect(loader[Symbol.asyncDispose]).toBeDefined();
		});

		it('should create a loader with custom text', () => {
			const text = faker.lorem.words();
			const loader = io.newLoader(text);

			vi.advanceTimersByTime(100);

			expect(process.stdout.write).toHaveBeenCalled();
			expect(stdoutSpy.mock.calls[0][0]).toEqual(
				expect.any(Uint8Array)
			);

			loader.stop();
		});

		it('should create a loader with custom chars and delay', () => {
			const chars = ['|', '/', '-', '\\'];
			const loader = io.newLoader('Test', chars, 50);

			vi.advanceTimersByTime(50);

			expect(process.stdout.write).toHaveBeenCalled();

			loader.stop();
		});

		it('should stop loader when stop() is called', () => {
			const loader = io.newLoader('Loading...');

			vi.advanceTimersByTime(100);
			const callCountBeforeStop = stdoutSpy.mock.calls.length;

			loader.stop();
			vi.advanceTimersByTime(200);

			// Should not have written more after stop
			expect(stdoutSpy.mock.calls.length).toBe(callCountBeforeStop + 1);
		});

		it('should update loader text', () => {
			const loader = io.newLoader('Initial');

			vi.advanceTimersByTime(100);

			loader.updateText('Updated');

			vi.advanceTimersByTime(100);

			loader.stop();

			expect(process.stdout.write).toHaveBeenCalled();
		});

		it('should support Symbol.dispose for cleanup', () => {
			const loader = io.newLoader('Test');

			vi.advanceTimersByTime(100);
			const callCountBeforeDispose = stdoutSpy.mock.calls.length;

			loader[Symbol.dispose]();

			vi.advanceTimersByTime(200);

			// Should have stopped (only cleanup write, no more interval writes)
			expect(stdoutSpy.mock.calls.length).toBe(callCountBeforeDispose + 1);
		});

		it('should support Symbol.asyncDispose for cleanup', async () => {
			const loader = io.newLoader('Test');

			vi.advanceTimersByTime(100);
			const callCountBeforeDispose = stdoutSpy.mock.calls.length;

			await loader[Symbol.asyncDispose]();

			vi.advanceTimersByTime(200);

			// Should have stopped (only cleanup write, no more interval writes)
			expect(stdoutSpy.mock.calls.length).toBe(callCountBeforeDispose + 1);
		});

		it('should animate loader with multiple frames', () => {
			const loader = io.newLoader('Loading');

			// Advance through multiple frames
			vi.advanceTimersByTime(100);
			vi.advanceTimersByTime(100);
			vi.advanceTimersByTime(100);

			expect(stdoutSpy.mock.calls.length).toBe(3);

			loader.stop();
		});
	});
});

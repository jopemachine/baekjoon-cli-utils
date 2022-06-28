import process from 'node:process';
import chalk from 'chalk';
import {ExecaChildProcess} from 'execa';
import {Problem} from './problem.js';
import {Logger, printDivider} from './utils.js';
import {supportedLanguages} from './lang.js';

abstract class TestRunner {
	languageId: string;

	constructor() {
		this.languageId = '';
	}

	async run({sourceFilePath, problem, testIdx}: {sourceFilePath: string; problem: Problem; testIdx?: number}) {
		await problem.readAllTests();

		if (problem.tests.length === 0) {
			Logger.errorLog(chalk.red('No Test Case Found!'));
			process.exit(1);
		}

		let targetFilePath = sourceFilePath;
		if ((supportedLanguages as any)[this.languageId].isCompiledLanguage) {
			try {
				targetFilePath = await this.compile({sourceFilePath});
			} catch (error: any) {
				Logger.errorLog(chalk.red('Compile Failed!'));
				Logger.log(error.stderr);
				process.exit(1);
			}
		}

		let allTestPassed = true;
		let testIndex = 1;

		for await (const test of problem.tests) {
			if (testIdx && testIdx !== testIndex) {
				++testIndex;
				continue;
			}

			printDivider();
			const {stdin, expectedStdout} = await test.parse();

			let stdout;
			let stderr;
			let elapsedTime;

			try {
				const startTime = Date.now();
				const executionResult = await this.execute({stdin, targetFilePath});
				elapsedTime = Date.now() - startTime;
				if (elapsedTime > 1000) {
					elapsedTime = chalk.red(elapsedTime);
				}

				stdout = executionResult.stdout ?? '';
				stderr = executionResult.stderr ?? '';
			} catch (error: any) {
				allTestPassed = false;

				if (error.timedOut) {
					Logger.errorLog(chalk.whiteBright(`Test Case ${testIndex} - Timeout!`));
				} else {
					Logger.errorLog(chalk.whiteBright(`Test Case ${testIndex} - Runtime Error Occured!`));
					Logger.log(chalk.gray(error.shortMessage));
				}

				if (error.stdout) {
					Logger.log(error.stdout);
				}

				if (error.stderr) {
					Logger.log(error.stderr);
				}

				++testIndex;
				continue;
			}

			if (stdout.trim() === expectedStdout.trim()) {
				Logger.successLog(chalk.whiteBright(`Test Case ${testIndex}`));
				Logger.infoLog(chalk.gray(`Elapsed ${chalk.underline(elapsedTime + 'ms')}`));
			} else {
				allTestPassed = false;
				Logger.errorLog(chalk.whiteBright(`Test Case ${testIndex}`));
				Logger.infoLog(chalk.gray(`Elapsed ${chalk.underline(elapsedTime) + 'ms'}`));
				Logger.log(chalk.red(stdout));
			}

			if (stderr) {
				Logger.infoLog(chalk.gray(`[stderr]:\n${stderr}`));
			}

			if (!stdout && !stderr) {
				Logger.log(chalk.gray('Stdout Is Empty!'));
			}

			++testIndex;
		}

		printDivider();

		if (allTestPassed) {
			Logger.log(chalk.greenBright('🎉 All Tests Passed!'));
		} else {
			Logger.log(chalk.redBright('Some Tests Failed!'));
		}
	}

	abstract compile({sourceFilePath}: {sourceFilePath: string}): Promise<string>;
	abstract execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}): ExecaChildProcess;
}

export {
	TestRunner,
};

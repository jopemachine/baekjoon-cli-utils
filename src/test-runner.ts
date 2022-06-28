import process from 'node:process';
import chalk from 'chalk';
import {ExecaChildProcess, ExecaError, ExecaReturnValue} from 'execa';
import {Problem} from './problem.js';
import {Logger, printDivider} from './utils.js';
import {supportedLanguages} from './lang.js';
import {config} from './conf.js';

abstract class TestRunner {
	languageId: string;
	timeout: number;
	runnerSettings: any;

	constructor(runnerSettings: any) {
		const timeout = config.get('timeout');
		this.languageId = '';
		this.timeout = timeout === 0 ? undefined : timeout;
		this.runnerSettings = runnerSettings;
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

			try {
				const childProc = this.execute({stdin, targetFilePath});
				const executionResult = await childProc;

				stdout = executionResult.stdout ?? '';
				stderr = executionResult.stderr ?? '';
			} catch (error: unknown) {
				allTestPassed = false;

				if ((error as ExecaError).timedOut) {
					Logger.errorLog(chalk.whiteBright(`Test Case ${testIndex} - Timeout!`));
				} else {
					Logger.errorLog(chalk.whiteBright(`Test Case ${testIndex} - Runtime Error Occured!`));
					Logger.log(chalk.gray(error));
				}

				if ((error as ExecaError).stdout) {
					Logger.log((error as ExecaError).stdout);
				}

				if ((error as ExecaError).stderr) {
					Logger.log((error as ExecaError).stderr);
				}

				++testIndex;
				continue;
			}

			if (stdout.trim() === expectedStdout.trim()) {
				Logger.successLog(chalk.whiteBright(`Test Case ${testIndex}`));
			} else {
				allTestPassed = false;
				Logger.errorLog(chalk.whiteBright(`Test Case ${testIndex}`));
				Logger.infoLog(chalk.gray(`[stdout]\n${chalk.red(stdout)}`));
			}

			if (stderr) {
				Logger.infoLog(chalk.gray(`[stderr]\n${stderr}`));
			}

			if (!stdout && !stderr) {
				Logger.warningLog(chalk.gray('Stdout Empty!'));
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

	async compile({sourceFilePath}: {sourceFilePath: string}): Promise<string> {
		throw new Error(`Compile is not implemented in the ${config.get('lang')} runner`);
	}

	abstract execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}): ExecaChildProcess | Promise<ExecaReturnValue>;
}

export {
	TestRunner,
};

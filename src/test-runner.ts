import process from 'node:process';
import chalk from 'chalk';
import boxen from 'boxen';
import {ExecaChildProcess, ExecaError, ExecaReturnValue} from 'execa';
import logSymbols from 'log-symbols';
import {sentenceCase} from 'change-case';
import del from 'del';
import {Problem} from './problem.js';
import {Logger, printDividerLine} from './utils.js';
import {supportedLanguages} from './lang.js';
import {config} from './conf.js';
import {TestsNotFoundError} from './errors.js';

const isSameStdout = (stdout1: string, stdout2: string) => {
	const lines1 = stdout1.trim().split('\n');
	const lines2 = stdout2.trim().split('\n');
	for (const [idx, element] of lines1.entries()) {
		if (element.trim() !== lines2[idx].trim()) {
			return false;
		}
	}

	return true;
};

abstract class TestRunner {
	languageId: string;
	timeout: number;
	runnerSettings: any;
	resources: string[];

	constructor(runnerSettings: any) {
		const timeout = config.get('timeout');
		this.languageId = '';
		this.timeout = timeout === 0 ? undefined : timeout;
		this.runnerSettings = runnerSettings;
		this.resources = [];
	}

	printRuntimeInfo() {
		const boxContentObject = {
			'programming language': this.languageId,
			...this.runnerSettings,
		};

		const boxText = Object.keys(boxContentObject).map(setting => `${sentenceCase(setting)}: ${boxContentObject[setting]}`).join('\n');
		const height = Object.keys(boxContentObject).length + 2;

		Logger.log(boxen(boxText, {
			title: `${logSymbols.info} Runtime Information`,
			titleAlignment: 'left',
			borderColor: 'gray',
			dimBorder: true,
			padding: {
				left: 1,
				bottom: 0,
				top: 0,
				right: 0,
			},
			fullscreen: width => [width, height],
		}));
	}

	async run({sourceFilePath, problem, testIdx}: {sourceFilePath: string; problem: Problem; testIdx?: number}) {
		await problem.readAllTests();

		if (problem.tests.length === 0) {
			throw new TestsNotFoundError();
		}

		this.printRuntimeInfo();

		let targetFilePath = sourceFilePath;
		if ((supportedLanguages as any)[this.languageId].isCompiledLanguage) {
			try {
				targetFilePath = await this.compile({sourceFilePath});
			} catch (error: any) {
				Logger.errorLog(chalk.red('Compile Failed!'));
				Logger.log(error);
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

			printDividerLine();

			let stdout;
			let stderr;

			try {
				const childProc = this.execute({
					stdin: test.stdin,
					targetFilePath,
				});
				const executionResult = await childProc;

				stdout = executionResult.stdout ?? '';
				stderr = executionResult.stderr ?? '';
			} catch (error: unknown) {
				allTestPassed = false;

				if ((error as ExecaError).timedOut) {
					Logger.errorLog(chalk.whiteBright(`Test Case ${testIndex} - ${chalk.red('Timeout!')}`));
				} else {
					Logger.errorLog(chalk.whiteBright(`Test Case ${testIndex} - ${chalk.red('Runtime Error Occurred!')}`));
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

			if (isSameStdout(stdout, test.expectedStdout)) {
				Logger.successLog(chalk.whiteBright(`Test Case ${testIndex} - ${chalk.green('Passed!')}`));
			} else {
				allTestPassed = false;
				Logger.errorLog(chalk.whiteBright(`Test Case ${testIndex} - ${chalk.red('Failed!')}`));
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

		printDividerLine();

		if (allTestPassed) {
			Logger.log(chalk.greenBright('🎉 All Tests Passed!'));
		} else {
			Logger.log(chalk.redBright('Some Tests Failed!'));
		}

		printDividerLine();
		await this.clear();
	}

	async compile({sourceFilePath: _}: {sourceFilePath: string}): Promise<string> {
		throw new Error(`Compile is not implemented in the ${config.get('lang')} runner`);
	}

	abstract execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}): ExecaChildProcess | Promise<ExecaReturnValue>;

	private async clear() {
		await Promise.all(this.resources.map(async resource => del(resource, {force: true})));
	}
}

export {
	TestRunner,
};

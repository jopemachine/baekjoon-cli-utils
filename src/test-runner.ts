import process from 'node:process';
import chalk from 'chalk';
import boxen from 'boxen';
import {ExecaChildProcess, ExecaError, ExecaReturnValue} from 'execa';
import logSymbols from 'log-symbols';
import {sentenceCase} from 'change-case';
import del from 'del';
import {Problem} from './problem.js';
import {Logger, printDividerLine} from './utils.js';
import {supportedLanguageInfo} from './lang.js';
import {config} from './conf.js';
import {TestsNotFoundError} from './errors.js';
import {terminalWidth} from './spinner.js';

interface StdoutAnalysisResult {
	testPassed: boolean;
	lineInfoList: LineInfo[];
	maxLineLetterCnt: number;
	shouldPrintVerbose: boolean;
}

interface LineInfo {
	actualStdout?: string;
	expectedStdout?: string;
}

const analysisStdout = (actualStdout: string, expectedStdout: string): StdoutAnalysisResult => {
	const lineInfoList: LineInfo[] = [];
	let maxLineLetterCnt = 0;
	let shouldPrintVerbose = false;
	let testPassed = true;

	const actualStdoutLines: Array<string | undefined> = actualStdout.trim().split('\n').map(string_ => string_.trim());
	const expectedStdoutLines = expectedStdout.trim().split('\n').map(string_ => string_.trim());

	while (actualStdoutLines.length < expectedStdoutLines.length) {
		actualStdoutLines.push(undefined);
	}

	for (const [idx, actualStdoutLine] of actualStdoutLines.entries()) {
		if ((!actualStdoutLine || !expectedStdoutLines[idx]) || (actualStdoutLine !== expectedStdoutLines[idx])) {
			testPassed = false;
			lineInfoList.push({
				actualStdout: actualStdoutLine,
				expectedStdout: expectedStdoutLines[idx],
			});
		} else {
			lineInfoList.push({
				actualStdout: actualStdoutLine,
				expectedStdout: expectedStdoutLines[idx],
			});
		}

		maxLineLetterCnt = Math.max(
			maxLineLetterCnt,
			expectedStdoutLines[idx] ? expectedStdoutLines[idx].length : 0,
			actualStdoutLine ? actualStdoutLine.length : 0,
		);
	}

	maxLineLetterCnt = Math.max(maxLineLetterCnt, 24);

	if ((maxLineLetterCnt * 2) - 4 > terminalWidth || terminalWidth < 80) {
		shouldPrintVerbose = true;
	}

	return {
		testPassed,
		lineInfoList,
		maxLineLetterCnt,
		shouldPrintVerbose,
	};
};

const verticalDividor = chalk.dim.gray('│');

const styleStdoutLine = (analysisResult: StdoutAnalysisResult) => analysisResult.lineInfoList.map(info => {
	let {actualStdout, expectedStdout} = info;
	actualStdout ??= '';
	expectedStdout ??= '';

	const emptySpace = analysisResult.maxLineLetterCnt - actualStdout.length;
	return `${chalk.red(actualStdout)}${' '.repeat(emptySpace)} ${verticalDividor} ${chalk.green(expectedStdout)}${' '.repeat(analysisResult.maxLineLetterCnt - expectedStdout.length)}`;
}).join('\n');

const printStdoutAnalysis = ({
	actualStdout,
	expectedStdout,
	analysisResult,
	testIndex}:
{
	actualStdout: string;
	expectedStdout: string;
	analysisResult: StdoutAnalysisResult;
	testIndex: number;
},
) => {
	if (analysisResult.testPassed) {
		Logger.successLog(chalk.whiteBright(`Test Case ${testIndex} ${chalk.green('Passed!')}`));
		return;
	}

	Logger.errorLog(chalk.whiteBright(`Test Case ${testIndex} ${chalk.yellow('Failed!')}`));

	if (analysisResult.shouldPrintVerbose) {
		Logger.infoLog(chalk.gray(`actual\n${chalk.red(actualStdout)}`));
		Logger.infoLog(chalk.gray(`expected\n${chalk.green(expectedStdout)}`));
	} else {
		Logger.log(boxen(styleStdoutLine(analysisResult)
			, {
				borderColor: 'gray',
				borderStyle: 'round',
				dimBorder: true,
				title: `${logSymbols.info} ${chalk.red('actual')} ${chalk.dim.gray('/')} ${chalk.green('expected')}`,
				titleAlignment: 'left',
				padding: {
					left: 1,
					bottom: 0,
					top: 0,
					right: 0,
				},
			}));
	}
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
			fullscreen: width => [width, height],
			padding: {
				left: 1,
				bottom: 0,
				top: 0,
				right: 0,
			},
		}));
	}

	async run({sourceFilePath, problem, testIdx}: {sourceFilePath: string; problem: Problem; testIdx?: number}) {
		await problem.readAllTests();

		if (problem.tests.length === 0) {
			throw new TestsNotFoundError();
		}

		this.printRuntimeInfo();

		let targetFilePath = sourceFilePath;
		if ((supportedLanguageInfo as any)[this.languageId].isCompiledLanguage) {
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
					Logger.errorLog(chalk.whiteBright(`Test Case ${testIndex} ${chalk.red('Timeout!')}`));
				} else {
					Logger.errorLog(chalk.whiteBright(`Test Case ${testIndex} ${chalk.red('Runtime Error Occurred!')}`));
					Logger.log(chalk.gray(error));
				}

				if ((error as ExecaError).stdout) {
					Logger.log((error as ExecaError).stdout);
				}

				++testIndex;
				continue;
			}

			const analysisResult = analysisStdout(stdout, test.expectedStdout);

			if (!analysisResult.testPassed) {
				allTestPassed = false;
			}

			printStdoutAnalysis({
				testIndex,
				analysisResult,
				actualStdout: stdout,
				expectedStdout: test.expectedStdout,
			});

			if (stderr) {
				Logger.infoLog(chalk.gray(`[stderr]\n${stderr}`));
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
		throw new Error(`'compile' is not implemented in the ${this.languageId} runner`);
	}

	abstract execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}): ExecaChildProcess | Promise<ExecaReturnValue>;

	private async clear() {
		await Promise.all(this.resources.map(async resource => del(resource, {force: true})));
	}
}

export {
	TestRunner,
};

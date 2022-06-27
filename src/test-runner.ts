import process from 'node:process';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import {ExecaChildProcess} from 'execa';
import {Problem} from './problem.js';
import {Logger} from './utils.js';

abstract class TestRunner {
	isCompiledLanguage: boolean;

	constructor({isCompiledLanguage}: {isCompiledLanguage: boolean}) {
		this.isCompiledLanguage = isCompiledLanguage;
	}

	async run({sourceFilePath, problem, testIdx}: {sourceFilePath: string; problem: Problem; testIdx?: number}) {
		await problem.readAllTests();

		if (problem.tests.length === 0) {
			Logger.errorLog(chalk.red('No Test Case Found!'));
			process.exit(1);
		}

		let targetFilePath = sourceFilePath;
		if (this.isCompiledLanguage) {
			try {
				targetFilePath = await this.compile({sourceFilePath});
			} catch (error: any) {
				Logger.errorLog(chalk.red('Compile Failed!'));
				Logger.log(error.stderr);
				process.exit(1);
			}
		}

		let testIndex = 1;
		const stdoutBuffer = [];
		for await (const test of problem.tests) {
			if (testIdx && testIdx !== testIndex) {
				++testIndex;
				continue;
			}

			const {stdin, expectedStdout} = await test.parse();

			Logger.log(chalk.gray(`- Test Case ${testIndex}`));
			let stdout;
			let stderr;

			try {
				const executionResult = await this.execute({stdin, targetFilePath});
				stdout = executionResult.stdout ?? '';
				stderr = executionResult.stderr ?? '';
			} catch (error: any) {
				Logger.errorLog(chalk.red('Runtime Error Occured!'));
				Logger.log(chalk.gray(error.shortMessage));
				++testIndex;
				continue;
			}

			if (stderr) {
				Logger.infoLog(chalk.gray('[DEBUG]: ', stderr));
			}

			if (stdout.trim() === expectedStdout) {
				stdoutBuffer.push(chalk.greenBright(`${logSymbols.success} Test ${testIndex} Success!`));
			} else {
				stdoutBuffer.push(chalk.red(`${logSymbols.error} Test ${testIndex} Failed!`));
			}

			Logger.log(stdout);

			if (!stdout) {
				Logger.errorLog(chalk.gray('Stdout Is Empty!'));
			}

			++testIndex;
		}

		if (stdoutBuffer.length > 0) {
			Logger.log();
			Logger.log(chalk.gray('-----------------------------------------'));
			Logger.log(chalk.gray('* Test Result'));
			Logger.log();
			Logger.log(stdoutBuffer.map(statement => ' ' + statement).join('\n'));
			Logger.log();
		}
	}

	abstract compile({sourceFilePath}: {sourceFilePath: string}): Promise<string>;
	abstract execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}): ExecaChildProcess;
}

export {
	TestRunner,
};

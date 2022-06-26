import process from 'node:process';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import {ExecaChildProcess} from 'execa';
import {Problem} from './problem.js';

abstract class TestRunner {
	isCompiledLanguage: boolean;

	constructor({isCompiledLanguage}: {isCompiledLanguage: boolean}) {
		this.isCompiledLanguage = isCompiledLanguage;
	}

	async run({sourceFilePath, problemId, problemIdx, testIdx}: {sourceFilePath: string; problemId: string; problemIdx?: number; testIdx?: number}) {
		const problem = new Problem({problemId, problemIdx});
		await problem.readAllTests();

		if (problem.tests.length === 0) {
			console.error(`${logSymbols.error} No Test Case Found!`);
			process.exit(1);
		}

		let targetFilePath = sourceFilePath;
		if (this.isCompiledLanguage) {
			try {
				targetFilePath = await this.compile({sourceFilePath});
			} catch (error: any) {
				console.log(chalk.red(`${logSymbols.error} Compile Failed!`));
				console.log(error.stderr);
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

			console.log(chalk.gray(`- Test Case ${testIndex}`));
			let stdout;
			let stderr;

			try {
				const executionResult = await this.execute({stdin, targetFilePath});
				stdout = executionResult.stdout ?? '';
				stderr = executionResult.stderr ?? '';
			} catch (error: any) {
				console.log(chalk.red(`${logSymbols.error} Runtime Error Occured!`));
				console.log(error.shortMessage);
				++testIndex;
				continue;
			}

			if (stderr) {
				console.log(chalk.gray(`${logSymbols.info} [DEBUG]: `, stderr));
			}

			if (stdout.trim() === expectedStdout) {
				stdoutBuffer.push(chalk.greenBright(`${logSymbols.success} Test ${testIndex} Success!`));
			} else {
				stdoutBuffer.push(chalk.red(`${logSymbols.error} Test ${testIndex} Failed!`));
			}

			console.log(stdout);

			if (!stdout) {
				console.log(chalk.gray(`${logSymbols.error} Stdout Is Empty!`));
			}

			++testIndex;
		}

		if (stdoutBuffer.length > 0) {
			console.log(chalk.gray('\n-----------------------------------------'));
			console.log(chalk.gray('* Test Result\n'));
			console.log(stdoutBuffer.map(statement => ' ' + statement).join('\n'));
			console.log();
		}
	}

	abstract compile({sourceFilePath}: {sourceFilePath: string}): Promise<string>;
	abstract execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}): ExecaChildProcess;
}

export {
	TestRunner,
};

import process from 'node:process';
import ora from 'ora';
import chalk from 'chalk';
import isPromise from 'is-promise';
import {Logger} from './utils.js';

const terminalWidth = process.stdout.columns;

const spinner = ora({hideCursor: false});

const useSpinner = async <T>(work: Promise<T> | (() => Promise<T>), message: string): Promise<T | undefined> => {
	spinner.start(`${message} Processing...`);
	try {
		const result = isPromise(work) ? await work : await work();
		spinner.succeed(`${message} Done.`);
		return result;
	} catch (error: any) {
		spinner.fail(`${message} Failed!`);
		Logger.log(chalk.gray(error));
	}
};

export {
	useSpinner,
	spinner,
	terminalWidth,
};

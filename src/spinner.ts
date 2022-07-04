import process from 'node:process';
import ora from 'ora';
import chalk from 'chalk';
import isPromise from 'is-promise';
import {Logger} from './utils.js';

const terminalWidth = process.stdout.columns;

const spinner = ora({hideCursor: false});

const useSpinner = async <ValueType>(work: Promise<ValueType> | (() => Promise<ValueType>), message: string): Promise<ValueType | undefined> => {
	spinner.start(`${message} Processing...`);
	try {
		const result = isPromise(work) ? await work : await work();
		spinner.succeed(`${message}... Done.`);
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

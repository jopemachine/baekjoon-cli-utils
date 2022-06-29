#!/usr/local/bin/node
import process from 'node:process';
import path from 'node:path';
import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import isFirstRun from 'first-run';
import {globby} from 'globby';
import chalk from 'chalk';
import {
	checkHealth,
	clearAllTestData,
	config,
	helpMessage,
	initConfigFilePaths,
	projectName,
	setAPIProvider,
	setCommentTemplate,
	setGitCommitMessageTemplate,
	setProgrammingLanguage,
	setSourceCodeTemplate,
	setTimeoutValue,
} from './conf.js';
import {APIProvider} from './api-provider.js';
import {generateAPIProvider} from './api-provider-factory.js';
import {generateTestRunner} from './test-runner-factory.js';
import {TestRunner} from './test-runner.js';
import {Problem} from './problem.js';
import {ArgumentLengthError} from './errors.js';
import {
	commitProblem,
	findProblemPath,
	getProblemFolderNames,
	getProblemPathId,
	getUnusedFilename,
	Logger,
	printDividerLine,
} from './utils.js';
import {useSpinner} from './spinner.js';
import {inferLanguageCode, supportedLanguages} from './lang.js';

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

const command = process.argv[2];
const subCommand = command === 'config' && process.argv.length > 3 ? process.argv[3] : undefined;

const checkArgumentLength = (command: string, subCommand?: string) => {
	const expectedLengthDict = {
		config: 1,
		'config timeout': 3,
		'config provider': 3,
		'config code-template': 2,
		'config comment-template': 2,
		'config commit-message': 2,
		create: 2,
		'add-test': 2,
		'clear-data': 2,
		'clear-test': 2,
		'clear-tests': 2,
		'view-tests': 2,
		open: 2,
		commit: 2,
	};

	const id = subCommand ? `${command} ${subCommand}` : command;

	// Argv0, Argv1 are excluded from counting.
	if ((expectedLengthDict as any)[id] && process.argv.length - 2 !== (expectedLengthDict as any)[id]) {
		throw new ArgumentLengthError({
			expectedLength: (expectedLengthDict as any)[id],
			actualLength: process.argv.length - 2,
		});
	}
};

const handleCreate = async (problemId: string) => {
	const provider: APIProvider = generateAPIProvider(config.get('provider'));

	let paths = await useSpinner(globby('**/*', {onlyDirectories: true, caseSensitiveMatch: true}), 'Fetching Sub Directories');

	paths = [(await inquirer.prompt([{
		name: 'folder',
		message: 'Select A Directory To Save The Source Code',
		type: 'autocomplete',
		pageSize: Number(config.get('pageSize')),
		source: (_answers: any[], input: string) => getProblemFolderNames(paths!, input),
	}])).folder];

	const lang = config.get('lang');
	const {extension} = (supportedLanguages as any)[lang];

	const pathToSave = await getUnusedFilename(
		path.resolve(paths[0], [problemId, extension].join('.')),
	);

	const problemPathId = getProblemPathId({
		sourceFilePath: pathToSave,
		isRelative: false,
	});

	const problem = new Problem({
		problemId,
		problemPathId,
	});

	await problem.clearTests();
	problem.generateTestFolder();
	await provider.createProblem(pathToSave, problem);
	return problem;
};

const handleTest = async (problemId: string, provider: APIProvider) => {
	const sourceFilePath = await findProblemPath(problemId);
	const problemPathId = getProblemPathId({
		sourceFilePath,
		isRelative: true,
	});

	const problem = new Problem({
		problemId,
		problemPathId,
	});

	const testIdx = process.argv.length > 4 ? Number(process.argv[4]) : undefined;

	const testRunner: TestRunner = await generateTestRunner(inferLanguageCode(sourceFilePath.split('.').pop()!));

	try {
		await testRunner.run({sourceFilePath, problem, testIdx});
	} catch (error: any) {
		if (error.name === 'TestsNotFoundError') {
			Logger.warningLog(chalk.white('No Test Case Found.'));
			await useSpinner(provider.fetchProblemInfo(problem), 'Fetching Test Cases');
			problem.generateTestFolder();
			await Promise.all(problem.tests.map(async test => test.write()));
			await testRunner.run({sourceFilePath, problem, testIdx});
		}
	}
};

const handleAddTest = async (problemId: string) => {
	const sourceFilePath = await findProblemPath(problemId);
	const problemPathId = getProblemPathId({
		sourceFilePath,
		isRelative: true,
	});

	const problem = new Problem({
		problemId,
		problemPathId,
	});

	await problem.addManualTest();
	Logger.successLog('Test Added Successfully.');
};

const handleViewTests = async (problemId: string) => {
	const sourceFilePath = await findProblemPath(problemId);
	const problemPathId = getProblemPathId({
		sourceFilePath,
		isRelative: true,
	});

	const problem = new Problem({
		problemId,
		problemPathId,
	});

	await problem.readAllTests();
	for (const [testIdx, test] of problem.tests.entries()) {
		if (testIdx !== problem.tests.length - 1) {
			printDividerLine();
		}

		test.print();
	}
};

const handleClearTests = async (problemId: string) => {
	const sourceFilePath = await findProblemPath(problemId);
	const problemPathId = getProblemPathId({
		sourceFilePath,
		isRelative: true,
	});

	const problem = new Problem({
		problemId,
		problemPathId,
	});

	await problem.clearTests();
	Logger.successLog('Test Files are All Deleted.');
};

const handleClearTest = async (problemId: string) => {
	const testIdx = Number(process.argv[4]);
	const sourceFilePath = await findProblemPath(problemId);
	const problemPathId = getProblemPathId({
		sourceFilePath,
		isRelative: true,
	});

	const problem = new Problem({
		problemId,
		problemPathId,
	});

	await problem.clearTest(testIdx);
	Logger.successLog(`Test ${testIdx} is Removed.`);
};

const handleCommitProblem = async (problemId: string) => {
	const sourceFilePath = await findProblemPath(problemId);
	const problemPathId = getProblemPathId({
		sourceFilePath,
		isRelative: true,
	});

	const problem = new Problem({
		problemId,
		problemPathId,
	});

	await commitProblem((problem.problemInfo as Record<string, string>), sourceFilePath);
};

const handleShowConfigs = () => {
	Logger.log(chalk.cyanBright('Current Configs'));
	Logger.infoLog(chalk.whiteBright(`Language: ${config.get('lang')}`));
	Logger.infoLog(chalk.whiteBright(`Timeout value: ${config.get('timeout')}`));
	Logger.infoLog(chalk.whiteBright(`Problem provider: ${config.get('provider')}`));
	Logger.infoLog(chalk.whiteBright(`PageSize: ${config.get('pageSize')}`));
};

(async function () {
	try {
		if (isFirstRun({name: projectName})) {
			await initConfigFilePaths();
		}

		checkArgumentLength(command, subCommand);

		if (command === 'config') {
			if (!subCommand) {
				handleShowConfigs();
				return;
			}

			const target = process.argv[3];

			switch (target) {
				case 'lang':
					await setProgrammingLanguage(process.argv[4]);
					break;
				case 'provider':
					setAPIProvider(process.argv[4]);
					break;
				case 'timeout':
					setTimeoutValue(Number(process.argv[4]));
					break;
				case 'code-template':
					await setSourceCodeTemplate();
					break;
				case 'commit-message':
					await setGitCommitMessageTemplate();
					break;
				case 'comment-template':
					await setCommentTemplate();
					break;
				default:
					throw new Error(`Unknown Config Name '${target}'`);
			}
		} else {
			await checkHealth();

			const problemId = process.argv[3];
			const provider: APIProvider = generateAPIProvider(config.get('provider'));

			switch (command) {
				case 'create':
					await handleCreate(problemId);
					break;
				case 'test':
					await handleTest(problemId, provider);
					break;
				case 'view-tests':
					await handleViewTests(problemId);
					break;
				case 'add-test':
					await handleAddTest(problemId);
					break;
				case 'clear-data':
					await clearAllTestData();
					break;
				case 'clear-tests':
					await handleClearTests(problemId);
					break;
				case 'clear-test':
					await handleClearTest(problemId);
					break;
				case 'open':
					await provider.openProblem(problemId);
					break;
				case 'commit':
					await handleCommitProblem(problemId);
					break;
				case 'help':
					Logger.log(helpMessage);
					break;
				default:
					throw new Error('Unknown Command');
			}

			process.exit(0);
		}
	} catch (error: any) {
		console.error(error);
		process.exit(1);
	}
})();

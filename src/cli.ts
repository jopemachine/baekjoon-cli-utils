#!/usr/bin/env node
import process from 'node:process';
import path from 'node:path';
import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import isFirstRun from 'first-run';
import {globby} from 'globby';
import chalk from 'chalk';
import meow from 'meow';
import updateNotifier from 'update-notifier';
import {
	checkHealth,
	clearAllTestData,
	config,
	getAuthenticationInfo,
	helpMessage,
	initConfigFilePaths,
	projectName,
	setAPIProvider,
	setAuthenticationInfo,
	setGitCommitMessageTemplate,
	setPageSizeValue,
	setProgrammingLanguage,
	setSourceCodeTemplate,
	setTimeoutValue,
} from './conf.js';
import {APIProvider} from './api-provider.js';
import {generateAPIProvider} from './api-provider-factory.js';
import {generateTestRunner} from './test-runner-factory.js';
import {TestRunner} from './test-runner.js';
import {Problem} from './problem.js';
import {ArgumentLengthError, NotValidFlagError} from './errors.js';
import {
	commitProblem,
	findProblemPath,
	getProblemFolderNames,
	getProblemPathId,
	getUnusedFilename,
	Logger,
	openEditor,
	printDividerLine,
	readFile,
} from './utils.js';
import {useSpinner} from './spinner.js';
import {inferLanguageCode, supportedLanguageInfo} from './lang.js';

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

const cli = meow(helpMessage, {
	importMeta: import.meta,
	flags: {
		// TODO: Implement below option in test runner
		verbose: {
			type: 'boolean',
			alias: 'v',
		},
		raw: {
			type: 'boolean',
			default: false,
		},
	},
});

const validateOptions = (inputs: string[], flags: typeof cli.flags) => {
	if (flags.raw) {
		if (inputs[0] !== 'test') {
			throw new NotValidFlagError(inputs[0], '--raw');
		}

		if (inputs.length < 3) {
			throw new ArgumentLengthError({actualLength: inputs.length, expectedLength: 3});
		}
	}
};

validateOptions(cli.input, cli.flags);
updateNotifier({pkg: cli.pkg}).notify();

const command = cli.input[0] ?? 'help';
const subCommand = cli.input[1];

const checkArgumentLength = (command: string, subCommand?: string) => {
	const expectedLengthDict = {
		'config show': 2,
		'config timeout': 3,
		'config provider': 3,
		'config code-template': 2,
		'config commit-message': 2,
		'config page-size': 3,
		'config user.id': 3,
		'config user.password': 3,
		create: 2,
		'add-test': 2,
		'edit-test': 3,
		'clear-cache': 1,
		'clear-test': 3,
		'clear-tests': 2,
		'view-tests': 2,
		open: 2,
		commit: 2,
	};

	const id = subCommand ? `${command} ${subCommand}` : command;

	if ((expectedLengthDict as any)[id] && cli.input.length !== (expectedLengthDict as any)[id]) {
		throw new ArgumentLengthError({
			expectedLength: (expectedLengthDict as any)[id],
			actualLength: cli.input.length,
		});
	}
};

const handleCreate = async (problemId: string, langCode?: string) => {
	const provider: APIProvider = generateAPIProvider(config.get('provider'));

	let paths = await useSpinner(globby(['**/*'], {onlyDirectories: true, caseSensitiveMatch: true}), 'Fetching Subdirectories');

	paths = [(await inquirer.prompt([{
		name: 'folder',
		message: 'Select A Directory To Save The Source Code',
		type: 'autocomplete',
		pageSize: Number(config.get('pageSize')),
		source: (_answers: any[], input: string) => getProblemFolderNames(paths!, input),
	}])).folder];

	langCode = langCode ?? config.get('lang');
	const {extension} = (supportedLanguageInfo as any)[langCode!];

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
	await provider.createProblem(pathToSave, problem, langCode!);
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

	const testIdx = cli.input.length > 2 ? Number(cli.input[2]) : undefined;

	const testRunner: TestRunner = await generateTestRunner(inferLanguageCode(sourceFilePath.split('.').pop()!));
	if (cli.flags.raw) {
		testRunner.setRawMode(true);
	}

	try {
		await testRunner.run({sourceFilePath, problem, testIdx});
	} catch (error: any) {
		if (error.name === 'TestsNotFoundError') {
			Logger.warningLog('No Test Case Found.');
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

	problem.generateTestFolder();
	const test = await problem.addManualTest();
	Logger.successLog(`Test ${test.testIdx} Added.`);
};

const handleEditTest = async (problemId: string, testIdx: number) => {
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
	const targetTest = problem.tests.find(test => test.testIdx === testIdx);
	if (!targetTest) {
		throw new Error(`Test ${testIdx} not found.`);
	}

	await openEditor(targetTest.getTestFilePath());
	await openEditor(targetTest.getAnswerFilePath());

	Logger.successLog(`Test ${testIdx} Updated.`);
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
		test.print();

		if (testIdx !== problem.tests.length - 1) {
			printDividerLine();
		}
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

const handleClearTest = async (problemId: string, testIdx: number) => {
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
	await problem.clearTest(testIdx);
	Logger.successLog(`Test ${testIdx} is Removed.`);
};

const handleCommitProblem = async (problemId: string, provider: APIProvider) => {
	const sourceFilePath = await findProblemPath(problemId);
	const problemPathId = getProblemPathId({
		sourceFilePath,
		isRelative: true,
	});

	const problem = new Problem({
		problemId,
		problemPathId,
	});

	await commitProblem(problem, sourceFilePath, provider);
};

const handleSubmit = async (problemId: string, provider: APIProvider) => {
	const sourceFilePath = await findProblemPath(problemId);
	await provider.submitProblem(problemId, await readFile(sourceFilePath));
};

// TODO: Refactor below function with using `boxen`
// https://github.com/sindresorhus/boxen
const handleShowConfigs = async () => {
	Logger.log(chalk.cyanBright('Current Configs'));
	Logger.infoLog(chalk.whiteBright(`Language: ${config.get('lang')}`));
	Logger.infoLog(chalk.whiteBright(`Timeout value: ${config.get('timeout')}`));
	Logger.infoLog(chalk.whiteBright(`Problem provider: ${config.get('provider')}`));
	Logger.infoLog(chalk.whiteBright(`Page size: ${config.get('pageSize')}`));

	printDividerLine();
	Logger.infoLog(chalk.whiteBright(`API Provider: ${config.get('provider')}`));
	const {id} = await getAuthenticationInfo(config.get('provider'));
	Logger.infoLog(chalk.whiteBright(`Logged in User Id: ${id}`));
};

const handleProblemOpen = async (problemId: string, provider: APIProvider) => {
	await provider.openProblem(problemId);
};

const handlePrintHelp = () => {
	Logger.log(`${cli.pkg.description}\n`);
	Logger.log(helpMessage);
	process.exit(0);
};

if (isFirstRun({name: projectName})) {
	await initConfigFilePaths();
}

checkArgumentLength(command, subCommand);

if (command === 'config') {
	if (!subCommand) {
		handlePrintHelp();
	}

	const target = cli.input[1];

	switch (target) {
		case 'show':
			await handleShowConfigs();
			break;
		case 'lang':
			await setProgrammingLanguage(cli.input[2]);
			break;
		case 'page-size':
			setPageSizeValue(Number(cli.input[2]));
			break;
		case 'provider':
			setAPIProvider(cli.input[2]);
			break;
		case 'timeout':
			setTimeoutValue(Number(cli.input[2]));
			break;
		case 'code-template':
			await setSourceCodeTemplate(config.get('lang'));
			break;
		case 'commit-message':
			await setGitCommitMessageTemplate();
			break;
		case 'user.id':
		case 'user.password':
			await setAuthenticationInfo(config.get('provider'), cli.input[1], cli.input[2]);
			break;
		default:
			throw new Error(`Unknown Config Name '${chalk.red(target)}'`);
	}
} else {
	await checkHealth();

	let testIdx;
	const problemId = cli.input[1];
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
		case 'edit-test':
			testIdx = Number(cli.input[2]);
			await handleEditTest(problemId, testIdx);
			break;
		case 'add-test':
			await handleAddTest(problemId);
			break;
		case 'clear-cache':
			await clearAllTestData();
			break;
		case 'clear-tests':
			await handleClearTests(problemId);
			break;
		case 'clear-test':
			testIdx = Number(cli.input[2]);
			await handleClearTest(problemId, testIdx);
			break;
		case 'open':
			await handleProblemOpen(problemId, provider);
			break;
		case 'commit':
			await handleCommitProblem(problemId, provider);
			break;
		case 'submit':
			await handleSubmit(problemId, provider);
			break;
		case 'help':
			handlePrintHelp();
			break;
		default:
			throw new Error(`Unknown Command '${chalk.red(command)}'`);
	}

	process.exit(0);
}


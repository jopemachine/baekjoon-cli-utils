import process from 'node:process';
import open from 'open';
import got, {Response} from 'got';
import {load} from 'cheerio';
import htmlToText from 'html-to-text';
import {launch} from 'puppeteer';
import pRace from 'p-race';
import {APIProvider} from '../api-provider.js';
import {Problem} from '../problem.js';
import {Test} from '../test.js';
import {delay, Logger} from '../utils.js';
import {useSpinner} from '../spinner.js';
import {config, getAuthenticationInfo} from '../conf.js';

const levels = [
	'Unrated',
	'Bronze 5',
	'Bronze 4',
	'Bronze 3',
	'Bronze 2',
	'Bronze 1',
	'Silver 5',
	'Silver 4',
	'Silver 3',
	'Silver 2',
	'Silver 1',
	'Gold 5',
	'Gold 4',
	'Gold 3',
	'Gold 2',
	'Gold 1',
	'Platinum 5',
	'Platinum 4',
	'Platinum 3',
	'Platinum 2',
	'Platinum 1',
	'Ruby 5',
	'Ruby 4',
	'Ruby 3',
	'Ruby 2',
	'Ruby 1',
];

class BaekjoonProvider extends APIProvider {
	constructor() {
		super();
		this.endPoints.origin = 'https://www.acmicpc.net';

		this.endPoints = {
			login: `${this.endPoints.origin}/login`,
			getProblem: `${this.endPoints.origin}/problem`,
			submitProblem: `${this.endPoints.origin}/submit`,
			getProblemTags: 'https://solved.ac/api/v3/problem/show',
			getProblemLevel: 'https://solved.ac/api/v3/problem/show',
			cssSelectors: {
				title: '#problem_title',
				input: '#problem_input',
				output: '#problem_output',
				description: '#problem_description',
				testInput: '#sample-input',
				testOutput: '#sample-output',
			},
		};
	}

	override async fetchProblemInfo(problem: Problem) {
		let response: Response<string>;

		try {
			response = await got([this.endPoints.getProblem!, problem.problemId].join('/'));
		} catch (error: any) {
			if (error.code === 'ERR_NON_2XX_3XX_RESPONSE') {
				Logger.errorLog('Problem not found in the provider server.\nPlease check if your problem identifier is valid.');
				process.exit(1);
			}

			throw error as Error;
		}

		const problemInfo = load(response.body);

		for (let testIdx = 1; ; ++testIdx) {
			const sampleInput = problemInfo(`${this.endPoints.cssSelectors!.testInput}-${testIdx}`);
			const sampleOutput = problemInfo(`${this.endPoints.cssSelectors!.testOutput}-${testIdx}`);
			const sampleInputTxt = sampleInput.text();
			const sampleOutputTxt = sampleOutput.text();

			if (!sampleInputTxt && !sampleOutputTxt) {
				break;
			}

			problem.tests.push(
				new Test({
					testIdx,
					problemPathId: problem.problemPathId,
					stdin: sampleInputTxt,
					expectedStdout: sampleOutputTxt,
				}),
			);
		}

		let tags;
		let level;
		try {
			const solveDacResponse: any = await got.get(`${this.endPoints.getProblemTags}?problemId=${problem.problemId}`).json();
			tags = solveDacResponse.tags.map((tag: any) => `${tag.key.charAt(0).toUpperCase()}${tag.key.slice(1)}`).join(' ');
			level = levels[solveDacResponse.level];
		} catch {
			Logger.errorLog('Solvedac sever connection error occurred');
		}

		problem.problemInfo = {
			id: problem.problemId,
			title: problemInfo(this.endPoints.cssSelectors!.title).text(),
			text: htmlToText.convert(problemInfo(this.endPoints.cssSelectors!.description).text(), {
				wordwrap: 75,
			}),
			input: htmlToText.convert(problemInfo(this.endPoints.cssSelectors!.input).text(), {
				wordwrap: 75,
			}),
			output: htmlToText.convert(problemInfo(this.endPoints.cssSelectors!.output).text(), {
				wordwrap: 75,
			}),
			url: [this.endPoints.getProblem!, problem.problemId].join('/'),
			tags,
			level,
		};
	}

	override async openProblem(problemId: string) {
		await open(`${this.endPoints.getProblem}/${problemId}`, {wait: false});
	}

	override async submitProblem(problemId: string, sourceCode: string) {
		const {id, password} = await getAuthenticationInfo(config.get('provider'));
		if (!id || !password) {
			throw new Error('User id or password not set');
		}

		const browser = await launch({args: ['--no-sandbox']});
		const loginPage = await browser.newPage();

		// TODO: Would be better to change below logic with pasting text after the below issue is resolved
		// https://github.com/puppeteer/puppeteer/issues/7888
		const context = browser.defaultBrowserContext();

		await useSpinner(async () => {
			await context.overridePermissions(this.endPoints.origin!, ['clipboard-read', 'clipboard-write']);
			await loginPage.setViewport({width: 1781, height: 1340});
			await loginPage.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
			await delay(1000);
		}, 'Puppeteer Configuration');

		await useSpinner(async () => {
			await loginPage.goto(this.endPoints.login!);
			await pRace<any>([
				loginPage.waitForNavigation(),
				delay(4000),
			]);
		}, 'Connecting Provider Login Page');

		await useSpinner(async () => {
			await loginPage.type('input[name="login_user_id"]', id);
			await loginPage.type('input[name="login_password"]', password);
			await delay(500);
			await loginPage.click('#submit_button');

			await pRace<any>([
				loginPage.waitForNavigation(),
				delay(4000),
			]);
		}, 'Authenticating Account');

		const cookies = await loginPage.cookies();
		const submitPage = await browser.newPage();
		await submitPage.setCookie(...cookies);

		await useSpinner(async () => {
			await submitPage.goto(`${this.endPoints.submitProblem!}/${problemId}`);
			await delay(1000);

			try {
				await submitPage.focus('.CodeMirror-lines');
			} catch {
				throw new Error('Login failed!');
			}
		}, 'Connecting Problem Submit Page');

		const escapedChars = new Set(['(', '[', '{']);

		const codeSegments = sourceCode.split(/([([{])/);
		for await (const codeSegment of codeSegments) {
			await submitPage.type('.CodeMirror-lines', codeSegment);
			if (escapedChars.has(codeSegment)) {
				await submitPage.keyboard.press('ArrowRight');
				await submitPage.keyboard.press('Backspace');
			}
		}

		await useSpinner(async () => {
			await delay(1000);
			await submitPage.click('#submit_button');
		}, 'Submitting Problem');

		await useSpinner(async () => {
			await loginPage.close();
			await submitPage.close();
			await browser.close();
		}, 'Exiting Puppeteer');
	}
}

export {
	BaekjoonProvider,
};

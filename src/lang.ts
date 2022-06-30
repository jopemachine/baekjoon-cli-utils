import {outdent} from 'outdent';

interface LanguageInfo {
	isCompiledLanguage: boolean;
	extensions: string[];
	extension: string;
}

enum supportedLanguageEnum {
	'c',
	'cpp',
	'javascript',
	'python',
	'go',
	'java',
	'swift',
	'ruby',
	'rust',
	// 'kotlin',
	// 'd'
}

const supportedLanguages = Object.values(supportedLanguageEnum).filter(value => typeof value === 'string') as string[];

const supportedLanguageInfo: Record<keyof typeof supportedLanguageEnum, LanguageInfo> = {
	cpp: {
		isCompiledLanguage: true,
		extensions: [
			'cpp',
		],
		extension: 'cpp',
	},
	javascript: {
		isCompiledLanguage: false,
		extensions: [
			'js',
		],
		extension: 'js',
	},
	python: {
		isCompiledLanguage: false,
		extensions: [
			'py',
		],
		extension: 'py',
	},
	go: {
		isCompiledLanguage: true,
		extensions: [
			'go',
		],
		extension: 'go',
	},
	java: {
		isCompiledLanguage: true,
		extensions: [
			'java',
		],
		extension: 'java',
	},
	swift: {
		isCompiledLanguage: true,
		extensions: [
			'swift',
		],
		extension: 'swift',
	},
	ruby: {
		isCompiledLanguage: false,
		extensions: [
			'rb',
		],
		extension: 'rb',
	},
	c: {
		isCompiledLanguage: true,
		extensions: [
			'c',
		],
		extension: 'c',
	},
	rust: {
		isCompiledLanguage: true,
		extensions: [
			'rs',
		],
		extension: 'rs',
	},
	// Kotlin: {
	// 	isCompiledLanguage: true,
	// 	extensions: [
	// 		'kt',
	// 	],
	// 	extension: 'kt',
	// },
	// d: {
	// 	isCompiledLanguage: true,
	// 	extensions: [
	// 		'd',
	// 	],
	// 	extension: 'd',
	// },
};

const defaultCommentTemplate = outdent`
  ==============================================================================================
  @ Title: {title}
  @ URL: {url}
  @ Problem:
  {text}
  @ Input: {input}
  @ Output: {output}
  ==============================================================================================
`;

const commentStartEnd: Record<keyof typeof supportedLanguageEnum, [string, string]> = {
	c: ['/*', '*/'],
	cpp: ['/*', '*/'],
	javascript: ['/*', '*/'],
	java: ['/*', '*/'],
	go: ['/*', '*/'],
	rust: ['/*', '*/'],
	swift: ['/*', '*/'],
	python: ['\'\'\'', '\'\'\''],
	ruby: ['=begin', '=end'],
};

const getDefaultCommentTemplate = (langCode: keyof typeof supportedLanguageEnum) => {
	const [start, end] = commentStartEnd[langCode];
	return outdent`${start}\n${defaultCommentTemplate}\n${end}`;
};

const isSupportedLanguage = (lang: string) =>
	supportedLanguages.includes(lang);

const inferLanguageCode = (extension: string) => {
	for (const langCode of supportedLanguages) {
		if ((supportedLanguageInfo as any)[langCode].extensions.includes(extension)) {
			return langCode;
		}
	}

	throw new Error(`Unsupported file extension: ${extension}`);
};

export {
	supportedLanguages,
	supportedLanguageInfo,
	inferLanguageCode,
	isSupportedLanguage,
	getDefaultCommentTemplate,
};

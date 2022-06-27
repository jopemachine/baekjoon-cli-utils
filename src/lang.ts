const supportedLanguages = {
	cpp: {
		isCompiledLanguage: true,
		extensions: [
			'c',
			'h',
			'cpp',
			'hpp',
		],
		extension: 'cpp',
	},
	js: {
		isCompiledLanguage: false,
		extensions: [
			'js',
		],
		extension: 'js',
	},
};

const isSupportedLanguage = (lang: string) =>
	Object.keys(supportedLanguages).includes(lang);

export {
	supportedLanguages,
	isSupportedLanguage,
};

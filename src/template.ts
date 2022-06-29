const processCommentTemplate = (template: string, problemInfoDict: Record<string, string>) => {
	let result = template;
	for (const key of Object.keys(problemInfoDict)) {
		result = template.replace(`{${key}}`, (problemInfoDict as any)[key]);
	}

	return result;
};

export {
	processCommentTemplate,
};

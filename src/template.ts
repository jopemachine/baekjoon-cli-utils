interface CommentTemplateDictionary {
	title: string;
}

const processCommentTemplate = (template: string, infoDict: CommentTemplateDictionary) => {
	let result = template;
	for (const key of Object.keys(infoDict)) {
		result = template.replace(`${key}`, (infoDict as any)[key]);
	}

	return result;
};

export {
	processCommentTemplate,
};

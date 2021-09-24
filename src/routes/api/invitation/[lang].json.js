import invitation from '$data/invitation.json';

export const get = async ({ params }) => {
	const { lang } = params;
	const match = invitation.find((d) => d.lang === lang);

	let others = invitation.find((d) => d.lang !== lang);
	let otherLang = Array.isArray(others) ? others.map((d) => d.lang) : others.lang;
	const body = { match, otherLang };
	return { body };
};

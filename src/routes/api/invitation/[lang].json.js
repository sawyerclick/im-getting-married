import invitation from '$data/invitation.json';

export const get = async ({ params }) => {
	const { lang } = params;
	const match = invitation.find((d) => d.lang === lang);

	let otherLangs = invitation.filter((d) => d.lang !== lang).map(d => d.lang)
	const body = { match, otherLangs };
	return { body };
};

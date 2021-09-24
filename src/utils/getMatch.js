export const get = async (data, { params }) => {
	const { name } = params;
	const match = data.find((d) => d.lang === name);
	return { match };
};
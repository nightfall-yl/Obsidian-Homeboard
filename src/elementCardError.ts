export class ElementCardError extends Error {
	summary: string;
	recommends?: string[];

	constructor({ summary, recommends }: { summary: string; recommends?: string[] }) {
		super(summary);
		this.name = "ElementCardError";
		this.summary = summary;
		this.recommends = recommends || [];
	}
}

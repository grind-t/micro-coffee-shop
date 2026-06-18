#!/usr/bin/env bun

import { $, argv } from "bun";
import { email } from "./constants";

const limit = Number(argv[2]) || 50;
const inboundTextRegex =
	/Comment:\s+(\S.*?)\s+(?:\d+\sпоследних\sкомментариев|Mobile\sapp)/s;
const outboundTextRegex = /(.*)\n\n.+<okdesk@termt.com>:\n\n>/s;

const ids = await fetchIds(limit);
const messages = await fetchMessages(ids);

console.log(JSON.stringify(messages));

async function fetchIds(maxResults) {
	const params = JSON.stringify({
		userId: "me",
		q: `from:${email} OR to:${email}`,
		maxResults,
	});

	return $`gws gmail users messages list --params ${params}`
		.json()
		.then(({ messages }) => messages.map(({ id }) => id));
}

async function fetchMessage(id) {
	const message = await $`gws gmail +read --id ${id} --format json`.json();
	const date = new Date(message.date).toISOString();
	const from = message.from.email;
	const inbound = from === email;
	const rawText = message.body_text.replace(/\r\n/g, "\n");
	const textRegex = inbound ? inboundTextRegex : outboundTextRegex;
	const text = textRegex.exec(rawText)?.[1]?.trim();

	return { date, inbound, text };
}

async function fetchMessages(ids, concurrency = 3) {
	const messages = [];

	for (let i = 0; i < ids.length; i += concurrency) {
		const idsChunk = ids.slice(i, i + concurrency);
		const promises = idsChunk.map(fetchMessage);
		const messagesChunk = await Promise.all(promises);

		messages.push(...messagesChunk.filter((m) => !!m.text?.trim()));
	}

	return messages;
}

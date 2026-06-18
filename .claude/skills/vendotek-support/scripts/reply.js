#!/usr/bin/env bun

import { $, argv } from "bun";
import { email } from "./constants";

const body = argv[2];
const attachments = argv.slice(3);

const id = await fetchLastMessageId();
const attachFlags = attachments.flatMap((f) => ["--attach", f]);
await $`gws gmail +reply --message-id ${id} --body ${body} ${attachFlags}`;

async function fetchLastMessageId() {
	const params = JSON.stringify({
		userId: "me",
		q: `from:${email}`,
		maxResults: 1,
	});

	return $`gws gmail users messages list --params ${params}`
		.json()
		.then(({ messages }) => messages[0].id);
}

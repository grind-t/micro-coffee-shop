#!/usr/bin/env bun

import { $, argv } from "bun";

const text = argv[2];
const files = argv.slice(3);

await $`wacli send text --to 8618032400546@s.whatsapp.net --message ${text}`;

for (const file of files) {
	await $`wacli send file --to 8618032400546@s.whatsapp.net --file ${file}`;
}

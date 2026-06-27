#!/usr/bin/env bun

import { $, argv } from "bun";

const limit = Number(argv[2]) || 20;
const { data } =
	await $`wacli messages list --chat 8618032400546@s.whatsapp.net --limit ${limit} --json`.json();

const messages = data.messages.map((m) => ({
	timestamp: m.Timestamp,
	incoming: !m.FromMe,
	text: m.Text,
	attachment: m.MediaType,
}));

console.log(JSON.stringify(messages));

import { describe, expect, it } from 'vitest'
import nock from 'nock'
import { fetch } from '../src';
import z from 'zod';

describe('Simple Fetch Tests', () => {
	it('fails and returns an FetchError of type `type_error`', async () => {
		nock('https://exmaple.com')
			.get('/type_error')
			.replyWithError({
				message: 'network error'
			});

		const result = await fetch('https://exmaple.com/type_error', {
			successSchema: z.any(),
			errorSchema: z.any()
		})

		expect(result._unsafeUnwrapErr().type).toBe('type_error')
	})

	it('fails and returns an FetchError of type `DOMException`', async () => {
		nock('https://exmaple.com')
			.get('/dom_error')
			.delay(300)
			.reply(100, 'success');

		const signal = new AbortController()

		setTimeout(() => {
			signal.abort()
		})

		const result = await fetch('https://exmaple.com/dom_error', {
			successSchema: z.string(),
			errorSchema: z.any(),
			signal: signal.signal
		})

		expect(result._unsafeUnwrapErr().type).toBe('dom_error')
	})

	it('fails and returns an FetchError of type `parse_error`, when the success response is not valid', async () => {
		nock('https://exmaple.com')
			.get('/parse_error')
			.reply(200, '{"success": true}');

		const result = await fetch('https://exmaple.com/parse_error', {
			successSchema: z.object({
				error: z.string()
			}),
			errorSchema: z.any()
		})

		expect(result._unsafeUnwrapErr().type).toBe('parse_error')
	})

	it('fails and returns an FetchError of type `parse_error`, when the error response is not valid', async () => {
		nock('https://exmaple.com')
			.get('/parse_error')
			.reply(400, []);

		const result = await fetch('https://exmaple.com/parse_error', {
			successSchema: z.object({
				error: z.string()
			}),
			errorSchema: z.string()
		})

		expect(result._unsafeUnwrapErr().type).toBe('parse_error')
	})

	it('fails and returns an FetchError of type `response_error`, when the response has status 500', async () => {
		nock('https://exmaple.com')
			.get('/response_error')
			.reply(500, '{"error": "something went wrong"}');

		const result = await fetch('https://exmaple.com/response_error', {
			successSchema: z.any(),
			errorSchema: z.object({
				error: z.string()
			})
		})

		expect(result._unsafeUnwrapErr().type).toBe('response_error')
	})

	it('fails and returns an FetchError of type `response_error`, when the response has status 404' , async () => {
		nock('https://exmaple.com')
			.get('/response_error')
			.reply(400, '{"error": "something went wrong"}');

		const result = await fetch('https://exmaple.com/response_error', {
			successSchema: z.any(),
			errorSchema: z.object({
				error: z.string()
			})
		})

		expect(result._unsafeUnwrapErr().type).toBe('response_error')
	})

	it('succeeds and returns a FetchSuccess', async () => {
		nock('https://exmaple.com')
			.get('/success')
			.reply(200, { status: 'success' });

		const result = await fetch('https://exmaple.com/success', {
			successSchema: z.object({
				status: z.string()
			}),
			errorSchema: z.any()
		})

		expect(result._unsafeUnwrap().data.status).toBe("success")
	})
})

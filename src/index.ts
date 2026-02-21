import { err, ok, Result } from "neverthrow";
import z, { ZodError, ZodTypeAny } from "zod";

// type error and dom exceptions are exceptions that can be thrown by fetch
// https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#exceptions
type FetchError<T> = {
	type: "response_error",
	error: Response & { data: T }
} | {
	type: "type_error",
	error: TypeError
} | {
	type: "parse_error",
	error: ZodError
} | {
	type: "dom_error",
	error: DOMException
}

type FetchSuccess<T> = Response & { data: T }

type FetchOptions<
	SuccessSchema extends ZodTypeAny,
	ErrorSchema extends ZodTypeAny
> = {
	baseUrl?: string;
	successSchema: SuccessSchema;
	errorSchema: ErrorSchema;
} & RequestInit;


/**
 * Performs a fetch request and parses the response according to the provided schemas. And returns a typesafe nverthrow result. Uses the default fetch under the hood.
 *
 * @alias fetch
 * @param url The url to fetch
 * @param options These options are for the most part identical to the default fetch options, with the only difference that they are also used to define the success and erro schemas.
 * @example
 *
	const result = await stretch('api.github.com/repos/quirinecker/stretch', {
		successSchema: z.object({
			id: z.number(),
			name: z.string(),
			description: z.string(),
			url: z.string(),
			license: z.object({
				key: z.string(),
				url: z.url(),
			})
		}),
		errorSchema: z.object({
			message: z.string(),
			documentation_url: z.url(),
			status: z.string()
		})
	})

	result.match(
		(success) => console.log(success),
		(error) => {
			switch (error.type) {
				case "response_error":
					console.log(error.error.data.documentation_url)
					break
				case "type_error":
					console.log(error.error)
					break
				case "parse_error":
					console.log(error.error)
					break
				case "dom_error":
					console.log(error.error)
					break
				default:
					console.log("unknown error")
					break
			}
		}
	)
 */
async function stretch<
	SuccessSchema extends ZodTypeAny,
	ErrorSchema extends ZodTypeAny
>(
	url: string,
	options: FetchOptions<SuccessSchema, ErrorSchema>
): Promise<Result<
	FetchSuccess<z.infer<SuccessSchema>>,
	FetchError<z.infer<ErrorSchema>>
>> {
	try {
		const composedUrl = new URL(options.baseUrl ?? '', url)
		const response = await fetch(composedUrl.toString(), options)

		if (response.ok) {
			const parsedResult = options.successSchema.safeParse(await response.json())
			if (parsedResult.success) {
				return ok({ ...response, data: parsedResult.data })
			} else return err({ type: "parse_error", error: parsedResult.error })
		} else {
			const parseResult = options.errorSchema.safeParse(await response.json())
			if (parseResult.success) {
				return err({ type: "response_error", error: { ...response, data: parseResult.data } })
			} else return err({ type: "parse_error", error: parseResult.error })
		}
	} catch (error) {
		if (error instanceof DOMException) {
			return err({ type: "dom_error", error })
		} else {
			return err({ type: "type_error", error })
		}
	}
}

/**
 * Creates a function with the same signature as the default fetch function of this library but with the provided options as default options.
 *
 * @param baseOptions The default options to use for the created function. You can also provide a function that returns the baseOptions. This function is executed every time before the fetch is executed. The function expects you to return an Promise
 * @returns A function with the same signature as the default fetch function of this library
 * @example
 *
	const getToken = async () => {
		return 'fancy token'
	}

	const githubFetch = createFetch({
		baseUrl: 'https://api.github.com',
	})

	const githubFetchWithAuth = createFetch(async () => {
		const token = await getToken()
		return {
			baseUrl: 'https://api.github.com',
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	})

	// for simplicity, we define the any schemas here
	const myPublicRepo = await githubFetch('repos/quirinecker/stretch', { successSchema: z.any(), errorSchema: z.any() })
	console.log(myPublicRepo)
	const myPrivateRepo = await githubFetchWithAuth('repos/quirinecker/stretch', { successSchema: z.any(), errorSchema: z.any() })
	console.log(myPrivateRepo)
 *
 */
function createFetch<
	ResultSchema extends ZodTypeAny,
	SuccessSchema extends ZodTypeAny
>(baseOptions: Partial<FetchOptions<SuccessSchema, ResultSchema>> | (() => Promise<Partial<FetchOptions<SuccessSchema, ResultSchema>>>)) {
	return async <
		ResultSchema extends ZodTypeAny,
		SuccessSchema extends ZodTypeAny
	>(url: string, options: FetchOptions<SuccessSchema, ResultSchema>) => {
		const evaluatedBaseOptions = typeof baseOptions === "function" ? await baseOptions() : baseOptions
		const optionsWithBase = { ...evaluatedBaseOptions, ...options }

		return await stretch(url, optionsWithBase)
	}
}

/**
 * Takes in base options similar to the createFetch function but returns a client object with predfined fetch functions popular http methods.
 *
 * @param baseOptions The default options to use for the created function. You can also provide a function that returns the baseOptions. This function is executed every time before the fetch is executed. The function expects you to return an Promise
 * @returns client object with predfined fetch functions popular http methods.
 * @example
 *
	const github = createFetchClient({
		baseUrl: 'https://api.github.com',
	})

	// for simplicity, we define the any schemas here
	const myPublicRepo = await github.get('repos/quirinecker/stretch', { successSchema: z.any(), errorSchema: z.any() })
	console.log(myPublicRepo)
	const myPrivateRepo = await github.get('repos/quirinecker/stretch', { successSchema: z.any(), errorSchema: z.any() })
	console.log(myPrivateRepo)
 */
function createFetchClient<
	ResultSchema extends ZodTypeAny,
	SuccessSchema extends ZodTypeAny
>(baseOptions: Partial<FetchOptions<SuccessSchema, ResultSchema>> | (() => Promise<Partial<FetchOptions<SuccessSchema, ResultSchema>>>)) {
	return {
		get: createFetch({ ...baseOptions, method: 'GET' }),
		post: createFetch({ ...baseOptions, method: 'POST' }),
		put: createFetch({ ...baseOptions, method: 'PUT' }),
		patch: createFetch({ ...baseOptions, method: 'PATCH' }),
		delete: createFetch({ ...baseOptions, method: 'DELETE' }),
		head: createFetch({ ...baseOptions, method: 'HEAD' }),
	}
}


export {
	createFetch,
	createFetchClient,
	stretch as fetch,
	stretch,
	FetchSuccess,
	FetchError,
	FetchOptions
}

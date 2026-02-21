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

async function createFetch<
	ResultSchema extends ZodTypeAny,
	SuccessSchema extends ZodTypeAny
>(baseOptions: Partial<FetchOptions<SuccessSchema, ResultSchema>>) {
	return async <
		ResultSchema extends ZodTypeAny,
		SuccessSchema extends ZodTypeAny
	>(url: string, options: FetchOptions<SuccessSchema, ResultSchema>) => {
		const optionsWithBase = { ...baseOptions, ...options }

		return await stretch(url, optionsWithBase)
	}
}

export {
	createFetch,
	stretch as fetch,
	stretch,
	FetchSuccess,
	FetchError,
	FetchOptions
}

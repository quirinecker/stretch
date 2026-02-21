import z from "zod";
import { fetch, createFetch, createFetchClient } from ".";

async function simpleFetchExample() {
	const result = await fetch('api.github.com/repos/quirinecker/stretch', {
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
}

async function createFetchExample() {
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
}

async function createFetchClientExample() {
	const github = createFetchClient({
		baseUrl: 'https://api.github.com',
	})

	// for simplicity, we define the any schemas here
	const myPublicRepo = await github.get('repos/quirinecker/stretch', { successSchema: z.any(), errorSchema: z.any() })
	console.log(myPublicRepo)
	const myPrivateRepo = await github.get('repos/quirinecker/stretch', { successSchema: z.any(), errorSchema: z.any() })
	console.log(myPrivateRepo)
}

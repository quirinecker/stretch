# Sretch

> A truly typesafe, functional and structured fetch libray for Node.js and the browser.

## Install

```bash
npm install @quirinecker/stretch
```

## Usage

This is a simple example of how to use stretch. In this example, we fetch repository data from GitHub. This library also exposes other functions. For examples on how to use these funcntions, you can check out the [examples](./src/examples.ts).

```typescript
import { fetch } from '@quirinecker/stretch'

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
```

## Libraries I found with that simmilar functionality

- [effect](https://effect.website/)
- [zodios](https://www.zodios.org/)

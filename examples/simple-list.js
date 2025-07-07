export default {
	$items: ['Apple', 'Banana', 'Cherry'], // Initial items
	document: {
		body: {
			style: {
				fontFamily: 'Arial, sans-serif',
				padding: '2em',
			},
			children: {
				prototype: 'Array',
				items: "window.$items",
				// items: ['Apple', 'Banana', 'Cherry'], // Initial items
				map: {
					tagName: 'p',
					textContent: 'item',
				},
			},
		},
	},
}
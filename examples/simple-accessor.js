export default {
	$items: ['Apple', 'Banana', 'Cherry'], // Initial items
	$currentItems: function () {
		return this.$items.get().join(', ');
	},
	document: {
		body: {
			style: {
				fontFamily: 'Arial, sans-serif',
				padding: '2em',
			},
			children: [
				{
					tagName: 'p',
					textContent: '${this.$currentItems()}',
				},
			],
		},
	},
}
export default {
	$userId: 1,
	$currentUser: function () {
		return this.$userId.get();
	},
	$userData: {
		prototype: 'Request',
		url: 'https://jsonplaceholder.typicode.com/users/${this.$currentUser()}',
	},
	$serializeUserData: function () {
		return JSON.stringify(this.$userData.get(), null, 2);
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
					textContent: '${this.$serializeUserData()}',
				},
			],
		},
	},
}
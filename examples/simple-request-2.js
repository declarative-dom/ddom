export default {
	$user: {
		id: 1,
		name: 'Leanne Graham',
		username: 'Bret',
	},
	$currentUser: function () {
		return this.$user.get();
	},
	$userData: {
		prototype: 'Request',
		url: 'https://jsonplaceholder.typicode.com/users/${this.$currentUser().id}',
	},
	$userColleagues: {
		prototype: 'Request',
		url: 'https://jsonplaceholder.typicode.com/users?company.name=${this.$userData?.company?.name}',
	},
	$serializeUserData: function () {
		return JSON.stringify(this.$userData.get(), null, 2);
	},
	$serializeUserColleagues: function () {
		return JSON.stringify(this.$userColleagues.get(), null, 2);
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
					textContent: 'User Data: ${this.$serializeUserData()}',
				},
				{
					tagName: 'h2',
					textContent: 'Colleagues from the same company:',
				},
				{
					tagName: 'p',
					textContent: 'Colleagues Data: ${this.$serializeUserColleagues()}',
				},
			],
		},
	},
}
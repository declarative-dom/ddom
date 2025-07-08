export default {
	// State signals for the app
	$selectedLocation: 'NYC',    // Currently selected location key
	$isLoading: false,           // Loading state
	$lastUpdated: null,          // Last update timestamp

	// Location coordinate mapping (static data)
	$locations: {
		'NYC': { lat: 40.7128, lon: -74.0060, name: 'New York City' },
		'LAX': { lat: 34.0522, lon: -118.2437, name: 'Los Angeles' },
		'CHI': { lat: 41.8781, lon: -87.6298, name: 'Chicago' },
		'DEN': { lat: 39.7392, lon: -104.9903, name: 'Denver' },
		'MIA': { lat: 25.7617, lon: -80.1918, name: 'Miami' },
		'SEA': { lat: 47.6062, lon: -122.3321, name: 'Seattle' },
		'BOS': { lat: 42.3601, lon: -71.0589, name: 'Boston' },
		'PHX': { lat: 33.4484, lon: -112.0740, name: 'Phoenix' },
		'HOU': { lat: 29.7604, lon: -95.3698, name: 'Houston' },
		'ATL': { lat: 33.7490, lon: -84.3880, name: 'Atlanta' },
	},

	// Reactive coordinates based on selected location
	$currentCoords: function () {
		return this.$locations.get()[this.$selectedLocation.get()];
	},

	// Auto-fetch weather data when location changes
	$weatherForecastAPI: {
		prototype: 'Request',
		url: 'https://api.weather.gov/points/${this.$currentCoords().lat},${this.$currentCoords().lon}',
		delay: 500 // Delay to prevent rapid API calls
	},

	// Auto-fetch weather data when location changes
	$weatherData: {
		prototype: 'Request',
		url: '${this.$weatherForecastAPI.get()?.properties?.forecast}',
		delay: 500 // Delay to prevent rapid API calls
	},

	// Auto-update loading state when weather data changes
	$autoLoadingUpdate: function () {
		const data = this.$weatherData.get();
		if (data && data.properties && data.properties.periods) {
			this.$isLoading.set(false);
			this.$lastUpdated.set(new Date().toLocaleString());
		}
	},

	// Get current weather period (first period from forecast)
	$currentWeather: function () {
		const data = this.$weatherData.get();
		return data?.properties?.periods?.[0] || null;
	},

	// Define the document structure
	document: {
		title: 'Aviation Weather - Declarative DOM',
		body: {
			style: {
				fontFamily: 'system-ui, -apple-system, sans-serif',
				padding: '2rem',
				backgroundColor: '#0f172a',
				minHeight: '100vh',
				margin: 0,
				color: '#e2e8f0',
			},
			children: [
				// Header
				{
					tagName: 'header',
					style: {
						textAlign: 'center',
						marginBottom: '2rem',
					},
					children: [
						{
							tagName: 'h1',
							textContent: '🌤️ Weather Dashboard',
							style: {
								color: '#f1f5f9',
								fontSize: '2.5rem',
								margin: '0 0 0.5rem 0',
								textShadow: '0 2px 4px rgba(0,0,0,0.3)',
							},
						},
						{
							tagName: 'p',
							textContent: 'Real-time weather forecast from National Weather Service',
							style: {
								color: '#94a3b8',
								fontSize: '1.1rem',
								margin: 0,
							},
						},
					],
				},

				// Controls section
				{
					tagName: 'section',
					style: {
						display: 'flex',
						gap: '1rem',
						justifyContent: 'center',
						marginBottom: '2rem',
						flexWrap: 'wrap',
					},
					children: [
						{
							tagName: 'select',
							style: {
								padding: '0.75rem 1rem',
								border: '2px solid #334155',
								borderRadius: '0.5rem',
								fontSize: '1rem',
								backgroundColor: '#1e293b',
								color: '#e2e8f0',
								cursor: 'pointer',
								minWidth: '200px',
							},
							onchange: function (event) {
								const location = event.target.value;
								window.$selectedLocation.set(location);
								window.$isLoading.set(true);
							},
							children: [
								{ tagName: 'option', value: 'NYC', textContent: 'New York City' },
								{ tagName: 'option', value: 'LAX', textContent: 'Los Angeles' },
								{ tagName: 'option', value: 'CHI', textContent: 'Chicago' },
								{ tagName: 'option', value: 'DEN', textContent: 'Denver' },
								{ tagName: 'option', value: 'MIA', textContent: 'Miami' },
								{ tagName: 'option', value: 'SEA', textContent: 'Seattle' },
								{ tagName: 'option', value: 'BOS', textContent: 'Boston' },
								{ tagName: 'option', value: 'PHX', textContent: 'Phoenix' },
								{ tagName: 'option', value: 'HOU', textContent: 'Houston' },
								{ tagName: 'option', value: 'ATL', textContent: 'Atlanta' },
							],
						},
						{
							tagName: 'button',
							textContent: '🔄 Refresh',
							style: {
								padding: '0.75rem 1.5rem',
								backgroundColor: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '0.5rem',
								fontSize: '1rem',
								cursor: 'pointer',
								fontWeight: '500',
								transition: 'all 0.2s',
								':hover': {
									backgroundColor: '#2563eb',
									transform: 'translateY(-1px)',
								},
							},
							onclick: function () {
								window.$weatherData.fetch();
							},
						},
					],
				},

				// Loading indicator
				{
					tagName: 'div',
					style: {
						textAlign: 'center',
						marginBottom: '1rem',
						height: '2rem',
					},
					attributes: {
						hidden: function () {
							return !window.$currentWeather();
						}
					},
					children: [
						{
							tagName: 'div',
							textContent: '🌤️ Fetching weather data...',
							style: {
								color: '#60a5fa',
								fontSize: '1.1rem',
								fontWeight: '500',
							},
						},
					],
				},
				// Main weather display
				{
					tagName: 'main',
					style: {
						display: 'flex',
						justifyContent: 'center',
						marginBottom: '2rem',
					},
					children: [
						{
							tagName: 'div',
							style: {
								maxWidth: '800px',
								width: '100%',
								backgroundColor: '#1e293b',
								borderRadius: '1rem',
								boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
								overflow: 'hidden',
								border: '1px solid #334155',
								display: '${window.$weatherData ? "block" : "none"}',
							},
							children: [
								// Airport header
								{
									tagName: 'div',
									style: {
										padding: '1.5rem',
										borderBottom: '1px solid #334155',
										backgroundColor: '#0f172a',
									},
									children: [
										{
											tagName: 'h2',
											textContent: '${window.$selectedLocation} - ${window.$currentWeather()?.name || "Current Forecast"}',
											style: {
												margin: '0 0 0.5rem 0',
												color: '#f1f5f9',
												fontSize: '1.5rem',
											},
										},
										{
											tagName: 'p',
											textContent: 'Forecast start time: ${this.$currentWeather()?.startTime ? new Date(this.$currentWeather().startTime).toLocaleString() : "N/A"}',
											style: {
												margin: 0,
												color: '#94a3b8',
												fontSize: '0.9rem',
											},
										},
									],
								},

								// Weather data grid
								{
									tagName: 'div',
									style: {
										padding: '1.5rem',
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
										gap: '1rem',
									},
									children: [
										// Temperature
										{
											tagName: 'div',
											style: {
												padding: '1rem',
												backgroundColor: '#0f172a',
												borderRadius: '0.5rem',
												textAlign: 'center',
											},
											children: [
												{
													tagName: 'div',
													textContent: '🌡️',
													style: {
														fontSize: '2rem',
														marginBottom: '0.5rem',
													},
												},
												{
													tagName: 'div',
													textContent: '${this.$currentWeather()?.temperature ? this.$currentWeather().temperature + "°F" : "N/A"}',
													style: {
														fontSize: '1.5rem',
														fontWeight: 'bold',
														color: '#60a5fa',
														marginBottom: '0.25rem',
													},
												},
												{
													tagName: 'div',
													textContent: 'Temperature',
													style: {
														fontSize: '0.875rem',
														color: '#94a3b8',
													},
												},
											],
										},

										// Wind
										{
											tagName: 'div',
											style: {
												padding: '1rem',
												backgroundColor: '#0f172a',
												borderRadius: '0.5rem',
												textAlign: 'center',
											},
											children: [
												{
													tagName: 'div',
													textContent: '💨',
													style: {
														fontSize: '2rem',
														marginBottom: '0.5rem',
													},
												},
												{
													tagName: 'div',
													textContent: '${this.$currentWeather()?.windSpeed || "N/A"}',
													style: {
														fontSize: '1.5rem',
														fontWeight: 'bold',
														color: '#34d399',
														marginBottom: '0.25rem',
													},
												},
												{
													tagName: 'div',
													textContent: 'Wind Speed',
													style: {
														fontSize: '0.875rem',
														color: '#94a3b8',
													},
												},
											],
										},

										// Weather Condition
										{
											tagName: 'div',
											style: {
												padding: '1rem',
												backgroundColor: '#0f172a',
												borderRadius: '0.5rem',
												textAlign: 'center',
											},
											children: [
												{
													tagName: 'div',
													textContent: '☀️',
													style: {
														fontSize: '2rem',
														marginBottom: '0.5rem',
													},
												},
												{
													tagName: 'div',
													textContent: '${this.$currentWeather()?.shortForecast || "N/A"}',
													style: {
														fontSize: '1.2rem',
														fontWeight: 'bold',
														color: '#fbbf24',
														marginBottom: '0.25rem',
													},
												},
												{
													tagName: 'div',
													textContent: 'Conditions',
													style: {
														fontSize: '0.875rem',
														color: '#94a3b8',
													},
												},
											],
										},

										// Wind Direction
										{
											tagName: 'div',
											style: {
												padding: '1rem',
												backgroundColor: '#0f172a',
												borderRadius: '0.5rem',
												textAlign: 'center',
											},
											children: [
												{
													tagName: 'div',
													textContent: '🧭',
													style: {
														fontSize: '2rem',
														marginBottom: '0.5rem',
													},
												},
												{
													tagName: 'div',
													textContent: '${this.$currentWeather()?.windDirection || "N/A"}',
													style: {
														fontSize: '1.5rem',
														fontWeight: 'bold',
														color: '#a78bfa',
														marginBottom: '0.25rem',
													},
												},
												{
													tagName: 'div',
													textContent: 'Wind Direction',
													style: {
														fontSize: '0.875rem',
														color: '#94a3b8',
													},
												},
											],
										},
									],
								},

								// Detailed Forecast
								{
									tagName: 'div',
									style: {
										padding: '1.5rem',
										borderTop: '1px solid #334155',
										backgroundColor: '#0f172a',
									},
									children: [
										{
											tagName: 'h3',
											textContent: 'Detailed Forecast',
											style: {
												margin: '0 0 0.75rem 0',
												color: '#f1f5f9',
												fontSize: '1.1rem',
											},
										},
										{
											tagName: 'p',
											textContent: '${this.$currentWeather()?.detailedForecast || "No detailed forecast available"}',
											style: {
												display: 'block',
												padding: '1rem',
												backgroundColor: '#1e293b',
												borderRadius: '0.375rem',
												fontSize: '0.9rem',
												color: '#e2e8f0',
												lineHeight: '1.5',
												border: '1px solid #334155',
												margin: 0,
											},
										},
									],
								},
							],
						},
					],
				},

				// No data message
				{
					tagName: 'div',
					style: {
						textAlign: 'center',
						padding: '3rem',
						display: '${this.$weatherData ? "none" : "block"}',
					},
					children: [
						{
							tagName: 'div',
							textContent: '🌤️',
							style: {
								fontSize: '4rem',
								marginBottom: '1rem',
							},
						},
						{
							tagName: 'h2',
							textContent: 'Select a location to view weather data',
							style: {
								color: '#94a3b8',
								margin: '0 0 0.5rem 0',
							},
						},
						{
							tagName: 'p',
							textContent: 'Choose a location from the dropdown above to get weather forecast information',
							style: {
								color: '#64748b',
								margin: 0,
							},
						},
					],
				},

				// Footer
				{
					tagName: 'footer',
					style: {
						textAlign: 'center',
						marginTop: '3rem',
						padding: '2rem',
						color: '#64748b',
					},
					children: [
						{
							tagName: 'p',
							textContent: 'Powered by National Weather Service & Declarative DOM',
							style: {
								margin: 0,
								fontSize: '0.9rem',
							},
						},
					],
				},
			],
		},
	},
};
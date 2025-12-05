Modern Weather Application

A beautiful, responsive Weather App built with JavaScript, OpenWeatherMap API, and Lottie animations.
It shows real-time weather, auto-location, 5-day forecast, dark/light mode, and smooth UI interactions.

🚀 Features
🌧 Lottie Weather Animations

Dynamic animated backgrounds change automatically based on weather conditions.

📍 Auto-Location Weather

Detects user location using browser geolocation and fetches weather instantly.

📅 5-Day Forecast

Displays upcoming weather trends, temperatures, and icons for the next five days.

🌙 Dark / Light Mode Toggle

User-friendly theme switcher with saved preferences via LocalStorage.

📱 Fully Responsive UI

Optimized for mobile, tablet, and desktop using a clean modern layout.

⚠️ Smart Error Handling

Handles:

Invalid API key (401)

City not found (404)

Network issues
With user-friendly notifications.

🔄 Refresh Weather

Instant refresh button with loading status and timestamp update.

🛠️ Tech Stack
Technology	Purpose
HTML5	Structure & layout
CSS3 (Glassmorphism + Gradients)	Beautiful UI
JavaScript (ES6+)	Logic & API communication
OpenWeatherMap API	Weather & forecast data
Lottie Web	Animated weather backgrounds
LocalStorage	Save theme & location data
📦 Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/yourname/weather-app.git
cd weather-app

2️⃣ Add Your API Key

Open script.js and replace:

const API_KEY = "API_KEY";


with your OpenWeatherMap key.

Get your key from:
➡ https://home.openweathermap.org/api_keys

Note: New keys may take 10–15 minutes to activate.

▶️ Run the Application

Simply open the file:

index.html


Or use Live Server in VS Code.

No backend required.

🔗 API Endpoints Used
Current Weather
https://api.openweathermap.org/data/2.5/weather

5-Day Forecast
https://api.openweathermap.org/data/2.5/forecast

📂 Project Structure
weather-app/
│── index.html
│── style.css
└── script.js

🧠 What You Learn from This Project

Fetching APIs using async/await

Reading API documentation

Handling HTTP status codes

Implementing UX-focused interactions

Building mobile-first responsive UI

Using animations with Lottie Web

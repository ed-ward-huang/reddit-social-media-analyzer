# Hate-Speech Twitter Analyzer

A React.js application for analyzing Twitter content to detect sentiment patterns and identify hate speech using advanced AI algorithms.

## Features

- **Sentiment Analysis**: Analyze emotional tone of tweets (Positive, Neutral, Negative)
- **Hate Speech Detection**: Identify and categorize harmful content (Racism, Sexism, Homophobia, etc.)
- **Engagement Analytics**: Track likes, retweets, and replies
- **Real-time Progress**: Live analysis progress bar with status updates
- **Interactive Charts**: Pie charts, bar charts, and line graphs for data visualization
- **Responsive Design**: Mobile and desktop friendly interface
- **Tweet Table**: Paginated table with detailed tweet analysis

## Tech Stack

- **React.js** (v18) - Frontend framework
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Chart.js & react-chartjs-2** - Data visualization
- **Lucide React** - Icon library

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd twitter-analytics/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── ErrorBoundary.js
│   ├── PrivateAccountError.js
│   ├── ProgressBar.js
│   ├── StatsCard.js
│   └── TweetTable.js
├── pages/              # Main pages
│   ├── About.js
│   ├── Dashboard.js
│   └── Home.js
├── data/               # Dummy data
│   └── dummyData.js
├── App.js              # Main App component
└── index.js            # Entry point
```

## Usage

1. **Home Page**: Enter a Twitter handle in the search bar and click "Analyze"
2. **Analysis**: Watch the real-time progress bar as the system processes tweets
3. **Results**: View comprehensive analytics including:
   - Overview statistics
   - Sentiment distribution charts
   - Hate speech categorization
   - Engagement metrics
   - Individual tweet analysis table
4. **Navigation**: Use the navigation menu to access the About page for more information

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Removes the single build dependency

## Dummy Data

The application currently uses dummy data for demonstration purposes. The data includes:

- Sample tweets with various sentiment scores
- Hate speech examples for different categories
- Engagement metrics (likes, retweets, replies)
- User statistics and analytics

## Future Enhancements

- Integration with Twitter API
- Real-time data processing
- Advanced ML models for detection
- User authentication
- Data export functionality
- Historical analysis tracking

## Educational Purpose

This project is developed for educational and research purposes to demonstrate:

- Modern React.js development patterns
- AI-powered content analysis concepts
- Data visualization techniques
- Responsive web design
- Content moderation approaches

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Disclaimer

This tool is for educational and research purposes only. The hate speech detection examples are fictional and used solely for demonstration. Always follow platform guidelines and ethical considerations when analyzing social media content.
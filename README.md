# Yolo Notes - Chrome Extension

Yolo Notes is a powerful Chrome extension that allows you to create, manage, and organize notes for specific websites. Keep your thoughts, reminders, and important information organized and easily accessible while browsing.

## Features

- 📝 Create and manage notes for any website
- 🔍 Search through all your notes
- 🏷️ Organize notes by website
- 📊 Dashboard view for all notes
- ⚡ Quick access through popup
- 🎨 Clean and modern user interface
- 💾 Local storage for data privacy

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The Yolo Notes icon should appear in your Chrome toolbar

## Usage

### Quick Notes (Popup)

1. Click the Yolo Notes icon in your Chrome toolbar
2. Type your note in the input field
3. Click "Add Note" or press Enter to save
4. View, edit, or delete your notes for the current website

### Dashboard

1. Open a new tab to access the dashboard
2. View all your notes across different websites
3. Use the search bar to find specific notes
4. Filter notes by website
5. Sort notes by creation or update date

## Project Structure

```
- assets/            # Extension icons and assets
- dashboard/         # Dashboard page files
  - dashboard.html   # Dashboard HTML layout
  - dashboard.css    # Dashboard styles
  - dashboard.js     # Dashboard functionality
- js/
  - storage.js      # Storage management module
- popup/            # Popup interface files
  - popup.html      # Popup HTML layout
  - popup.css       # Popup styles
  - popup.js        # Popup functionality
- manifest.json     # Extension manifest file
```

## Development

### Prerequisites

- Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript
- Understanding of Chrome Extension APIs

### Key Components

1. **Storage Module** (`js/storage.js`)
   - Handles all data operations
   - Uses Chrome's local storage API
   - Provides CRUD operations for notes

2. **Popup Interface** (`popup/`)
   - Quick access to website-specific notes
   - Create, edit, and delete notes
   - Real-time updates

3. **Dashboard** (`dashboard/`)
   - Global view of all notes
   - Advanced search and filtering
   - Bulk management features

### Technologies Used

- HTML5
- CSS3 (with Tailwind CSS)
- JavaScript (ES6+)
- Chrome Extension APIs
  - `chrome.storage`
  - `chrome.tabs`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Tailwind CSS for styling
- Icons from Heroicons
- Chrome Extension APIs documentation
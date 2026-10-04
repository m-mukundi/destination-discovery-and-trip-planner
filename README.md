# Destination Discovery & Trip Planner

A React-based destination discovery application that helps users search for destinations and explore useful travel information such as destination overviews and nearby places.

The application brings together information from multiple public APIs to provide a simple destination discovery experience.

## Live Demo

The app is deployed at: [https://destination-discovery-and-trip-plan.vercel.app/](https://destination-discovery-and-trip-plan.vercel.app/)

## Features

* Search for destinations by name
* Search for destinations worldwide
* Browse popular destination suggestions
* View real search results from Nominatim
* Select a destination and view its location information
* View a destination overview from Wikivoyage
* Discover nearby:

  * Attractions
  * Nature spots
  * Food and drinks
* Retrieve nearby places using the Overpass API
* Cache nearby-place results during the current session
* Responsive interface for desktop and smaller screens

## Technologies

* **React** — Frontend library
* **Vite** — Development server and build tool
* **JavaScript** — Application logic
* **Material UI** — User interface components and styling
* **React Router** — Client-side navigation
* **Nominatim / OpenStreetMap** — Destination search and geographical information
* **Overpass API / OpenStreetMap** — Nearby places and points of interest
* **Wikivoyage** — Destination overviews

## Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* Git

### Installation

Clone the repository:

```bash
git clone https://github.com/m-mukundi/destination-discovery-and-trip-planner.git
```

Navigate to the project directory:

```bash
cd destination-discovery-and-trip-planner
```

Install the project dependencies:

```bash
npm install
```

### Running the Application

Start the development server:

```bash
npm run dev
```

Vite will provide a local development URL in the terminal. Open that URL in your browser, usually:

```text
http://localhost:5173
```

## How to Use

1. Open the application.
2. Enter a destination in the search bar, or select one of the popular destinations.
3. Submit the search.
4. Browse the destinations returned by Nominatim.
5. Select a destination to open its destination page.
6. View the destination overview provided by Wikivoyage.
7. Explore nearby attractions, nature spots, and food and drink locations retrieved through the Overpass API.

## Application Flow

```text
Search Destination
        ↓
Nominatim
        ↓
Search Results
        ↓
Select Destination
        ↓
Destination Page
        ↓
 ┌───────────────┬────────────────┐
 │               │                │
Wikivoyage    Overpass       Destination
Overview       Nearby Places    Details
```

## Project Structure

```text
src/
├── components/
│   ├── OverviewCard.jsx
│   └── WeatherCard.jsx
├── hooks/
│   └── useNearbyPlaces.js
├── pages/
│   ├── SearchPage.jsx
│   ├── ResultsPage.jsx
│   └── DestinationPage.jsx
├── services/
│   ├── nominatim.js
│   ├── overpass.js
│   └── wikivoyage.js
├── App.jsx
├── App.css
├── index.css
└── main.jsx
```

## APIs

### Nominatim

Nominatim, provided by OpenStreetMap, is used to search for destinations and obtain geographical information such as:

* Destination name
* Coordinates
* Address information
* OpenStreetMap identifiers

### Overpass API

The Overpass API is used to retrieve nearby OpenStreetMap points of interest based on the selected destination's coordinates.

The application groups nearby places into categories including:

* Attractions
* Nature
* Food & Drinks

> **Note:** Overpass API results can take some time to load, so please give them a moment to appear. Occasionally the results may not load at all, for example when the public Overpass servers are busy. If this happens, try again later.

### Wikivoyage

Wikivoyage is used to retrieve a short overview of the selected destination.

The application also provides a source link to the relevant Wikivoyage page.

## Development

This project was developed collaboratively using Git and GitHub.

Features were developed on separate branches, reviewed through pull requests, and merged into the `main` branch after review.



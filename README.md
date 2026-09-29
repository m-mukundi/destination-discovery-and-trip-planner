# Destination Discovery and Trip Planner

## Description

This project is a destination discovery and trip-planning web application that allows users to search for a destination and progressively provides them with more information and functionality as the application develops.

### Phase 1: Destination Discovery

The first phase will focus on building a React application that consumes information from several public APIs. The user will enter the name of a destination, and the application will use the destination name to retrieve and display relevant information.

The application will use *Nominatim* to search for and identify the destination and obtain its geographical information. *Overpass API* will then be used to retrieve points of interest around the destination, such as museums, beaches, parks, restaurants, hotels, and galleries. *Wikivoyage* will provide general destination information and a brief overview of the location. *Open-Meteo* will optionally provide current or forecast weather information for the destination.

The user will therefore be able to search for a destination and receive a consolidated view containing:

- The name and location of the destination
- A brief description or overview of the destination
- Attractions and points of interest
- Optional weather information

At the end of this phase, the application will primarily function as a *destination discovery tool*, with the information being retrieved directly from external public APIs.

### Phase 2: Introducing Our Own API

In the second phase, the application will introduce a custom backend API that complements or replaces some of the external APIs used in Phase 1.

The custom API will allow the application to maintain and serve information that is not available through the initial public APIs, including hotel listings, destination ratings, user reviews, and opinions from people who have visited a destination.

The application will therefore move from simply aggregating publicly available destination information to maintaining its own destination-related data. The React frontend will consume both the external APIs and the application's own API where appropriate.

### Phase 3: User Accounts and Trip Planning

The third phase will introduce personalized trip-planning functionality. Users will be able to create an account and log in to save and manage their trips.

There will be two main ways for a user to begin using the trip-planning functionality.

First, a user can search for a destination using the destination discovery feature. After viewing the destination information, they will have the option to *Create a Trip* for that destination. They can then select their travel dates, create daily itineraries, save attractions they are interested in, and add personal notes.

Alternatively, a user can start by creating a trip and then search for a destination from within the trip-planning experience. Once a destination has been selected, the same destination information and planning features will be available.

During the planning process, users will be able to:

- Set their trip dates
- Create itineraries for individual days
- Add attractions and other points of interest to their itinerary
- Star or save places they are interested in visiting
- Add personal notes
- Track the status of their trip, such as planned, in progress, or completed
- Leave a review after completing their trip

The final application will therefore progress from a *destination information and discovery application, to a **destination data platform, and eventually into a **personalized trip-planning application*.

## Users

### 1. Visitor / Unauthenticated User

A visitor can use the core destination discovery functionality without creating an account.

They can:

- Search for a destination
- View information about the destination
- View a description or overview of the destination
- View attractions and points of interest
- View available hotels, restaurants, parks, museums, beaches, and galleries
- View available weather information

### 2. Registered User

A registered user has access to personalized trip-planning functionality.

They can:

- Create an account and log in
- Search for destinations
- Create a trip for a destination
- Set trip dates
- Create daily itineraries
- Add attractions and points of interest to an itinerary
- Star/save places they are interested in visiting
- Add notes to their trip
- Track the status of their trip
- View and manage their planned trips
- Mark trips as in progress or completed
- Leave a review after completing a trip

## Minimum Viable Product (Key Features)

The MVP will focus primarily on *Phase 1: Destination Discovery*, while establishing the structure that can later support the application's custom API and trip-planning functionality.

- Search for a destination by name
- Use *Nominatim* to identify and locate the destination
- Use *Overpass API* to retrieve nearby points of interest
- Display attractions such as museums, beaches, parks, restaurants, hotels, and galleries
- Use *Wikivoyage* to provide a brief overview of the destination
- Use *Open-Meteo* to optionally provide weather information
- Display the retrieved destination information in a clean, user-friendly React interface
- Provide a *Create a Trip* entry point that prepares the application for the Phase 3 trip-planning functionality

### Planned Future Features

*Phase 2 — Custom API*

- Custom backend API
- Hotel listings
- Destination ratings
- Destination reviews
- Visitor opinions
- Integration between the React frontend and the custom API

*Phase 3 — Trip Planning*

- User registration and authentication
- Create and manage trips
- Set trip dates
- Create day-by-day itineraries
- Star/save attractions
- Add notes
- Track trip status
- Mark trips as in progress or completed
- Submit reviews after completing a trip

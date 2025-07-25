Spotify Track Quiz Game
========================

A web-based interactive quiz game where players listen to Spotify tracks and identify the correct one from multiple choices. Built with Next.js, Convex, and the Spotify Web API.


Features
--------

- Track-Based Quiz Gameplay  
  Players are presented with a list of tracks and must identify the correct one.

- Dynamic Feedback  
  Real-time UI updates show whether the user selected the correct or incorrect track.

- Custom Game Generation  
  Create new games with randomized tracks filtered by time range (short, middle, long).

- Responsive UI  
  Designed with Tailwind CSS and Shadcn UI to support mobile and desktop screens.


Tech Stack
----------

- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI  
- Backend: Convex (real-time database & functions)  
- API Integration: Spotify Web API  


Installation
------------

1. Clone the repository:
   git clone https://github.com/Kadoros/spotify-quiz-game.git
   cd spotify-quiz-game

2. Install dependencies:
   npm install

3. Set up environment variables:

   Create a `.env.local` file with the following:

   NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id  
   NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret  
   NEXT_PUBLIC_CONVEX_URL=https://your-convex-url

4. Start the development server:
   npm run dev


Project Structure
-----------------

/app
  /game             → Main game components
/components/ui      → Shadcn UI components
/convex             → Backend functions and API routes
/types              → Shared TypeScript types


Deployment
----------

This project can be deployed with Vercel or any platform that supports Next.js App Router.  
Make sure to configure environment variables and set up Convex in your deployed environment.


License
-------

MIT License © 2025 [Hyeon Jegal]

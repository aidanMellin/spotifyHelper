#SpotifyHelper

Welcome! This is a small project that I built to familiarize myself more with the SpotifyAPI / Spotipy library, with the added bonus of finally allowing me to separate and shrink my playlists into more manageable sizes.  

As an added bonus, this allows me to use the ID of a song (or multiple ID's) to sift through my now 1800 song playlist and generate recommendations to share with friends of songs that I am intimately familiar with.

## Pre-run checklist
### Install Dependencies
You need pip, and all that should be necessary is
`pip install -r requirements.txt`
 
<details>
<summary>Alternatively you can view this list of dependencies</summary>
<br>
<ul>
  <li>Flask</li>
  <li>Spotipy</li>
  <li>python-dotenv</li>
  <li>requests</li>
  <li>flask-socketio</li>
  <li>eventlet</li>
</ul>
</details>

### Configure DOTENV
As blank .env's are sometimes removed from this repo as I don't particularly want to leak my secret ID's, the template is below. Spotify shows how to get a project started [here](https://developer.spotify.com/documentation/web-api)

After that is done, just create a .env in the base directory of this project and fill in with info below:

SPOTIFY_CLIENT_ID='CLIENT_ID'
SPOTIFY_CLIENT_SECRET='CLIENT_SECRET_OF_PROJECT'
SPOTIFY_REDIRECT_URI='http://127.0.0.1:5000/callback' #Leave this, or change to your own redirect URI
FLASK_SECRET_KEY='GENERATE_YOURSELF' #os.urandom(24).hex()

## Running the app
### Should be as simple as
`flask run`
and open http://127.0.0.1:5000


from flask import Flask, request, redirect, session, render_template
from dotenv import load_dotenv
import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth


load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')

sp_oauth = SpotifyOAuth(
    client_id=os.getenv('SPOTIFY_CLIENT_ID'),
    client_secret=os.getenv('SPOTIFY_CLIENT_SECRET'),
    redirect_uri=os.getenv('SPOTIFY_REDIRECT_URI'),
    scope='playlist-read-private user-read-playback-state user-modify-playback-state'
)

def get_spotify_oauth():
    return SpotifyOAuth(
        client_id=os.getenv('SPOTIFY_CLIENT_ID'),
        client_secret=os.getenv('SPOTIFY_CLIENT_SECRET'),
        redirect_uri=os.getenv('SPOTIFY_REDIRECT_URI'),
        scope='playlist-read-private user-read-playback-state user-modify-playback-state'
    )

def get_authenticated_spotify():
    sp_oauth = get_spotify_oauth()
    token_info = session.get('token_info', None)

    if not token_info:
        return None  # Token not in session

    if sp_oauth.is_token_expired(token_info):
        token_info = sp_oauth.refresh_access_token(token_info['refresh_token'])
        session['token_info'] = token_info

    return spotipy.Spotify(auth=token_info['access_token'])

@app.route('/')
def home():
    return '''
        <h1>Welcome to the Spotify App!</h1>
        <a href="/login"><button>Login with Spotify</button></a>
    '''

@app.route('/login')
def login():
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    token_info = get_spotify_oauth().get_access_token(code)
    session['token_info'] = token_info
    return redirect('/playlists')

@app.route('/playlists')
def show_playlists():
    sp = get_authenticated_spotify()
    if not sp:
        return redirect('/login')
    return display_playlists(sp)

@app.route('/logout')
def logout():
    for key in list(session.keys()):
        session.pop(key)
    return redirect('/')

def display_playlists(sp):
    results = sp.current_user_playlists(limit=50)
    playlists = results['items']
    while results['next']:
        results = sp.next(results)
        playlists.extend(results['items'])
    return render_template('playlists.html', playlists=playlists)


def get_key_and_mode(key, mode):
    keys = [
        "C", "C♯/D♭", "D", "D♯/E♭", "E", "F",
        "F♯/G♭", "G", "G♯/A♭", "A", "A♯/B♭", "B"
    ]
    # Check if key is within the range of 0-11, which are valid key values
    key_str = keys[key] if key in range(0, 12) else "N/A"
    mode_str = "Major" if mode == 1 else "Minor" if mode == 0 else "N/A"
    return f"{key_str} {mode_str}"

@app.route('/playlist/<playlist_id>')
def playlist_tracks(playlist_id):
    sp = get_authenticated_spotify()
    results = sp.playlist_tracks(playlist_id)
    unfiltered = [item['track'] for item in results['items'] if item['track'] is not None]
    tracks = []


    # import pdb; pdb.set_trace()
    while results['next']:  # Handle pagination
        results = sp.next(results)
        unfiltered = [item['track'] for item in results['items'] if item['track'] is not None]

    for track in unfiltered:
        # Get the audio features for the track
        features = sp.audio_features(track["id"])[0] 
        key_mode = get_key_and_mode(features['key'], features['mode'])

        # Remove unwanted keys
        keys_to_remove = ["type", "analysis_url", "duration_ms", "id", "track_href", "uri", "key", "mode", "time_signature"]
        for key in keys_to_remove:
            features.pop(key, None)  # Use None as the default to avoid KeyError if the key is not present

        # Add the popularity to the features
        features['popularity'] = track["popularity"]
        features['key_mode'] = key_mode


        # import pdb; pdb.set_trace()
        # Construct the dictionary for this track
        tracks.append({
            "id": track["id"],
            "name": track["name"],
            "album": track["album"],
            "release_date": track["album"]["release_date"],
            "uri": track["uri"],
            "features": features
        })

    return render_template('tracks.html', tracks=tracks)

if __name__ == '__main__':
    app.run(debug=True)

from flask import Flask, request, redirect, session, render_template, jsonify, url_for
from dotenv import load_dotenv
import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import logging
from datetime import datetime
import time

from algo import Algorithm  # Import the Algorithm class

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')

sp_oauth = SpotifyOAuth(
    client_id=os.getenv('SPOTIFY_CLIENT_ID'),
    client_secret=os.getenv('SPOTIFY_CLIENT_SECRET'),
    redirect_uri=os.getenv('SPOTIFY_REDIRECT_URI'),
    scope='playlist-read-private user-read-playback-state user-modify-playback-state playlist-modify-public playlist-modify-private'
)

# Dictionary to store Algorithm instances and their excluded songs
algorithm_instances = {}

def get_spotify_oauth():
    return SpotifyOAuth(
        client_id=os.getenv('SPOTIFY_CLIENT_ID'),
        client_secret=os.getenv('SPOTIFY_CLIENT_SECRET'),
        redirect_uri=os.getenv('SPOTIFY_REDIRECT_URI'),
        scope='playlist-read-private user-read-playback-state user-modify-playback-state playlist-modify-public playlist-modify-private',
        cache_path="token_info.txt"
    )

@app.route('/debug-env')
def debug_env():
    return jsonify({
        "Client ID": os.getenv('SPOTIFY_CLIENT_ID'),
        "Redirect URI": os.getenv('SPOTIFY_REDIRECT_URI')
    })

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
    logged_in = 'token_info' in session
    return render_template('home.html', logged_in=logged_in)

@app.route('/login')
def login():
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    token_info = get_spotify_oauth().get_access_token(code)
    session['token_info'] = token_info
    return redirect('/')

@app.route('/organizing', methods=['GET', 'POST'])
def organizing():
    sp = get_authenticated_spotify()
    if not sp:
        return redirect('/login')
    
    if request.method == 'POST':
        playlist_id = request.form.get('playlist_id')
        tracks_info = getSongsFromPlaylist(playlist_id)
        return render_template('select_songs.html', tracks_info=tracks_info, playlist_id=playlist_id)
    
    playlists = get_playlists(sp)
    return render_template('organizing.html', playlists=playlists)

@app.route('/process_songs', methods=['POST'])
def process_songs():
    sp = get_authenticated_spotify()
    if not sp:
        return redirect('/login')
    
    selected_track_ids = request.form.getlist('track_ids')
    num_songs = int(request.form.get('num_songs'))
    playlist_id = request.form.get('playlist_id')
    temp_key = request.form.get('temp_key')

    tracks_info = getSongsFromPlaylist(playlist_id)
    selected_tracks_info = [track for track in tracks_info if track['id'] in selected_track_ids]

    if not selected_tracks_info:
        return "No tracks selected", 400

    if temp_key and temp_key in algorithm_instances:
        algo, excluded_songs = algorithm_instances[temp_key]
    else:
        algo = Algorithm()
        algo.processSongs(tracks_info)
        algo.setPlaylist_Length(num_songs)
        algo.setConsideredSongs([track["id"] for track in selected_tracks_info])
        excluded_songs = []
        temp_key = str(datetime.now().timestamp())
        algorithm_instances[temp_key] = (algo, excluded_songs)
    
    playlist = algo.generate_playlist()

    return render_template('results.html', playlist=playlist, temp_key=temp_key, playlist_id=playlist_id, num_songs=num_songs)

@app.route('/regenerate_playlist', methods=['POST'])
def regenerate_playlist():
    temp_key = request.form.get('temp_key')
    new_exclude_track_ids = request.form.getlist('exclude_track_ids')

    if temp_key in algorithm_instances:
        algo, excluded_songs = algorithm_instances[temp_key]

        # Update the excluded songs list
        excluded_songs.extend(new_exclude_track_ids)
        excluded_songs = list(set(excluded_songs))  # Remove duplicates

        # Add non-excluded songs to considered songs and update algorithm weights
        all_track_ids = [track['id'] for track in algo.songs]
        non_excluded_songs = [track_id for track_id in all_track_ids if track_id not in excluded_songs]
        algo.updateConsideredSongs(non_excluded_songs)
        algo.setExcludeSongs(excluded_songs)

        # Recalculate the weights
        algo.calculateUserWeights()

        # Generate a new playlist
        new_playlist = algo.generate_playlist()
        return jsonify({'playlist': new_playlist})
    else:
        return jsonify({'error': 'Algorithm instance not found'}), 400

@app.route('/create_playlist/<temp_key>', methods=['POST'])
def create_playlist(temp_key):
    sp = get_authenticated_spotify()
    if not sp:
        return redirect('/login')
    
    form_data = request.form
    playlist_name = form_data.get('playlist_name')
    playlist = algorithm_instances[temp_key][0].generate_playlist()
    track_uris = [track['uri'] for track in playlist]

    user_id = sp.current_user()['id']
    new_playlist = sp.user_playlist_create(user_id, playlist_name)
    sp.user_playlist_add_tracks(user_id, new_playlist['id'], track_uris)

    return redirect(f"https://open.spotify.com/playlist/{new_playlist['id']}")

@app.route('/playlists')
def show_playlists():
    sp = get_authenticated_spotify()
    if not sp:
        return redirect('/login')
    playlists = get_playlists(sp)
    return render_template('playlists.html', playlists=playlists)

@app.route('/logout')
def logout():
    for key in list(session.keys()):
        session.pop(key)
    return redirect('/')

@app.route('/clear-tokens')
def clear_tokens():
    for key in list(session.keys()):
        session.pop(key)
    return redirect('/login')

def get_playlists(sp):
    results = sp.current_user_playlists(limit=50)
    playlists = results['items']
    while results['next']:
        results = sp.next(results)
        playlists.extend(results['items'])
    return playlists

def get_key_and_mode(key, mode):
    keys = [
        "C", "C♯/D♭", "D", "D♯/E♭", "E", "F",
        "F♯/G♭", "G", "G♯/A♭", "A", "A♯/B♭", "B"
    ]
    key_str = keys[key] if key in range(0, 12) else "N/A"
    mode_str = "Major" if mode == 1 else "Minor" if mode == 0 else "N/A"
    return f"{key_str} {mode_str}"

def getSongsFromPlaylist(playlist_id):
    sp = get_authenticated_spotify()
    if not sp:
        return redirect('/login')  # Ensure the user is authenticated
    
    results = sp.playlist_tracks(playlist_id, limit=100)
    track_ids = []
    artist_ids = set()

    while results:
        for item in results['items']:
            track = item['track']
            if track:
                track_ids.append(track['id'])
                for artist in track['artists']:
                    artist_ids.add(artist['id'])
                logging.info(f'Song count updated: {len(track_ids)}')
        if not results['next']:
            break
        results = sp.next(results)

    logging.info(f'Total songs fetched: {len(track_ids)}')

    genres_dict = {}
    artist_list = list(artist_ids)
    for i in range(0, len(artist_list), 50):
        batch_ids = artist_list[i:i+50]
        artists_info = sp.artists(batch_ids)
        for artist in artists_info['artists']:
            genres_dict[artist['id']] = artist.get('genres', [])

    features_list = []
    for i in range(0, len(track_ids), 100):
        end_index = min(i + 100, len(track_ids))
        batch_ids = track_ids[i:end_index]
        try:
            features_list.extend(sp.audio_features(batch_ids))
        except spotipy.exceptions.SpotifyException as e:
            if e.http_status == 429:
                retry_after = e.headers.get('Retry-After')
                sleep_time = int(retry_after) if retry_after else 10
                logging.warning(f"Rate limit hit, sleeping for {sleep_time} seconds.")
                time.sleep(sleep_time)
                features_list.extend(sp.audio_features(batch_ids))
            else:
                raise

    features_dict = {feature['id']: feature for feature in features_list if feature}

    results = sp.playlist_tracks(playlist_id, limit=100)
    tracks_info = []
    while results:
        for item in results['items']:
            track = item['track']
            if track and track['id'] in features_dict:
                features = features_dict[track['id']]
                key_mode = get_key_and_mode(features['key'], features['mode'])
                keys_to_remove = ["type", "analysis_url", "duration_ms", "id", "track_href", "uri", "key", "mode", "time_signature"]
                for key in keys_to_remove:
                    features.pop(key, None)
                
                features['popularity'] = track["popularity"]
                features['key_mode'] = key_mode
                track_genres = [genres_dict[artist['id']] for artist in track['artists'] if artist['id'] in genres_dict]
                features['genres'] = list(set(sum(track_genres, [])))

                tracks_info.append({
                    "id": track['id'],
                    "name": track['name'],
                    "artists": track['artists'],
                    "album": track['album'],
                    "release_date": track['album']['release_date'],
                    "uri": track['uri'],
                    "features": features
                })

        if not results['next']:
            break
        results = sp.next(results)

    return tracks_info

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

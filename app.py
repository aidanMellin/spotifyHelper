from flask import Flask, request, redirect, session
import spotipy
from spotipy.oauth2 import SpotifyOAuth

app = Flask(__name__)
app.secret_key = 'some-random-key'  # Needed for session management

@app.route('/')
def index():
    return 'Hello, Spotify!'

app.config['SESSION_COOKIE_NAME'] = 'spotify-login-session'

# Set up Spotify OAuth
sp_oauth = SpotifyOAuth(
    client_id='your-client-id',
    client_secret='your-client-secret',
    redirect_uri='http://localhost:5000/callback',
    scope='playlist-read-private')

@app.route('/login')
def login():
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    token_info = sp_oauth.get_access_token(code)
    session['token_info'] = token_info
    return redirect('/')

@app.route('/logout')
def logout():
    for key in list(session.keys()):
        session.pop(key)
    return redirect('/')


if __name__ == '__main__':
    app.run(debug=True)

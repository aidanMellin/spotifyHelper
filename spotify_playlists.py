"""
Author: Aidan Mellin
Language: python3
Description: An application used for automating the creation of playlists in Spotify through Spotify Dev API specifically adding content through playlists
through artists and albums

The parameter intake is yet to be decided but in order to determine whether the program is searching for artists to add or albums will be determined through a
hyphen system, probably --art --alb and --t --art

This will probably be done through a configuration file where the precondition is that each new entry will be on the next line

The user will have the capability to make a custom name for their playlist as described through the config, but that comes later

I will also probably branch this into bath removing songs / artists from a playlist

ALL WEB API REQUESTS MODELED FROM https://developer.spotify.com/documentation/web-api/reference/

//TODO:
Playlist integration
"Personalization" - API Can pull User's top artists and tracks
GUI
Autoplay configuration through bat files

"""

import json
import os
import requests
import string
import webbrowser

from secrets import spot_user_id, spotify_token, client_id, client_secret

class playlist_create:
    
    def __init__(self):
        pass

    def create(self,title):
        """
        Create the blank playlist with designated title and return the playlist id to be populated with the user's songs
        """
        request_body = json.dumps({
            'name': '{}'.format(title),
            'description': 'Playlist created using the Python Spotify Playlist Creator tool'
        })

        query = 'https://api.spotify.com/v1/users/{}/playlists'.format(spot_user_id)

        response = requests.post(
            query,
            data = request_body,
            headers = {
                'Accept':'application/json',
                'Content-Type':'application/json',
                'Authorization':'Bearer {}'.format(spotify_token)
            }
        )
        response_json = response.json()

        # playlist id
        return response_json["id"]
    
    def get_uri(self, u_input, u_type):
        '''
        This method gets the URIs of the designated songs, and returns them all in a concatenated string separated by commas
        :param: u_input -> full length string to be sent as a query
        :param: u_type -> determines how the program will go about querying Spotify for the right track(s)

        :precondition: u_input is already in a form to be sent as a query
        '''
        uri_list = ''
        
        #Utypes are as follows:
            # -Single song -- sing
            # -Top {x} of an artist --top
            # -Album --alb
        
        if(u_type == "sing"):
            #If it is a single, song must be searched by using track: {} artist:{}
            #:PRECON: the whole ass string is already formatted in the type as -> 'track%3AFred%20astaire%20artist%3AJukebox%20the%20Ghost' 
            # where %3A represents ':' and %20 represents ' '
            query = 'https://api.spotify.com/v1/search?q={}&type=track'.format(u_input)
            response = requests.get(
            query,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer {}".format(spotify_token)
            }
            )
            response_json = response.json()['tracks']['items']
            uri_list += response_json[0]['uri']
            
        elif (u_type == "top"):
            #Search for top 10 songs from artist
            query = "https://api.spotify.com/v1/search?q={}&type=artist".format(u_input)
            response = requests.get(
                query,
                headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer {}".format(spotify_token)
            } 
            )
            id = response.json()['artists']['items'][0]['uri']
            id = id.replace("spotify:artist:","")

            query = "https://api.spotify.com/v1/artists/{}/top-tracks?country=US".format(id)
            response = requests.get(
                query,
                headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer {}".format(spotify_token)
                }
            )
            response_json = response.json()['tracks']
            for i in range(10):
                uri_list += response_json[i]['uri']+","
   
        elif (u_type == "alb"):
            #Probably don't have to figure out size of album and leave the limit call blank
            query = "https://api.spotify.com/v1/search?q={}&type=album".format(u_input)
            response = requests.get(
                query,
                headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer {}".format(spotify_token)
                }
            )
            response_json = response.json()['albums']['items']
            total_tracks = int(response_json[0]['total_tracks'])
            id = response_json[0]['uri'].replace("spotify:album:","")

            query = "https://api.spotify.com/v1/albums/{}/tracks?limit={}".format(id,total_tracks)
            response = requests.get(
                query,
                headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer {}".format(spotify_token)
                }
            )

            response_json = response.json()['items']
            for i in range(total_tracks):
                uri_list += response_json[i]['uri']+","

        elif(u_type == "plist"):
            pass

        else:
            print("Wrong Type search was sent as a parameter")
            exit()

        return uri_list+"," 

    def add_to_playlist(self,playlist_id,uri):
        """
        Add all songs pulled from get_uri to the detailing of the user to a new playlist
        """

        #I want to be able to automate (or at least expedite) the gathering of the oAuth token with the valid permissions
        query = 'https://accounts.spotify.com/authorize?client_id={}&response_type=code&redirect_uri=https%3A%2F%2Fgoogle.com%2Fcallback&scope=user-read-private%20user-read-email&state=34fFs29kd09'.format(client_id)
        token_request = requests.post(
            query
        )

        query = 'https://accounts.spotify.com/api/token'

        token_receive = requests.get(
            query,
            headers = {
                'Authorization':'Basic MWI0NDc0YTAwZDhlNDJjNWI1YmJlMGNmYzhmZTIzNjI6ODI3OWJmZmE3MDFiNDUxMWFiZWRiNjViYjk4NzY5MzI='
            }
        )

        request_data = json.dumps(uri)

        query = "https://api.spotify.com/v1/playlists/{}/tracks".format(
            playlist_id)

        bigString = "https://api.spotify.com/v1/playlists/{}/tracks?uris=".format(playlist_id)+uri

        response = requests.post(
            bigString,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer {}".format(spotify_token)
            }
        )

        # check for valid response status
        if response.status_code != 201:
            print("Response Exception")
            exit()

    def cfg(self,filename):
        #So this one is pretty straightforward. Im gonna read the file twice, the first time configuring any spaces to be replaced by %20, adding
        #the right words and the corresponding : to be actually represented by %3A
        uri_list = ""
        title = ""
        with open(filename) as fn:
            title = fn.readline()
            playlist_id = self.create(title)

            scopes = "user-read-private user-read-email"
            redirect_uri = "https%3A%2F%2Fexample.com%2Fcallback"
            redirect_url = 'https://example.com/callback'
            query = 'https://accounts.spotify.com/authorize?response_type=code&client_id={}&scope={}&redirect_uri={}'.format(client_id,scopes,redirect_uri)
            auth = "MWI0NDc0YTAwZDhlNDJjNWI1YmJlMGNmYzhmZTIzNjI6ODI3OWJmZmE3MDFiNDUxMWFiZWRiNjViYjk4NzY5MzI="
            webbrowser.open(query)
            response = requests.post(
                query,
                headers = {
                    'Authorization':auth
                }
            )

            print(response.url)

            for line in fn:
                #First we're gonna assume the cfg is configured as detailed above (using --art --alb --t)
                line = line.strip()
                if(len(line) > 1):
                    if("--art" in line):
                        line = line.replace("--art","artist:")
                    if("--alb" in line):
                        line = line.replace("--alb","album:")
                    if("--t" in line):
                        line = line.replace("--t","track:")
                    
                    line = line.replace(" ","%20")
                    line = line.replace(":","%3A")

                    type_r = ""
                    if("track" in line):
                        type_r = 'sing'
                    elif("artist" in line and not("track" in line)):
                        if("album" in line):
                            type_r = "alb"
                        else:
                            type_r = "top"
                    elif("album" in line and not ("track" in line)):
                        type_r = "alb"
                    else:
                        print("Invalid configuration")
                        exit()

                    uri_list = self.get_uri(line,type_r)
                    self.add_to_playlist(playlist_id,uri_list)
        return [title,uri_list]

if __name__ == '__main__':
    cp = playlist_create()
    cp.cfg("cfg2.txt")
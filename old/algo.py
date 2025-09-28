import csv
import pprint
from datetime import datetime
import pdb
from schizo import tracks

date_format = "%Y-%m-%d"

songs = []
genres = set()

class Algorithm:
    def __init__(self) -> None:
        self.songs = []
        self.considered_songs = {}
        self.include_genres = {}
        self.include_songs = {}
        self.exclude_songs = set()
        self.exclude_genres = set()
        self.ISE = 'i' #Include or exclude songs used to generate playlist
        self.AUTOMATIC_SONGS = True #Are we using manual settings or the songs
        self.consider_key_and_mode = False #Consider the Key and Mode of songs
        self.user_weights = {} #Defined weights
        self.NAMEORID = 'id' #Are we searching the playlist via name or id (should use ID)
        self.playlist_length = 10
        self.final_playlist = {}

    def manuallySetSongs(self, songs): #Probably don't use
        self.songs = songs

    def setConsideredSongs(self, sent):
        self.considered_songs = sent

    def updateConsideredSongs(self, additional_songs):
        self.considered_songs = list(set(self.considered_songs + additional_songs))

    def setIncludeGenres(self, sent):
        self.include_genres = sent

    def setKeyModeConsider(self, sent):
        self.consider_key_and_mode = sent

    def setExcludeSongs(self, sent):
        self.exclude_songs = sent

    def setExcludeGenres(self, sent):
        self.exclude_genres = sent

    def setISE(self, sent):
        self.ISE = sent

    def setAutoSongs(self,sent):
        self.AUTOMATIC_SONGS = sent

    def setPlaylist_Length(self, sent):
        self.playlist_length = sent

    def processSongs(self, sent):
        keys = [
        "C", "C♯/D♭", "D", "D♯/E♭", "E", "F",
        "F♯/G♭", "G", "G♯/A♭", "A", "A♯/B♭", "B"
        ]

        for row in sent:
            release_year = None
            try:
                release_year = datetime.strptime(row['release_date'], date_format).year
            except ValueError:
                release_year = int(row["release_date"].replace("-"," ").split()[0]) #Might just be the year
            song_dict = {
                "name": row['name'],  # Ensure whitespace does not affect matching
                "id": row['id'],
                "uri": row['uri'],
                "artists": [i["name"] for i in row["artists"]],
                "genre": row['features']['genres'],
                "year": release_year,
                "bpm": float(row['features']['tempo']),
                "energy": float(row['features']['energy']),
                "danceability": float(row['features']['danceability']),
                "db": float(row['features']['loudness']),
                "live": float(row['features']['liveness']),
                "valence": float(row['features']['valence']),
                "acousticness": float(row['features']['acousticness']),
                "instrumentalness": float(row['features']['instrumentalness']),
                "speechiness": float(row['features']['speechiness']),
                "popularity": float(row['features']['popularity']),
                "key": keys.index(row['features']["key_mode"].split()[0]),
                "mode": row['features']["key_mode"].split()[1]
            }
            self.songs.append(song_dict)

    def calculateUserWeights(self, user_weights=None):
        if not self.AUTOMATIC_SONGS:
            self.user_weights = user_weights
            return
        if not self.considered_songs:
            print("No songs provided for automatic feature weight determination.")
            exit()
        self.user_weights = self.determine_feature_weights_from_song_titles(self.considered_songs)
        return

    def determine_feature_weights_from_song_titles(self,include_songs):
        selected_songs = [song for song in self.songs if song[self.NAMEORID] in include_songs]
        return self.determine_feature_weights_from_songs(selected_songs)
    
    def determine_feature_weights_from_songs(self, selected_songs):
        included_features = {'bpm', 'energy', 'danceability', 'db', 'live', 'valence', 'acousticness', 'speechiness', 'popularity'}
        feature_sums = {}
        feature_counts = {}
        for song in selected_songs:
            for feature, value in song.items():
                if feature in included_features:
                    feature_sums.setdefault(feature, 0)
                    feature_counts.setdefault(feature, 0)
                    feature_sums[feature] += value
                    feature_counts[feature] += 1

        feature_averages = {feature: feature_sums[feature] / feature_counts[feature] for feature in included_features}
        feature_weights = {feature: (1, 'target', feature_averages[feature]) for feature in feature_averages}
        return feature_weights
    
    def calculate_similarity(self, song):
        score = 0
        # Base features calculation
        for feature, (weight, mode, target) in self.user_weights.items():
            if feature in song:
                feature_value = song[feature]
                if mode == 'target':
                    score += weight * (1 - abs(feature_value - target) / 100)
                elif mode == 'higher':
                    score += (feature_value / 100) * weight
                elif mode == 'lower':
                    score += ((100 - feature_value) / 100) * weight
        
        # Key and mode matching only if enabled
        if self.consider_key_and_mode:
            preferred_key = self.user_weights.get('key', (1, 'target', -1))[2]
            preferred_mode = self.user_weights.get('mode', (1, 'target', 'Major'))[2]
            if song['key'] == preferred_key:
                score += 10  # Arbitrary score boost for key match
            if song['mode'] == preferred_mode:
                score += 10  # Arbitrary score boost for mode match

        return score

    
    def generate_playlist(self):
        self.calculateUserWeights()

        include_songs = {}
        if self.ISE == 'i':
            include_songs = self.considered_songs
        elif self.ISE == 'e':
            self.exclude_songs.append(self.considered_songs)

        included_songs = [song for song in self.songs if song[self.NAMEORID] in include_songs]
        song_scores = [(song, self.calculate_similarity(song)) for song in self.songs if song['id'] not in self.exclude_songs and not len(set(song['genre']).intersection(self.exclude_genres)) > 0 and song not in included_songs]

        sorted_songs = sorted(song_scores, key=lambda x: x[1], reverse=True)
        remaining_slots = self.playlist_length - len(included_songs)
        self.final_playlist = included_songs + [song for song, score in sorted_songs[:remaining_slots]]
        return self.final_playlist

if __name__ == '__main__':
    algo = Algorithm()
    algo.processSongs(tracks)
    algo.setPlaylist_Length(4)
    algo.setConsideredSongs(["4R4VFcQAg4fRomKHXL4zab", "3FF6vKYilv8IIJSoPKN56z"])
    pprint.pprint(algo.generate_playlist())
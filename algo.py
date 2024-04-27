import csv
import pprint
from datetime import datetime

date_format = "%Y‑%m‑%d"

songs = []
genres = set()
with open("filter.txt", "r") as file:
    reader = csv.DictReader(file, delimiter='\t')
    for row in reader:
        song_dict = {
            "sel": row['sel'],
            "name": row['title'].strip(),  # Ensure whitespace does not affect matching
            "artist": row['artist'],
            "genre": row['top genre'],
            "year": int(row['year']),
            "added": (datetime.today() - datetime.strptime(row['added'], date_format)).days,
            "bpm": float(row['bpm']),
            "energy": float(row['nrgy']),
            "danceability": float(row['dnce']),
            "db": float(row['dB']),
            "live": float(row['live']),
            "valence": float(row['val']),
            "duration": row['dur'],
            "acousticness": float(row['acous']),
            "speechiness": float(row['spch']),
            "popularity": float(row['pop'])
        }
        songs.append(song_dict)
        genres.add(row['top genre'])

class Algorithm:
    def __init__(self) -> None:
        self.songs = []
        self.considered_songs = {}
        self.include_genres = {}
        self.include_songs = {}
        self.exclude_songs = set()
        self.exclude_genres = set()
        self.ISE = ''
        self.AUTOMATIC_SONGS = False
        self.user_weights = {}
        self.NAMEORID = 'name'
        self.playlist_length = 10
        self.final_playlist = {}

    def setSongs(self, songs):
        self.songs = songs

    def setConsideredSongs(self, into):
        self.considered_songs = into

    def setIncludeGenres(self, into):
        self.include_genres = into

    def setExcludeSongs(self, into):
        self.exclude_songs = into

    def setExcludeGenres(self, into):
        self.exclude_genres = into

    def setISE(self, into):
        self.ISE = into

    def setAutoSongs(self,into):
        self.AUTOMATIC_SONGS = into

    def setPlaylist_Length(self, into):
        self.playlist_length = into

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
        included_features = {'year', 'added', 'bpm', 'energy', 'danceability', 'db', 'live', 'valence', 'acousticness', 'speechiness', 'popularity'}
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
        for feature, (weight, mode, target) in self.user_weights.items():
            if feature in song:
                feature_value = song[feature]
                if mode == 'target':
                    score += weight * (1 - abs(feature_value - target) / 100)
                elif mode == 'higher':
                    score += (feature_value / 100) * weight
                elif mode == 'lower':
                    score += ((100 - feature_value) / 100) * weight
        return score
    
    def generate_playlist(self):
        self.calculateUserWeights()

        include_songs = {}
        if self.ISE == 'i':
            include_songs = self.considered_songs
        elif self.ISE == 'e':
            self.exclude_songs = self.considered_songs

        included_songs = [song for song in self.songs if song[self.NAMEORID] in include_songs]
        song_scores = [(song, self.calculate_similarity(song)) for song in self.songs if song[self.NAMEORID] not in self.exclude_songs and song['genre'] not in self.exclude_genres and song not in included_songs]

        sorted_songs = sorted(song_scores, key=lambda x: x[1], reverse=True)
        remaining_slots = self.playlist_length - len(included_songs)
        self.final_playlist = included_songs + [song for song, score in sorted_songs[:remaining_slots]]

        return self.final_playlist

a = Algorithm()
a.setSongs(songs)
a.setConsideredSongs({'Three Month Hangover','Butterflies1', 'FYTY'})
a.setIncludeGenres({})
a.setExcludeGenres({})
a.setExcludeSongs({})
a.setISE('e')
a.setAutoSongs(True)
playlist = a.generate_playlist()
pprint.pprint([f"{song['name']} by {song['artist']}" for song in playlist])

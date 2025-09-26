import type { Features, Song } from "./song"

export interface ModSong
{
    name: string;
    id: string;
    features: Features;
    normalized_features: Features;
    weighted_features: Features | null; 
}

/**
 * 
 * @param songs List of songs returned from the Spotify API
 * @returns the minimum value per specific feature as an interface of Features
 */
export function findMinAndMax(songs: Song[]): Features[]
{
    let min: Features = {
        acousticness : Number.POSITIVE_INFINITY,
        energy: Number.POSITIVE_INFINITY,
        danceability: Number.POSITIVE_INFINITY,
        valence: Number.POSITIVE_INFINITY,
        loudness: Number.POSITIVE_INFINITY,
        speechiness: Number.POSITIVE_INFINITY,
        instrumentalness: Number.POSITIVE_INFINITY,
        liveness: Number.POSITIVE_INFINITY,
        tempo: Number.POSITIVE_INFINITY,
        popularity: Number.POSITIVE_INFINITY,
        key_mode: null,
        genres: null
    }

    let max: Features = {
        acousticness : Number.NEGATIVE_INFINITY,
        energy: Number.NEGATIVE_INFINITY,
        danceability: Number.NEGATIVE_INFINITY,
        valence: Number.NEGATIVE_INFINITY,
        loudness: Number.NEGATIVE_INFINITY,
        speechiness: Number.NEGATIVE_INFINITY,
        instrumentalness: Number.NEGATIVE_INFINITY,
        liveness: Number.NEGATIVE_INFINITY,
        tempo: Number.NEGATIVE_INFINITY,
        popularity: Number.NEGATIVE_INFINITY,
        key_mode: null,
        genres: null
    }

    for(const song of songs)
    {
        min.acousticness = Math.min(min.acousticness, song.features.acousticness)
        min.energy = Math.min(min.energy, song.features.energy)
        min.danceability = Math.min(min.danceability, song.features.danceability)
        min.valence = Math.min(min.valence, song.features.valence)
        min.loudness = Math.min(min.loudness, song.features.loudness)
        min.speechiness = Math.min(min.speechiness, song.features.speechiness)
        min.instrumentalness = Math.min(min.instrumentalness, song.features.instrumentalness)
        min.liveness = Math.min(min.liveness, song.features.liveness)
        min.tempo = Math.min(min.tempo, song.features.tempo)
        min.popularity = Math.min(min.popularity, song.features.popularity)

        max.acousticness = Math.max(max.acousticness, song.features.acousticness)
        max.energy = Math.max(max.energy, song.features.energy)
        max.danceability = Math.max(max.danceability, song.features.danceability)
        max.valence = Math.max(max.valence, song.features.valence)
        max.loudness = Math.max(max.loudness, song.features.loudness)
        max.speechiness = Math.max(max.speechiness, song.features.speechiness)
        max.instrumentalness = Math.max(max.instrumentalness, song.features.instrumentalness)
        max.liveness = Math.max(max.liveness, song.features.liveness)
        max.tempo = Math.max(max.tempo, song.features.tempo)
        max.popularity = Math.max(max.popularity, song.features.popularity)
    }
    return [min, max]
}

function normalizeValue(value:number, min: number, max: number): number
{
    return (value - min)/(max-min);
}

export function normalizeSongFeatures(songs: Song[]): ModSong[]
{
    const [min, max]: Features[] = findMinAndMax(songs);

    let moddedSongs: ModSong[] = [];

    for(const song of songs)
    {
        moddedSongs.push(normalize(song, min, max));
    }
    return moddedSongs
}

function normalize(value: Song, min: Features, max: Features): ModSong
{
    let normFeat: Features = {
        acousticness: normalizeValue(value.features.acousticness, min.acousticness, max.acousticness),
        energy: normalizeValue(value.features.energy, min.energy, max.energy),
        danceability: normalizeValue(value.features.danceability, min.danceability, max.danceability),
        valence: normalizeValue(value.features.valence, min.valence, max.valence),
        loudness: normalizeValue(value.features.loudness, min.loudness, max.loudness),
        speechiness: normalizeValue(value.features.speechiness, min.speechiness, max.speechiness),
        instrumentalness: normalizeValue(value.features.instrumentalness, min.instrumentalness, max.instrumentalness),
        liveness: normalizeValue(value.features.liveness, min.liveness, max.liveness),
        tempo: normalizeValue(value.features.tempo, min.tempo, max.tempo),
        popularity: normalizeValue(value.features.popularity, min.popularity, max.popularity),
        key_mode: null,
        genres: null
    }
    return {
        name: value.name,
        id: value.id,
        features: value.features,
        normalized_features: normFeat,
        weighted_features: null
    }
}
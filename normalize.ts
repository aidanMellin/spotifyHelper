import type { Features, Song } from "./song"

const FEATURE_LENGTH=10;

const FEATURE_IDX: Record<string, number> = {
    acousticness: 0,
    energy: 1,
    danceability: 2,
    valence: 3,
    loudness: 4,
    speechiness: 5,
    instrumentalness: 6,
    liveness: 7,
    tempo: 8,
    popularity: 9
};
const FEATURE_NAME_KEYS: Array<string> = Object.keys(FEATURE_IDX); 

export interface ModSong
{
    name: string;
    id: string;
    features: Features; //Original data
    normalized_features: Features; //Normalized between 0-1
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

/**
 * 
 * @param value baseSong feature value to be normalized 
 * @param min Min feature value across all songs
 * @param max Max feature value across all songs
 * @returns the normalized value
 */
function normalizeValue(value:number, min: number, max: number, baseSong: number): number
{
    return Math.abs(baseSong - value)/(max-min);
}

/**
 * 
 * @param value The song to be normalized
 * @param min Minimum feature values across song set
 * @param max Max feature values across song set
 * @returns the new interface including normalized values
 */
function normalize(value: Song, min: Features, max: Features, baseSong: Song): ModSong
{
    let normFeat: Features = {
        acousticness: normalizeValue(value.features.acousticness, min.acousticness, max.acousticness, baseSong.features.acousticness ),
        energy: normalizeValue(value.features.energy, min.energy, max.energy, baseSong.features.energy ),
        danceability: normalizeValue(value.features.danceability, min.danceability, max.danceability, baseSong.features.danceability ),
        valence: normalizeValue(value.features.valence, min.valence, max.valence, baseSong.features.valence ),
        loudness: normalizeValue(value.features.loudness, min.loudness, max.loudness, baseSong.features.loudness ),
        speechiness: normalizeValue(value.features.speechiness, min.speechiness, max.speechiness, baseSong.features.speechiness ),
        instrumentalness: normalizeValue(value.features.instrumentalness, min.instrumentalness, max.instrumentalness, baseSong.features.instrumentalness ),
        liveness: normalizeValue(value.features.liveness, min.liveness, max.liveness, baseSong.features.liveness ),
        tempo: normalizeValue(value.features.tempo, min.tempo, max.tempo, baseSong.features.tempo ),
        popularity: normalizeValue(value.features.popularity, min.popularity, max.popularity, baseSong.features.popularity ),
        key_mode: null,
        genres: null
    }
    return {
        name: value.name,
        id: value.id,
        features: value.features,
        normalized_features: normFeat,
    }
}

/**
 * 
 * @param songs All songs to be normalized for comparison
 * @returns Array of aggregated song data
 */
export function normalizeSongFeatures(songs: Song[], baseSong: Song): ModSong[]
{
    const [min, max]: Features[] = findMinAndMax(songs);

    let moddedSongs: ModSong[] = [];

    for(const song of songs)
    {
        moddedSongs.push(normalize(song, min, max, baseSong));
    }
    return moddedSongs
}

export function getAverageFeatures(songs: ModSong[]): Features
{
    let n = songs.length;
    let weights: Features = {
        acousticness : 0,
        energy: 0,
        danceability: 0,
        valence: 0,
        loudness: 0,
        speechiness: 0,
        instrumentalness: 0,
        liveness: 0,
        tempo: 0,
        popularity: 0,
        key_mode: null,
        genres: null
    }

    //Make a big sum per feature
    for(const song of songs)
    {
        weights.acousticness += song.normalized_features.acousticness;
        weights.energy += song.normalized_features.energy;
        weights.danceability += song.normalized_features.danceability;
        weights.valence += song.normalized_features.valence;
        weights.loudness += song.normalized_features.loudness;
        weights.speechiness += song.normalized_features.speechiness;
        weights.instrumentalness += song.normalized_features.instrumentalness;
        weights.liveness += song.normalized_features.liveness;
        weights.tempo += song.normalized_features.tempo;
        weights.popularity += song.normalized_features.popularity;
    }

    //Divide out the big sums by the length of the songs array to get average
    weights.acousticness /= n;
    weights.energy /= n;
    weights.danceability /= n;
    weights.valence /= n;
    weights.loudness /= n;
    weights.speechiness /= n;
    weights.instrumentalness /= n;
    weights.liveness /= n;
    weights.tempo /= n;
    weights.popularity /= n;

    return weights;
}

export function getWeights(songs: ModSong[], baseSong: Features, avg: Features): Features
{
    let weights: Features = {
        acousticness : 0,
        energy: 0,
        danceability: 0,
        valence: 0,
        loudness: 0,
        speechiness: 0,
        instrumentalness: 0,
        liveness: 0,
        tempo: 0,
        popularity: 0,
        key_mode: null,
        genres: null
    }

    for (const song of songs)
    {
        // if(song.normalized_features.acousticness < (Math.abs(baseSong.normalized_features.acousticness - avg.acousticness))) weights.acousticness += 1;
        // if(song.normalized_features.energy < (Math.abs(baseSong.normalized_features.energy - avg.energy))) weights.energy += 1;
        // if(song.normalized_features.danceability < (Math.abs(baseSong.normalized_features.danceability - avg.danceability))) weights.danceability += 1;
        // if(song.normalized_features.valence < (Math.abs(baseSong.normalized_features.valence - avg.valence))) weights.valence += 1;
        // if(song.normalized_features.loudness < (Math.abs(baseSong.normalized_features.loudness - avg.loudness))) weights.loudness += 1;
        // if(song.normalized_features.speechiness < (Math.abs(baseSong.normalized_features.speechiness - avg.speechiness))) weights.speechiness += 1;
        // if(song.normalized_features.instrumentalness < (Math.abs(baseSong.normalized_features.instrumentalness - avg.instrumentalness))) weights.instrumentalness += 1;
        // if(song.normalized_features.liveness < (Math.abs(baseSong.normalized_features.liveness - avg.liveness))) weights.liveness += 1;
        // if(song.normalized_features.tempo < (Math.abs(baseSong.normalized_features.tempo - avg.tempo))) weights.tempo += 1;
        // if(song.normalized_features.popularity < (Math.abs(baseSong.normalized_features.popularity - avg.popularity))) weights.popularity += 1;

        if (1-Math.abs(baseSong.acousticness - song.normalized_features.acousticness) < avg.acousticness) weights.acousticness += 1;
        if (1-Math.abs(baseSong.energy - song.normalized_features.energy) < avg.energy) weights.energy += 1;
        if (1-Math.abs(baseSong.danceability - song.normalized_features.danceability) < avg.danceability) weights.danceability += 1;
        if (1-Math.abs(baseSong.valence - song.normalized_features.valence) < avg.valence) weights.valence += 1;
        if (1-Math.abs(baseSong.loudness -song.normalized_features.loudness) < avg.loudness) weights.loudness += 1;
        if (1-Math.abs(baseSong.speechiness - song.normalized_features.speechiness) < avg.speechiness) weights.speechiness += 1;
        if (1-Math.abs(baseSong.instrumentalness - song.normalized_features.instrumentalness) < avg.instrumentalness) weights.instrumentalness += 1;
        if (1-Math.abs(baseSong.liveness - song.normalized_features.liveness) < avg.liveness) weights.liveness += 1;
        if (1-Math.abs(baseSong.tempo - song.normalized_features.tempo) < avg.tempo) weights.tempo += 1;
        if (1-Math.abs(baseSong.popularity - song.normalized_features.popularity) < avg.popularity) weights.popularity += 1;
    }

    return weights;
}

export function generateBaseCompareFeatures(songs: ModSong[]): Features
{
    // Pass in a list of the base compare songs, we want to determine the general features to then compare against.
    // Something like Gowers, but something more like
    /**
     * Goal: Weighted average of values in Features.
     * 
     * Change it to compare against the elements in the base song set, find the closest values and assign from there?
     */
    let compare: Features = {
        acousticness : 0,
        energy: 0,
        danceability: 0,
        valence: 0,
        loudness: 0,
        speechiness: 0,
        instrumentalness: 0,
        liveness: 0,
        tempo: 0,
        popularity: 0,
        key_mode: null,
        genres: null
    }

    let avgFeatures: Features = getAverageFeatures(songs);

    return avgFeatures;
}

export function GowersDistance(base: Features, B: ModSong, weights: Features, max: Features, min: Features)
{
    /**
     * Similarity Sij = Sum(Weightijk * 1 - (|xi - xj| / (max(r) - min(r)))) / sum of weights
     */
    let distance: number = 0;
    let weightSum: number = 0;
    for(let i: number = 0; i < FEATURE_LENGTH; i++)
    {
        const key = FEATURE_NAME_KEYS[i]; 
        const weight = weights[key] as number;
        const baseVal: number = base[key] as number; 
        const bFeatureValue: number = B.normalized_features[key] as number; 
        const maxVal: number = max[key] as number;
        const minVal: number = min[key] as number;

        weightSum += weight;
        distance +=  weight * (1 - (Math.abs(baseVal - bFeatureValue) / (maxVal - minVal))) 
    }
    distance /= weightSum;
    return distance;
}
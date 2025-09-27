import { fetchJsonFromFile } from "./song.ts";
import type {Features, Song} from "./song.ts"

import {findMinAndMax, generateBaseCompareFeatures, getAverageFeatures, getWeights, GowersDistance, normalize, normalizeSongFeatures} from "./normalize.ts"
import type {ModSong} from "./normalize.ts"

// interface Similar
// {
//     song: ModSong,
//     distance: number;
// }

const NUMBER_MATCHES = 5;

function getSimilar(songs: Song[]): [string, number][]
{
    //Min and Max Values within the set for normalization
    const [min, max]: Features[] = findMinAndMax(songs);

    //Normalize the feature values to between 0 and 1 given the input
    const normed: ModSong[] = normalizeSongFeatures(songs, min, max);

    //Calculate the average feature value
    const averages: Features = getAverageFeatures(normed);

    //Create my base compare songs. Two random ones.
    const baseSongs: ModSong[] = [normed[0], normed[1]];

    //Set the distances based on comparing against each song in the base compare set
    let distances: Map<string, number> = new Map();
    for(const baseSong of baseSongs)
    {
        for(const song of normed)
        {
            const weights: Features = getWeights(normed, baseSong.normalized_features, averages)
            let tempDist: number = GowersDistance(baseSong.normalized_features, song, weights, min, max)
            const storedDist: number = distances.get(song.id) ?? Number.POSITIVE_INFINITY;
            if(tempDist < storedDist) distances.set(song.id, tempDist);
        }
    }

    let counter = 0;
    const sortedResult = Array.from(distances.entries())
            .sort(([,distanceA], [,distanceB]) => {
                return distanceA - distanceB;
            })
    
    return sortedResult;
}

function main()
{
    const songs: Song[] = fetchJsonFromFile("./smaller.json"); //The song list
    const songLookup: Map<string, Song> = new Map(songs.map(song => [song.id, song]));

    let measuredDistances: [string, number][] = getSimilar(songs);
    measuredDistances.slice(0,NUMBER_MATCHES).forEach(([id, distance]) => {
        const song = songLookup.get(id);
            if (song) {
                console.log(`Song: ${song.name}, Distance: ${distance}`);
            }
    })
    
}

main()
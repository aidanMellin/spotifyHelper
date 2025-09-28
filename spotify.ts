import { fetchJsonFromFile } from "./song.ts";
import type { Features, Song } from "./song.ts"

import { findMinAndMax, getAverageFeatures, getWeights, GowersDistance, normalize, normalizeSongFeatures } from "./normalize.ts"
import type { ModSong } from "./normalize.ts"

import { checkbox } from '@inquirer/prompts';

// interface Similar
// {
//     song: ModSong,
//     distance: number;
// }

const NUMBER_MATCHES = 5;

async function getBaseSongs(songs: ModSong[]): Promise<ModSong[]> {
    //Spacebar marks a selection, enter sends it
    const selectedOptions = await checkbox({
        message: 'Select from the list the songs you want to base a new playlist off of:',
        // choices: [
        //     { name: 'Option A - [ ]', value: 'A' },
        //     { name: 'Option B - [ ]', value: 'B' },
        //     { name: 'Option C - [ ]', value: 'C' },
        // ],
        choices: songs.map((song) => {
            return {
                name: `${song.name}`,
                value: song
            }
        })
    });

    // console.log('You selected:', selectedOptions);
    return selectedOptions;
}

function getSimilar(normed: ModSong[], baseSongs: ModSong[], min: Features, max: Features): [string, number][] {
    //Calculate the average feature value
    const averages: Features = getAverageFeatures(normed);

    //Create my base compare songs. Two random ones.

    //Set the distances based on comparing against each song in the base compare set
    let distances: Map<string, number> = new Map();
    for (const baseSong of baseSongs) {
        for (const song of normed) {
            const weights: Features = getWeights(normed, baseSong.normalized_features, averages)
            let tempDist: number = GowersDistance(baseSong.normalized_features, song, weights, min, max)
            const storedDist: number = distances.get(song.id) ?? Number.POSITIVE_INFINITY;
            if (tempDist < storedDist) distances.set(song.id, tempDist);
        }
    }

    const sortedResult = Array.from(distances.entries())
        .sort(([, distanceA], [, distanceB]) => {
            return distanceA - distanceB;
        })

    return sortedResult;
}

async function main() {
    //TODO: arg flags for execution in a browser vs node --experiemental?

    const songs: Song[] = fetchJsonFromFile("./smaller.json"); //The song list
    const songLookup: Map<string, Song> = new Map(songs.map(song => [song.id, song]));

    //Min and Max Values within the set for normalization
    const [min, max]: Features[] = findMinAndMax(songs);
    //Normalize the feature values to between 0 and 1 given the input
    const normed: ModSong[] = normalizeSongFeatures(songs, min, max);

    let baseSongs: ModSong[] = await getBaseSongs(normed);

    let measuredDistances: [string, number][] = getSimilar(normed, baseSongs, min, max);
    console.log(`Top ${NUMBER_MATCHES} Matches:`)
    measuredDistances.slice(0, NUMBER_MATCHES).forEach(([id, distance]) => {
        const song = songLookup.get(id);
        if (song) {
            console.log(` - ${song.name} - ${song.artists[0].name}, Distance: ${distance}`);
        }
    })

}

main()
import { fetchJsonFromFile } from "./song.ts";
import type {Features, Song} from "./song.ts"

import {findMinAndMax, generateBaseCompareFeatures, getAverageFeatures, getWeights, GowersDistance, normalizeSongFeatures} from "./normalize.ts"
import type {ModSong} from "./normalize.ts"

// interface Similar
// {
//     song: ModSong,
//     distance: number;
// }

function main()
{
    const songs: Song[] = fetchJsonFromFile("./smaller.json");
    // for(const song of songs)
    // {
        // console.log(song.name);
    // }
    const normed: ModSong[] = normalizeSongFeatures(songs, songs[0]);
    // console.log(normed)
    const averages: Features = getAverageFeatures(normed);
    //Create my base compare songs. Two random ones.
    const baseSongs: ModSong[] = [normed[0], normed[1]];
    // const baseFeat: Features = generateBaseCompareFeatures(baseSongs);
    let distances: Map<ModSong, number> = new Map();
    const [min, max]: Features[] = findMinAndMax(songs);
    for(const song of normed)
    {
        for(const baseSong of baseSongs)
        {
            const weights: Features = getWeights(normed, baseSong.normalized_features, averages)
            let tempDist: number = GowersDistance(baseSong.normalized_features, song, weights, min, max)
            const storedDist: number = distances.get(song) ?? Number.POSITIVE_INFINITY;
            if(tempDist < storedDist) distances.set(song, tempDist);
        }
    }

    Array.from(distances.entries())
            .sort(([,distanceA], [,distanceB]) => {
                return distanceA - distanceB;
            })
            .forEach(([song, distance]) => {
                console.log(`Song: ${song.name}, Distance: ${distance}`);
            })


    //Get top 3 songs similar.
    // for(const song of normed)
    // {
    //     distances.push(
    //         {
    //             song: song, distance: GowersDistance(baseFeat, song, weights, min, max)
    //         });
    // }
    // distances.sort((a, b) => a.distance - b.distance)
    // for(let i = 0; i < distances.length; i++)
    // {
    //     if (i < 5) console.log(distances[i].song.name);
    //     // if(distances[i].song.name == "Lancaster Nights") console.log(distances[i]);
    // }
}

main()
import { fetchJsonFromFile } from "./song.ts";
import type {Features, Song} from "./song.ts"

import {normalizeSongFeatures} from "./normalize.ts"
import type {ModSong} from "./normalize.ts"


function main()
{
    const songs: Song[] = fetchJsonFromFile("./smaller.json");
    // for(const song of songs)
    // {
        // console.log(song.name);
    // }


    const normed: ModSong[] = normalizeSongFeatures(songs);
    console.log(normed)

}

main()
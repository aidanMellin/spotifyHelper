import * as fs from 'fs/promises';
import * as path from 'path';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Image
{
    height: number;
    width: number;
    url: string;
}

interface External_URL
{
    service: string,
    url: string
}

interface Artist
{   
    // external_urls: Map<string, string>
    external_urls: External_URL[]
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
}

interface Album
{
    available_markets: Array<string>;
    type: string;
    href: string;
    id: string;
    images: Array<Image>
    name: string;
    release_date: string
    release_date_precision: string;
    uri: string;
    artists: Array<Artist>
    external_urls: External_URL[]
    total_tracks: number;    
}

export interface Features
{
    danceability: number;
    energy: number;
    loudness: number;
    speechiness: number
    acousticness: number
    instrumentalness: number;
    liveness: number;
    valence: number;
    tempo: number;
    popularity: number
    key_mode: string | null;
    genres: Array<string> | null;

}

export interface Song
{
    name: string;
    id: string;
    uri: string;
    artists: Array<Artist>;
    release_date: string;
    album: Album;
    features: Features;

    // {
    //     // this.title="Test";
    //     // this.id='123';
    // }
}

function jsonToSong(sample: any): Song[]
{
    let songsList: Song[] = sample.map(obj => ({
        name: obj.name,
        id: obj.id,
        uri: obj.uri,
        artists: obj.artists.map(ele => ({
            href: ele.href,
            id: ele.id,
            name: ele.name,
            type: ele.type,
            uri: ele.uri,
            external_urls: Object.entries(ele.external_urls).map(([service, url]) => ({
                service: service,
                url: url
            })),
        })),
        album: {
            available_markets: obj.album.available_markets,
            type: obj.album.type,
            href: obj.album.href,
            id: obj.album.id,
            images: obj.album.images.map(ele => ({
                height: ele.height,
                width: ele.width,
                url: ele.url
            })),
            name: obj.album.name,
            release_date: obj.album.release_date,
            release_date_precision: obj.album.release_date_precision,
            uri: obj.album.uri,
            artists: obj.album.artists.map(ele => ({
                href: ele.href,
                id: ele.id,
                name: ele.name,
                type: ele.type,
                uri: ele.uri,
                external_urls: Object.entries(ele.external_urls).map(([service, url]) => ({
                    service: service,
                    url: url
                })),
            })),
            external_urls: Object.entries(obj.album.external_urls).map(([service, url]) => ({
                service: service,
                url: url
            })),
            total_tracks: obj.album.total_tracks
        },
        release_date: obj.release_date,
        features: {
            danceability: obj.features.danceability,
            energy: obj.features.energy,
            loudness: obj.features.loudness,
            speechiness: obj.features.speechiness,
            instrumentalness: obj.features.instrumentalness,
            liveness: obj.features.liveness,
            valence: obj.features.valence,
            tempo: obj.features.tempo,
            popularity: obj.features.popularity,
            key_mode: obj.features.key_mode,
            genres: obj.features.genres,
            acousticness: obj.features.acousticness
        }
    }));

    return songsList;
}

export function fetchJsonFromFile(fileName: string): Song[] 
{
    try {
        const fileContent = readFileSync(join(__dirname, fileName), 'utf-8')
        const songData = JSON.parse(fileContent);
        const songList: Song[] = jsonToSong(songData);
        
        return songList;
    } catch (error) {
        console.error("Could not fetch or process the JSON file:", error);
        return [];
    }
}
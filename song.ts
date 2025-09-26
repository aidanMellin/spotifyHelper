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

function main()
{

    // const sample = [{
    //     "id": "48jV8AW50589btXi0Hs5f4",
    //     "name": "Lancaster Nights",
    //     "artists": [
    //         {
    //             "external_urls": {
    //                 "spotify": "https://open.spotify.com/artist/0ubGY2CcC0tvR0eE6hJaT8"
    //             },
    //             "href": "https://api.spotify.com/v1/artists/0ubGY2CcC0tvR0eE6hJaT8",
    //             "id": "0ubGY2CcC0tvR0eE6hJaT8",
    //             "name": "Charlie Burg",
    //             "type": "artist",
    //             "uri": "spotify:artist:0ubGY2CcC0tvR0eE6hJaT8"
    //         }
    //     ],
    //     "album": {
    //         "available_markets": [
    //             "AR",
    //             "AU",
    //             "AT",
    //             "BE",
    //             "BO",
    //             "BR",
    //             "BG",
    //             "CA",
    //             "CL",
    //             "CO",
    //             "CR",
    //             "CY",
    //             "CZ",
    //             "DK",
    //             "DO",
    //             "DE",
    //             "EC",
    //             "EE",
    //             "SV",
    //             "FI",
    //             "FR",
    //             "GR",
    //             "GT",
    //             "HN",
    //             "HK",
    //             "HU",
    //             "IS",
    //             "IE",
    //             "IT",
    //             "LV",
    //             "LT",
    //             "LU",
    //             "MY",
    //             "MT",
    //             "MX",
    //             "NL",
    //             "NZ",
    //             "NI",
    //             "NO",
    //             "PA",
    //             "PY",
    //             "PE",
    //             "PH",
    //             "PL",
    //             "PT",
    //             "SG",
    //             "SK",
    //             "ES",
    //             "SE",
    //             "CH",
    //             "TW",
    //             "TR",
    //             "UY",
    //             "US",
    //             "GB",
    //             "AD",
    //             "LI",
    //             "MC",
    //             "ID",
    //             "JP",
    //             "TH",
    //             "VN",
    //             "RO",
    //             "IL",
    //             "ZA",
    //             "SA",
    //             "AE",
    //             "BH",
    //             "QA",
    //             "OM",
    //             "KW",
    //             "EG",
    //             "MA",
    //             "DZ",
    //             "TN",
    //             "LB",
    //             "JO",
    //             "PS",
    //             "IN",
    //             "BY",
    //             "KZ",
    //             "MD",
    //             "UA",
    //             "AL",
    //             "BA",
    //             "HR",
    //             "ME",
    //             "MK",
    //             "RS",
    //             "SI",
    //             "KR",
    //             "BD",
    //             "PK",
    //             "LK",
    //             "GH",
    //             "KE",
    //             "NG",
    //             "TZ",
    //             "UG",
    //             "AG",
    //             "AM",
    //             "BS",
    //             "BB",
    //             "BZ",
    //             "BT",
    //             "BW",
    //             "BF",
    //             "CV",
    //             "CW",
    //             "DM",
    //             "FJ",
    //             "GM",
    //             "GE",
    //             "GD",
    //             "GW",
    //             "GY",
    //             "HT",
    //             "JM",
    //             "KI",
    //             "LS",
    //             "LR",
    //             "MW",
    //             "MV",
    //             "ML",
    //             "MH",
    //             "FM",
    //             "NA",
    //             "NR",
    //             "NE",
    //             "PW",
    //             "PG",
    //             "WS",
    //             "SM",
    //             "ST",
    //             "SN",
    //             "SC",
    //             "SL",
    //             "SB",
    //             "KN",
    //             "LC",
    //             "VC",
    //             "SR",
    //             "TL",
    //             "TO",
    //             "TT",
    //             "TV",
    //             "VU",
    //             "AZ",
    //             "BN",
    //             "BI",
    //             "KH",
    //             "CM",
    //             "TD",
    //             "KM",
    //             "GQ",
    //             "SZ",
    //             "GA",
    //             "GN",
    //             "KG",
    //             "LA",
    //             "MO",
    //             "MR",
    //             "MN",
    //             "NP",
    //             "RW",
    //             "TG",
    //             "UZ",
    //             "ZW",
    //             "BJ",
    //             "MG",
    //             "MU",
    //             "MZ",
    //             "AO",
    //             "CI",
    //             "DJ",
    //             "ZM",
    //             "CD",
    //             "CG",
    //             "IQ",
    //             "LY",
    //             "TJ",
    //             "VE",
    //             "ET",
    //             "XK"
    //         ],
    //         "type": "album",
    //         "album_type": "single",
    //         "href": "https://api.spotify.com/v1/albums/6VjvYY8DPNwlybF40UyrCl",
    //         "id": "6VjvYY8DPNwlybF40UyrCl",
    //         "images": [
    //             {
    //                 "height": 640,
    //                 "url": "https://i.scdn.co/image/ab67616d0000b2736312e3650c5581a56c16733d",
    //                 "width": 640
    //             },
    //             {
    //                 "height": 300,
    //                 "url": "https://i.scdn.co/image/ab67616d00001e026312e3650c5581a56c16733d",
    //                 "width": 300
    //             },
    //             {
    //                 "height": 64,
    //                 "url": "https://i.scdn.co/image/ab67616d000048516312e3650c5581a56c16733d",
    //                 "width": 64
    //             }
    //         ],
    //         "name": "Lancaster Nights",
    //         "release_date": "2020-09-02",
    //         "release_date_precision": "day",
    //         "uri": "spotify:album:6VjvYY8DPNwlybF40UyrCl",
    //         "artists": [
    //             {
    //                 "external_urls": {
    //                     "spotify": "https://open.spotify.com/artist/0ubGY2CcC0tvR0eE6hJaT8"
    //                 },
    //                 "href": "https://api.spotify.com/v1/artists/0ubGY2CcC0tvR0eE6hJaT8",
    //                 "id": "0ubGY2CcC0tvR0eE6hJaT8",
    //                 "name": "Charlie Burg",
    //                 "type": "artist",
    //                 "uri": "spotify:artist:0ubGY2CcC0tvR0eE6hJaT8"
    //             }
    //         ],
    //         "external_urls": {
    //             "spotify": "https://open.spotify.com/album/6VjvYY8DPNwlybF40UyrCl"
    //         },
    //         "total_tracks": 1
    //     },
    //     "release_date": "2020-09-02",
    //     "uri": "spotify:track:48jV8AW50589btXi0Hs5f4",
    //     "features": {
    //         "danceability": 0.745,
    //         "energy": 0.387,
    //         "loudness": -12.839,
    //         "speechiness": 0.0327,
    //         "acousticness": 0.179,
    //         "instrumentalness": 0.00633,
    //         "liveness": 0.0736,
    //         "valence": 0.772,
    //         "tempo": 95.985,
    //         "popularity": 56,
    //         "key_mode": "C♯/D♭ Minor",
    //         "genres": [
    //             "bedroom soul",
    //             "ann arbor indie"
    //         ]
    //     }
    // }];
    // const songsList: Song[] = jsonToSong(sample);
    // for(const song of songsList)
    // {
    //     console.log(song.name)
    // }
}
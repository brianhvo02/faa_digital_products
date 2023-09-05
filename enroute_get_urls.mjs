import { writeFile, mkdir } from 'fs/promises';

const geonames = [
    'US',
    'Alaska',
    'Pacific',
    'Caribbean'
];

const seriesType = [
    'low',
    'high',
    'area'
];

const { GEONAME, SERIES_TYPE } = process.env;

if (!geonames.includes(GEONAME))
    throw new Error('Geoname not valid.');

if (!seriesType.includes(SERIES_TYPE))
    throw new Error('Series type not valid.');

const list = await fetch(
    `https://external-api.faa.gov/apra/enroute/chart?geoname=${
        GEONAME
    }&seriesType=${
        SERIES_TYPE
    }&format=tiff`, {
        headers: {
            'Accept': 'application/json'
        }
    }
).then(res => res.json()).then(data => data.edition.map(item => item.product.url));

await mkdir('./temp', { recursive: true });
await writeFile('./temp/enroute_urls.txt', list.join('\n'));
import AdmZip from 'adm-zip';
import { writeFile, readFile } from 'node:fs/promises';
import { getRecord } from './cifp_records.mjs';
import { extractData } from './cifp_geojson.mjs';

const downloadCIFP = async () => {
    console.log('Getting url and version')
    const { 
        edition: 
            [ {
                editionDate,
                product: {
                    url
                }
            } ]
    } = await fetch('https://external-api.faa.gov/apra/cifp/chart', {
        headers: {
            'Accept': 'application/json'
        }
    }).then(res => res.json());

    try {
        const savedEdition = await readFile('cifp_edition.txt', 'utf-8');

        if (new Date(savedEdition).getTime() === new Date(editionDate).getTime()) {
            console.log('No new edition available.');
            process.exit(1);
        }
    } catch (e) {} finally {
        await writeFile('cifp_edition.txt', editionDate);
    }
    

    console.log('Downloading CIFP');
    const cifp = await fetch(url)
        .then(res => res.arrayBuffer())
        .then(data => Buffer.from(data))
        .then(data => new AdmZip(data).getEntry('FAACIFP18').getData().toString('utf-8'));

    const lines = cifp.split('\r\n').slice(0, -1);

    console.log('Generating records');
    return lines.map(getRecord);
}

const features = await downloadCIFP().then(extractData);

const {
    airways_enroute, 
    sids, stars, approaches,
    ...waypoints
} = features;

const procedures = {
    airways_enroute, 
    sids, stars, approaches
};

await writeFile('procedures.json', JSON.stringify(procedures));
await writeFile('points.json', JSON.stringify(waypoints));
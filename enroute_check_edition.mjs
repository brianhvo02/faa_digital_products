const { edition: [ { editionDate } ]} = await fetch('https://external-api.faa.gov/apra/enroute/info', {
    headers: {
        'Accept': 'application/json'
    }
}).then(res => res.json());

try {
    const savedEdition = await readFile('enroute_edition.txt', 'utf-8');

    if (new Date(savedEdition).getTime() === new Date(editionDate).getTime()) {
        console.log('No new edition available.');
        process.exit(1);
    }
} catch (e) {} finally {
    await writeFile('enroute_edition.txt', editionDate);
}
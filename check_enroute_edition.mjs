const { GIT_LOG } = process.env;
if (!GIT_LOG)
    throw new Error('No git log provided.');

const { edition: [ { editionDate } ]} = await fetch('https://external-api.faa.gov/apra/enroute/info', {
    headers: {
        'Accept': 'application/json'
    }
}).then(res => res.json());

if (new Date(GIT_LOG.match(/(?<=Date:\s+).+/)[0]) > new Date(editionDate))
    throw new Error('No new edition available.');
const recordTypes = {
    'AS': 'grid_mora',
    'D' : 'vhf_navaids',
    'DB': 'ndb_navaids_enroute',
    'EA': 'waypoints_enroute',
    'ER': 'airways_enroute',
    'HA': 'heliports',
    'HC': 'waypoints_heliport',
    'HF': 'approaches_heliport',
    'HS': 'msas_heliport',
    'PA': 'airports',
    'PC': 'waypoints_terminal',
    'PD': 'sids',
    'PE': 'stars',
    'PF': 'approaches',
    'PG': 'runways',
    'PI': 'localizers_glideslopes',
    'PN': 'ndb_navaids_terminal',
    'PP': 'path_points',
    'PS': 'msas',
    'UC': 'airspace_controlled',
    'UR': 'airspace_restrictive',
};

const lon_lat_elev_converter = (lon, lat, elev) => [
    (
        lon[0] === 'E' ? 1 : -1
    ) * +(
        +lon.slice(1, 4)
            + 
        lon.slice(4, 6) / 60
            +
        lon.slice(6, 8) / 3600
            +
        lon.slice(8, 10) / 3600000 
    ).toFixed(6),
    (
        lat[0] === 'N' ? 1 : -1
    ) * +(
        +lat.slice(1, 3)
            +
        lat.slice(3, 5) / 60
            +
        lat.slice(5, 7) / 3600
            +
        lat.slice(7, 9) / 3600000 
    ).toFixed(6),
    ...(elev ? [+elev] : [])
];

const reduceToLines = (sortedFixes, keys) => Object.keys(sortedFixes).reduce(
    (obj, key) => {
        const { coordinates, properties } = sortedFixes[key]
            .sort((a, b) => parseInt(a.seq_nr) - parseInt(b.seq_nr))
            .reduce((payload, { coordinates, record }, i) => {
                payload.coordinates.push(coordinates);

                if (i === 0)
                    payload.properties = keys.reduce((obj, key) => ({ ...obj, [key]: [] }), {});

                Object.keys(record).forEach(recordKey => {
                    const recordValue = record[recordKey];
                    if (keys.includes(recordKey))
                        payload.properties[recordKey].push(recordValue);
                    else
                        payload.properties[recordKey] = recordValue;
                });

                return payload;
            }, { coordinates: [] });

        const feature = {
            type: 'Feature',
            id: key,
            geometry: {
                type: 'LineString',
                coordinates
            },
            properties
        };

        obj[key] = feature;
        return obj;
    }, {}
);

export const extractData = (records) => {
    console.log('Extracting data');
    const recordsByType = records.reduce((obj, record) => {
        if (!record.header_ident) {
            const type = recordTypes[record.sec_code + record.sub_code];
            if (obj[type]) {
                obj[type].push(record);
            } else {
                obj[type] = [record];
            }
        }
    
        return obj;
    }, {});
    
    const featuresByType = {};
    
    featuresByType.vhf_navaids = recordsByType.vhf_navaids.reduce((obj, record) => {
        const id = record.vor_longitude.length 
            ? record.vor_ident
            : record.dme_ident;
        const feature = {
            type: 'Feature',
            id,
            geometry: {
                type: 'MultiPoint',
                coordinates: []
            },
            properties: record
        };
    
        if (record.vor_longitude.length)
            feature.geometry.coordinates.push(lon_lat_elev_converter(record.vor_longitude, record.vor_latitude));
    
        if (record.dme_longitude.length)
            feature.geometry.coordinates.push(lon_lat_elev_converter(record.dme_longitude, record.dme_latitude, record.dme_elevation));
    
        obj[id] = feature;
        return obj;
    }, {});
    
    ['ndb_navaids_enroute', 'ndb_navaids_terminal'].forEach(key => {
        featuresByType[key] = recordsByType[key].reduce((obj, record) => {
            const id = key === 'ndb_navaids_terminal'
                ? `${record.arpt_ident}_${record.ndb_ident}`
                : record.ndb_ident;
            const feature = {
                type: 'Feature',
                id,
                geometry: {
                    type: 'Point',
                    coordinates: lon_lat_elev_converter(record.ndb_longitude, record.ndb_latitude)
                },
                properties: record
            };
    
            obj[id] = feature;
            return obj;
        }, {});
    });
    
    ['waypoints_enroute', 'waypoints_terminal', 'waypoints_heliport', 'airports', 'runways'].forEach(key => {
        featuresByType[key] = recordsByType[key].reduce((obj, record) => {
            const id = key === 'waypoints_heliport'
                ? `${record.hept_ident}_${record.waypoint_ident}`
                : key === 'waypoint_terminal'
                    ? `${record.arpt_ident}_${record.fix_identifier}`
                    : key === 'airports'
                        ? record.arpt_ident
                        : key === 'runways'
                            ? `${record.arpt_ident}_${record.runway_ident}`
                            : record.fix_identifier;
    
            const feature = {
                type: 'Feature',
                id,
                geometry: {
                    type: 'Point',
                    coordinates: lon_lat_elev_converter(record.longitude, record.latitude)
                },
                properties: record
            };
    
            obj[id] = feature;
            return obj;
        }, {});
    });

    
    const enrouteWaypoints = {
        ...featuresByType.vhf_navaids,
        ...featuresByType.ndb_navaids_enroute,
        ...featuresByType.waypoints_enroute,
    };

    const fixesByAirway = recordsByType.airways_enroute.reduce((obj, record) => {
        const { coordinates } = enrouteWaypoints[record.fix_ident].geometry;
        const fix = {
            coordinates: Array.isArray(coordinates[0]) 
                ? coordinates[0] 
                : coordinates,
            record
        };
    
        if (obj[record.route_ident]) {
            obj[record.route_ident].push(fix);
        } else {
            obj[record.route_ident] = [fix];
        }
        
        return obj;
    }, {});
    
    featuresByType.airways_enroute = reduceToLines(fixesByAirway, [
        'seq_nr',
        'fix_ident', 'fix_icao_code', 'fix_sec_code', 'fix_sub_code',
        'desc_code',
        'ob_mag_crs', 'route_from_dist', 'ib_mag_crs', 'min_altitude_1',
        'min_altitude_2', 'max_altitude', 'fix_radius', 'file_record_number'
    ]);
    
    const terminalWaypoints = {
        ...enrouteWaypoints,
        ...featuresByType.ndb_navaids_terminal,
        ...featuresByType.waypoints_terminal,
        ...featuresByType.runways,
        ...featuresByType.airports
    };
    
    ['sids', 'stars', 'approaches'].forEach(procedure => {
        const fixesByProcedure = recordsByType[procedure].reduce((obj, record) => {
            if (record.cont_nr > 1 || !record.fix_ident.length) return obj;
            const id = `${record.arpt_ident}_${record.terminal_ident}${record.trans_ident.length ? `_${record.trans_ident}` : ''}`;
            const { coordinates } = (terminalWaypoints[`${record.arpt_ident}_${record.fix_ident}`] ?? terminalWaypoints[record.fix_ident]).geometry;
            const fix = {
                coordinates: Array.isArray(coordinates[0]) 
                    ? coordinates[0] 
                    : coordinates,
                record
            };
        
            if (obj[id]) {
                obj[id].push(fix);
            } else {
                obj[id] = [fix];
            }
            
            return obj;
        }, {});
    
        featuresByType[procedure] = reduceToLines(fixesByProcedure, [
            'seq_nr',
            'fix_ident', 'fix_icao_code', 'fix_sec_code', 'fix_sub_code',
            'desc_code',
            'turn_dr', 'path_term', 'tdv', 'recd_navaid', 'recd_navaid_icao_code',
            'arc_radius', 'theta', 'rho', 'mag_crs', 'rte_dis_hold_dist_time',
            'recd_navaid_sec_code', 'recd_navaid_sub_code', 'alt_desc', 'atc',
            'altitude_1', 'altitude_2', 'trans_altitude', 'speed_limit', 'vert_angle',
            'center_fix_or_taa_pt', 'multi_cd', 'center_fix_icao_code', 'center_fix_sec_code',
            'center_fix_sub_code', 'file_record_number'
        ]);
    });

    return featuresByType;
}
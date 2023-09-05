const recordHeader = {
    s_t:                    [0],
    cust_area:              [1, 4],
    sec_code:               [4],
    sub_code:               [5, null, 12],
}

const airportIdent = {
    arpt_ident:             [6, 10],
    icao_code:              [10, 12],
}

const heliportIdent = {
    hept_ident:             [6, 10],
    icao_code:              [10, 12],
}

const coordinates = {
    latitude:               [32, 41],
    longitude:              [41, 51],
}

const recordFooter = {
    file_record_number:     [123, 128],
}

const getInfo = (str, sec1Start, sec1End, sec2Start, sec2End) => {
    if (!sec1End && !sec2Start) return str[sec1Start] === ' ' ? '' : str[sec1Start];
    const str1 = sec1End ? str.slice(sec1Start, sec1End) : str[sec1Start];
    const section = (sec2Start && str1.match(/^\s+$/)) 
        ? sec2End
            ? str.slice(sec2Start, sec2End)
            : str[sec2Start]
        : str1;
    return section.replace(/\s{2,}|\s$/, '');
}

const getRecordObj = line => {
    if (getInfo(line, 0, 3) === 'HDR') {
        if (getInfo(line, 3, 5) === '01') {
            return {
                header_ident:               [0, 3],
                header_number:              [3, 5],
                file_name:                  [5, 20],
                version_number:             [20, 23],
                production_test_flag:       [23],
                record_length:              [24, 28],
                record_count:               [28, 35],
                cycle_date:                 [35, 39],
                creation_date:              [41, 52],
                creation_time:              [52, 60],
                data_supplier_ident:        [61, 77],
                target_customer_ident:      [77, 93],
                database_part_number:       [93, 113],
                file_crc:                   [124, 132],
            };
        } else {
            return {
                header_ident:               [0, 3],
                header_number:              [3, 5],
                effective_date:             [5, 16],
                expiration_date:            [16, 27],
                supplier_text_field:        [27, 58],
                descriptive_text:           [58, 88]
            };
        }
    };

    const sectionCode = getInfo(line, 4);
    const subsectionCode = getInfo(line, 5, null, 12);
    
    if (
        (sectionCode === 'E' && subsectionCode === 'A')
            ||
        (sectionCode === 'P' && subsectionCode === 'C')
    ) {
        return {
            ...recordHeader,
            ...airportIdent,
            fix_identifier:         [13, 18],
            fix_icao_code:          [19, 21],
            cont_nr:                [21],
            type:                   [26, 29],
            usage:                  [29, 31],
            ...coordinates,
            d_mag_var:              [74, 79],
            wp_elevation:           [79, 84],
            datum:                  [84, 87],
            name_ind:               [95, 98],
            name_desc:              [98, 123],
            ...recordFooter,
        };
    }

    if (
        (sectionCode === 'D' && subsectionCode === 'B') 
            || 
        (sectionCode === 'P' && subsectionCode === 'N')
    ) {
        return {
            ...recordHeader,
            ...airportIdent,
            ndb_ident:              [13, 17],
            ndb_icao_code:          [19, 21],
            cont_nr:                [21],
            ndb_freq:               [22, 27],
            ndb_class:              [27, 32],
            ndb_latitude:           [32, 41],
            ndb_longitude:          [41, 51],
            mag_var:                [74, 79],
            datum_code:             [90, 93],
            ndb_navaid_name:        [93, 123],
            ...recordFooter,
        };
    }

    if (sectionCode === 'D') {
        return {
            ...recordHeader,
            ...airportIdent,
            vor_ident:              [13, 17],
            vor_icao_code:          [19, 21],
            cont_nr:                [21],
            vor_freq:               [22, 27],
            navaid_class:           [27, 32],
            vor_latitude:           [32, 41],
            vor_longitude:          [41, 51],
            dme_ident:              [51, 55],
            dme_latitude:           [55, 64],
            dme_longitude:          [64, 74],
            station_declination:    [74, 79],
            dme_elevation:          [79, 84],
            figure_of_merit:        [84],
            ils_dme_bias:           [85, 87],
            frequency_protection:   [87, 90],
            datum_code:             [90, 93],
            vor_name:               [93, 123],
            ...recordFooter,
        };
    }

    switch (sectionCode) {
        case 'A':
            switch (subsectionCode) {
                case 'S':
                    return {
                        ...recordHeader,
                        start_lat:              [13, 16],
                        start_long:             [16, 20],
                        ...[...Array(30).keys()].reduce((acc, cur) => {
                            acc[`mora_${cur + 1}`] = [30 + (cur * 3), 33 + (cur * 3)];
                            return acc;
                        }, {}),
                        ...recordFooter,
                    };
                default:
                    return null;
            }
        case 'E':
            switch (subsectionCode) {
                case 'R':
                    return {
                        ...recordHeader,
                        route_ident:            [13, 18],
                        six_char:               [18],
                        seq_nr:                 [25, 29],
                        fix_ident:              [29, 34],
                        fix_icao_code:          [34, 36],
                        fix_sec_code:           [36],
                        fix_sub_code:           [37],
                        cont_nr:                [38],
                        desc_code:              [39, 43],
                        bdy_code:               [43],
                        rt_type:                [44],
                        level:                  [45],
                        direct:                 [46],
                        tc_ind:                 [47, 49],
                        eu_ind:                 [49],
                        recd_vhf:               [50, 54],
                        recd_vhf_icao_code:     [54, 56],
                        rnp:                    [56, 59],
                        theta:                  [62, 66],
                        rho:                    [66, 70],
                        ob_mag_crs:             [70, 74],
                        route_from_dist:        [74, 78],
                        ib_mag_crs:             [78, 82],
                        min_altitude_1:         [83, 88],
                        min_altitude_2:         [88, 93],
                        max_altitude:           [93, 98],
                        fix_radius:             [98, 102],
                        ...recordFooter,
                    }
                default:
                    return null;
            }
        case 'H':
            switch (subsectionCode) {
                case 'A':
                    return {
                        ...recordHeader,
                        ...heliportIdent,
                        ata_iata:               [13, 16],
                        pad_ident:              [16, 21],
                        cont_nr:                [21],
                        speed_limit_altitude:   [22, 27],
                        datum_code:             [27, 30],
                        ifr:                    [30],
                        ...coordinates,
                        mag_var:                [51, 56],
                        elev:                   [56, 61],
                        speed_limit:            [61, 64],
                        recd_vhf:               [64, 68],
                        recd_vhf_icao_code:     [68, 70],
                        trans_altitude:         [70, 75],
                        trans_level:            [75, 80],
                        pub_mil:                [81],
                        time_zone:              [82, 84],
                        day_time:               [84],
                        pad_dimensions:         [85, 91],
                        m_t_ind:                [91],
                        heliport_name:          [93, 123],
                        ...recordFooter,
                    };
                case 'C':
                    return {
                        ...recordHeader,
                        ...heliportIdent,
                        waypoint_ident:         [13, 18],
                        waypoint_icoo_code:     [19, 21],
                        cont_nr :               [21],
                        type:                   [26, 29],
                        usage:                  [29, 31],
                        ...coordinates,
                        d_mag_var:              [74, 79],
                        wp_elevation:           [79, 84],
                        datum:                  [84, 87],
                        name_ind:               [95, 98],
                        name_desc:              [98, 123],
                        ...recordFooter
                    };
                case 'F':
                    if (subsectionCode === 'F' && getInfo(line, 38) > 1) {
                        return {
                            ...recordHeader,
                            ...heliportIdent,
                            terminal_ident:         [13, 19],
                            rt_type:                [19],
                            trans_ident:            [20, 25],
                            seq_nr:                 [26, 29],
                            fix_ident:              [29, 34],
                            fix_icao:               [34, 36],
                            fix_sec_code:           [36],
                            fix_sub_code:           [37],
                            cont_nr:                [38],
                            appl_type:              [39],
                            fas_block:              [40],
                            fas_level_of_service:   [41, 51],
                            lnav_vnav:              [51],
                            nav_level_of_service:   [52, 62],
                            lnav_for_sbas:          [62],
                            sbas_level_of_service:  [63, 73],
                            app_route_type_1:       [118],
                            app_route_type_2:       [119],
                            ...recordFooter,
                        };
                    } else {
                        return {
                            ...recordHeader,
                            ...heliportIdent,
                            terminal_ident:         [13, 19],
                            rt_type:                [19],
                            trans_ident:            [20, 25],
                            seq_nr:                 [26, 29],
                            fix_ident:              [29, 34],
                            fix_icao:               [34, 36],
                            fix_sec_code:           [36],
                            fix_sub_code:           [37],
                            cont_nr:                [38],
                            desc_code:              [39, 43],
                            turn_dr:                [43],
                            path_term:              [44, 46],
                            tdv:                    [49],
                            recd_navaid:            [50, 54],
                            recd_navaid_icao_code:  [54, 56],
                            arc_radius:             [56, 62],
                            theta:                  [62, 66],
                            rho:                    [66, 70],
                            mag_crs:                [70, 74],
                            rte_dis_hold_dist_time: [74, 78],
                            recd_navaid_sec_code:   [78],
                            recd_navaid_sub_code:   [79],
                            alt_desc:               [82],
                            atc:                    [83],
                            altitude_1:             [84, 89],
                            altitude_2:             [89, 94],
                            trans_altitude:         [94, 99],
                            speed_limit:            [99, 102],
                            vert_angle:             [102, 106],
                            center_fix_or_taa_pt:   [106, 111],
                            multi_cd:               [111],
                            center_fix_icao_code:   [112, 114],
                            center_fix_sec_code:    [114],
                            center_fix_sub_code:    [115],
                            gnss_fms_ind:           [116],
                            spd_lmt:                [117],
                            rte_qual_1:             [118],
                            rte_qual_2:             [119],
                            ...recordFooter,
                        };
                    }
                case 'S': 
                    return {
                        ...recordHeader,
                        ...heliportIdent,
                        msa_center:             [13, 18],
                        center_icao_code:       [18, 20],
                        center_sec_code:        [20],
                        center_sub_code:        [21],
                        multi_cd:               [22],
                        cont_nr:                [38],
                        ...[...Array(7).keys()].reduce((acc, cur) => {
                            acc[`sec_brg_${cur + 1}`] = [42 + (cur * 11), 48 + (cur * 11)];
                            acc[`sec_alt_${cur + 1}`] = [48 + (cur * 11), 51 + (cur * 11)];
                            acc[`sec_rad_${cur + 1}`] = [51 + (cur * 11), 53 + (cur * 11)];
                            return acc;
                        }, {}),
                        mag_ind:                [119],
                        ...recordFooter,
                    };
                default:
                    return null;
            }
        case 'P':
            switch (subsectionCode) {
                case 'A':
                    return {
                        ...recordHeader,
                        ...airportIdent,
                        ata_iata:               [13, 15],
                        cont_nr:                [21],
                        speed_limit_altitude:   [22, 27],
                        longest_rwy:            [27, 30],
                        ifr:                    [30],
                        long_rwy:               [31],
                        ...coordinates,
                        d_mag_var:              [51, 56],
                        elevation:              [56, 61],
                        speed_limit:            [61, 64],
                        recd_vhf:               [64, 68],
                        recd_vhf_icao_code:     [68, 70],
                        trans_altitude:         [70, 75],
                        trans_level:            [75, 80],
                        pub_mil:                [81],
                        time_zone:              [82, 84],
                        day_time:               [84],
                        m_t_ind:                [85],
                        datum_code:             [86, 89],
                        airport_name:           [93, 123],
                        ...recordFooter,
                    };
                case 'D':
                case 'E':
                case 'F':
                    if (subsectionCode === 'F' && getInfo(line, 38) > 1) {
                        return {
                            ...recordHeader,
                            ...airportIdent,
                            terminal_ident:         [13, 19],
                            rt_type:                [19],
                            trans_ident:            [20, 25],
                            seq_nr:                 [26, 29],
                            fix_ident:              [29, 34],
                            fix_icao:               [34, 36],
                            fix_sec_code:           [36],
                            fix_sub_code:           [37],
                            cont_nr:                [38],
                            appl_type:              [39],
                            fas_block:              [40],
                            fas_level_of_service:   [41, 51],
                            lnav_vnav:              [51],
                            nav_level_of_service:   [52, 62],
                            lnav_for_sbas:          [62],
                            sbas_level_of_service:  [63, 73],
                            app_route_type_1:       [118],
                            app_route_type_2:       [119],
                            ...recordFooter,
                        };
                    } else {
                        return {
                            ...recordHeader,
                            ...airportIdent,
                            terminal_ident:         [13, 19],
                            rt_type:                [19],
                            trans_ident:            [20, 25],
                            seq_nr:                 [26, 29],
                            fix_ident:              [29, 34],
                            fix_icao:               [34, 36],
                            fix_sec_code:           [36],
                            fix_sub_code:           [37],
                            cont_nr:                [38],
                            desc_code:              [39, 43],
                            turn_dr:                [43],
                            path_term:              [44, 46],
                            tdv:                    [49],
                            recd_navaid:            [50, 54],
                            recd_navaid_icao_code:  [54, 56],
                            arc_radius:             [56, 62],
                            theta:                  [62, 66],
                            rho:                    [66, 70],
                            mag_crs:                [70, 74],
                            rte_dis_hold_dist_time: [74, 78],
                            recd_navaid_sec_code:   [78],
                            recd_navaid_sub_code:   [79],
                            alt_desc:               [82],
                            atc:                    [83],
                            altitude_1:             [84, 89],
                            altitude_2:             [89, 94],
                            trans_altitude:         [94, 99],
                            speed_limit:            [99, 102],
                            vert_angle:             [102, 106],
                            center_fix_or_taa_pt:   [106, 111],
                            multi_cd:               [111],
                            center_fix_icao_code:   [112, 114],
                            center_fix_sec_code:    [114],
                            center_fix_sub_code:    [115],
                            gnss_fms_ind:           [116],
                            rte_spd_lmt:                [117],
                            rte_qual_1:             [118],
                            rte_qual_2:             [119],
                            ...recordFooter,
                        };
                    }
                case 'G':
                    return {
                        ...recordHeader,
                        ...airportIdent,
                        runway_ident:           [13, 18],
                        cont_nr:                [21],
                        runway_length:          [22, 27],
                        runway_bearing:         [27, 31],
                        ...coordinates,
                        rwy_grad:               [51, 56],
                        ellipsoid_height:       [60, 66],
                        lndg_thres_elev:        [66, 71],
                        dsplcd_thr:             [71, 75],
                        tch:                    [75, 77],
                        width:                  [77, 80],
                        path_point_tch:         [80],
                        loc_mls_gls_ident:      [81, 85],
                        cat_class:              [85],
                        stopway:                [86, 90],
                        sec_loc_mls_gls_ident:  [90, 94],
                        sec_cat_class:          [94],
                        runway_description:     [101, 123],
                        ...recordFooter,
                    };
                case 'I':
                    return {
                        ...recordHeader,
                        ...airportIdent,
                        loc_ident:              [13, 17],
                        cat:                    [17],
                        cont_nr:                [21],
                        freq:                   [22, 27],
                        runway_ident:           [27, 32],
                        loc_latitude:           [32, 41],
                        loc_longitude:          [41, 51],
                        loc_brg:                [51, 55],
                        gs_latitude:            [55, 64],
                        gs_longitude:           [64, 74],
                        loc_fr_rw_end:          [74, 78],
                        loc_azi_pos_ref:        [78],
                        gs_fr_rw_thresh:        [79, 83],
                        loc_width:              [83, 87],
                        gs_angle:               [87, 90],
                        sta_decl:               [90, 95],
                        tch:                    [95, 97],
                        gs_elev:                [97, 102],
                        support_facility:       [102, 106],
                        sup_fac_icao_code:      [106, 108],
                        sup_fac_sec_code:       [108],
                        sup_fac_sub_code:       [109],
                        ...recordFooter,
                    };
                case 'P':
                    if (getInfo(line, 26) > 1) {
                        return {
                            ...recordHeader,
                            ...airportIdent,
                            approach_ident:         [13, 19],
                            runway_ident:           [19, 24],
                            ops_type:               [24, 26],
                            cont_nr:                [26],
                            appl_type:              [27],
                            fpap_ellipsoid:         [28, 34],
                            fpap_orthometric:       [34, 40],
                            ltp_orthometric:        [40, 46],
                            approach_type_ident:    [46, 56],
                            gnss_channel_no:        [56, 61],
                            hpc:                    [71, 74],
                            ...recordFooter,
                        };
                    } else {
                        return {
                            ...recordHeader,
                            ...airportIdent,
                            approach_ident:         [13, 19],
                            runway_ident:           [19, 24],
                            ops_type:               [24, 26],
                            cont_nr:                [26],
                            rte_ind:                [27],
                            sbas_spi:               [28, 30],
                            ref_path_data_sel:      [30, 32],
                            ref_path_data_ident:    [32, 36],
                            app_pd:                 [36],
                            ltp_latitude:           [37, 48],
                            ltp_longitude:          [48, 60],
                            ltp_ellipsoid_height:   [60, 66],
                            gpa:                    [66, 70],
                            fpap_latitude:          [70, 81],
                            fpap_longitude:         [81, 93],
                            course_width_at_thres:  [93, 98],
                            length_offset:          [98, 102],
                            path_point_tch:         [102, 108],
                            tch_ind:                [108],
                            hal:                    [109, 112],
                            val:                    [112, 115],
                            crc:                    [115, 123],
                            ...recordFooter,
                        };
                    }
                case 'S': 
                    return {
                        ...recordHeader,
                        ...airportIdent,
                        msa_center:             [13, 18],
                        center_icao_code:       [18, 20],
                        center_sec_code:        [20],
                        center_sub_code:        [21],
                        multi_cd:               [22],
                        cont_nr:                [38],
                        ...[...Array(7).keys()].reduce((acc, cur) => {
                            acc[`sec_brg_${cur + 1}`] = [42 + (cur * 11), 48 + (cur * 11)];
                            acc[`sec_alt_${cur + 1}`] = [48 + (cur * 11), 51 + (cur * 11)];
                            acc[`sec_rad_${cur + 1}`] = [51 + (cur * 11), 53 + (cur * 11)];
                            return acc;
                        }, {}),
                        mag_ind:                [119],
                        ...recordFooter,
                    };
                default:
                    return null;
            }
        case 'U':
            switch (subsectionCode) {
                case 'C':
                    return {
                        ...recordHeader,
                        icao_code:              [6, 8],
                        arsp_type:              [8],
                        airspace_center:        [9, 14],
                        center_sec_code:        [14],
                        center_sub_code:        [15],
                        as_class:               [16],
                        multi_cd:               [19],
                        seq_nr:                 [20, 24],
                        cont_nr:                [24],
                        level:                  [25],
                        time_cd:                [26],
                        notam:                  [27],
                        bdry_via:               [30, 32],
                        ...coordinates,
                        arc_origin_latitude:    [51, 60],
                        arc_origin_longitude:   [60, 70],
                        arc_dist:               [70, 74],
                        arc_brg:                [74, 78],
                        rnp:                    [78, 81],
                        lower_limit:            [81, 86],
                        lower_limit_unit_ind:   [86],
                        upper_limit:            [87, 92],
                        upper_limit_unit_ind:   [92],
                        airspace_name:          [93, 123],
                        ...recordFooter,
                    }
                case 'R':
                    if (getInfo(line, 24) > 1) {
                        return {
                            ...recordHeader,
                            icao_code:              [6, 8],
                            rest_type:              [8],
                            airspace_designation:   [9, 19],
                            multi_cd:               [19],
                            seq_nr:                 [20, 24],
                            cont_nr:                [24],
                            appl_type:              [25],
                            time_cd:                [26],
                            notam:                  [27],
                            time_ind:               [28],
                            ...[...Array(7).keys()].reduce((acc, cur) => {
                                acc[`time_of_operation_${cur + 1}`] = [29 + (cur * 10), 39 + (cur * 10)];
                                return acc;
                            }, {}),
                            controlling_agency:     [99, 123],
                            ...recordFooter,
                        }
                    } else {
                        return {
                            ...recordHeader,
                            icao_code:              [6, 8],
                            rest_type:              [8],
                            airspace_designation:   [9, 19],
                            multi_cd:               [19],
                            seq_nr:                 [20, 24],
                            cont_nr:                [24],
                            level:                  [25],
                            time_cd:                [26],
                            notam:                  [27],
                            bdry_via:               [30, 32],
                            ...coordinates,
                            arc_origin_latitude:    [51, 60],
                            arc_origin_longitude:   [60, 70],
                            arc_dist:               [70, 74],
                            arc_brg:                [74, 78],
                            lower_limit:            [81, 86],
                            lower_limit_unit_ind:   [86],
                            upper_limit:            [87, 92],
                            upper_limit_unit_ind:   [92],
                            rest_airspace_name:     [93, 123],
                            ...recordFooter,
                        }
                    }
                default:
                    return null;
            }
        default:
            return null;
    }
}

export const getRecord = line => {
    const obj = getRecordObj(line);
    if (!obj) return line;
    const newObj = {};

    for (const key in obj) {
        newObj[key] = getInfo(line, ...obj[key]);
    }

    return newObj;
}
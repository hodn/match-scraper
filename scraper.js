const axios = require('axios');
const cheerio = require('cheerio');
const cheerioTableparser = require('cheerio-tableparser');

async function start() {

    const path = require('path');
    const icalGenerator = require(path.resolve(__dirname, "./icalGenerator.js"));

    const url = "https://www.psmf.cz/souteze/2025-hanspaulska-liga-jaro/5-f/tymy/team-bambus/";
    const includeMatches = true;
    const includeReferees = true;

    try {
        const response = await axios.get(url, {
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "en-GB,en;q=0.9,cs-CZ;q=0.8,cs;q=0.7,en-US;q=0.6",
                "cache-control": "max-age=0",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "same-origin",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            referrer: url,
            referrerPolicy: "strict-origin-when-cross-origin",
            method: "GET",
            mode: "cors",
            credentials: "include"
        });
        const $ = cheerio.load(response.data);
        cheerioTableparser($)

        let events = [];

        // Getting match table and parsing into table
        if (includeMatches) {
            const matches = parseEvents($("table.component__table.has-wrapper.games-new-table").parsetable(), false);
            events.push(...matches)
        }

        // Getting refereeing table and parsing into table 
        if (includeReferees) {
            const refs = parseEvents($("table.component__table.has-wrapper.referees-table").parsetable(), true);
            events.push(...refs)
        }

        const ics = icalGenerator(url, events);
        console.log(ics.toString())

        return {
            statusCode: 200,
            body: ics.toString()
        };

    } catch (e) {
        console.log(e)
        return {
            statusCode: 400,
            body: JSON.stringify(e)
        }
    }

}

function parseEvents(parsedData, isReferee) {

    let dates = parsedData[0].slice(1);
    let times = parsedData[1].slice(1);
    let pitches = parsedData[2].slice(1);
    let teams = parsedData[3].slice(1);
    let rounds = isReferee ? [] : parsedData[4].slice(1);
    let teamNames = [];
    let teamColors = [];
    let pitchLinks = [];

    let events = [];


    // Parsing team match pairs and their shirts
    teams.forEach(team => {
        const $ = cheerio.load(team);
        let names = $('a');
        let colors = isReferee ? $('a.component__table-shirt').toArray() : $('a.component__table-shirt.dress-color-action').toArray();

        $(colors).each(function (index, value) {
            teamColors.push($(this).attr('title'))
        });

        $(names).each(function (index, value) {
            teamNames.push($(this).text())
        });

    });

    // Parsing pitches and creating links to them
    pitches.forEach(pitch => {
        const $ = cheerio.load(pitch);
        const pitchLink = $('a').attr('href')
        pitchLinks.push('https://www.psmf.cz' + pitchLink);

    });

    // Clearing out empty values - neccessary due to weird original formatting
    teamNames = teamNames.filter(n => n);

    // Connecting the data together
    for (let index = 0; index < dates.length; index++) {

        let event = {
            homeTeam: teamNames[index * 2],
            homeColors: teamColors[index * 2],
            awayTeam: teamNames[index * 2 + 1],
            awayColors: teamColors[index * 2 + 1],
            date: dates[index].split(';')[1],
            time: times[index],
            round: isReferee ? "--." : rounds[index],
            pitch: pitchLinks[index],
            isReferee
        }

        events.push(event);
    }
    return events;
}

start()
